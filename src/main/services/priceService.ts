import Database from 'better-sqlite3'
import { AssetRepository } from '../database/repositories/assetRepository'
import { PriceHistoryRepository } from '../database/repositories/priceHistoryRepository'
import { SettingsRepository } from '../database/repositories/settingsRepository'
import { getCryptoPrices, searchCryptoCoins } from './coinGeckoApi'
import { getStockPrices, searchTickers, getHistoricalAdjustedPrice } from './yahooFinanceApi'
import { getUsdToAmdRate, getExchangeRateApiRates } from './exchangeRateApi'
import { Asset, AssetWithPrice, PriceData, TickerSearchResult, PortfolioBreakdown } from '../../shared/types'
import { format } from 'date-fns'

let updateInterval: ReturnType<typeof setInterval> | null = null

// In-memory cache
const priceCache = new Map<string, { data: PriceData; timestamp: number }>()
let usdToAmdRate: number | null = null
let usdToAmdRateTimestamp = 0

const PRICE_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes
const FX_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function getUsdAmdRate(): Promise<number> {
  const now = Date.now()
  if (usdToAmdRate && now - usdToAmdRateTimestamp < FX_CACHE_DURATION) {
    return usdToAmdRate
  }

  const rate = await getUsdToAmdRate()
  if (rate) {
    usdToAmdRate = rate
    usdToAmdRateTimestamp = now
  }

  return usdToAmdRate ?? 390 // Fallback rate
}

export async function refreshAllPrices(db: Database.Database): Promise<void> {
  const assetRepo = new AssetRepository(db)
  const priceRepo = new PriceHistoryRepository(db)
  const assets = assetRepo.getAll()

  // Group assets by type
  const cryptoAssets = assets.filter((a) => a.asset_type === 'crypto' && a.api_id)
  const stockAssets = assets.filter(
    (a) => ['stock', 'etf', 'bond'].includes(a.asset_type) && a.ticker
  )

  // Fetch crypto prices
  if (cryptoAssets.length > 0) {
    const coinIds = cryptoAssets.map((a) => a.api_id!)
    const prices = await getCryptoPrices(coinIds)

    const amdRate = await getUsdAmdRate()

    for (const asset of cryptoAssets) {
      const price = prices.get(asset.api_id!)
      if (price) {
        price.price_amd = price.price_usd * amdRate
        priceCache.set(`crypto:${asset.api_id}`, { data: price, timestamp: Date.now() })

        const today = format(new Date(), 'yyyy-MM-dd')
        priceRepo.upsert(asset.id, price.price_usd, price.price_amd, today, 'coingecko')
      }
    }
  }

  // Fetch stock/ETF prices
  if (stockAssets.length > 0) {
    const tickers = stockAssets.map((a) => a.ticker!)
    const prices = await getStockPrices(tickers)

    const amdRate = await getUsdAmdRate()

    for (const asset of stockAssets) {
      const price = prices.get(asset.ticker!)
      if (price) {
        price.price_amd = price.price_usd * amdRate
        priceCache.set(`stock:${asset.ticker}`, { data: price, timestamp: Date.now() })

        const today = format(new Date(), 'yyyy-MM-dd')
        priceRepo.upsert(asset.id, price.price_usd, price.price_amd, today, 'yahoo')
      }
    }
  }

  // Refresh exchange rates
  await refreshExchangeRates(db)
}

async function refreshExchangeRates(db: Database.Database): Promise<void> {
  const priceRepo = new PriceHistoryRepository(db)

  try {
    const rates = await getExchangeRateApiRates('USD')
    const today = format(new Date(), 'yyyy-MM-dd')

    for (const [currency, rate] of Object.entries(rates)) {
      priceRepo.upsertExchangeRate('USD', currency, rate, today, 'exchangerate-api')
    }
  } catch (error) {
    console.error('Failed to refresh exchange rates:', error)
  }
}

export function getCachedPrice(assetType: string, identifier: string): PriceData | null {
  const key = `${assetType}:${identifier}`
  const cached = priceCache.get(key)

  if (!cached) return null
  if (Date.now() - cached.timestamp > PRICE_CACHE_DURATION) {
    priceCache.delete(key)
    return null
  }

  return cached.data
}

export async function getAssetCurrentPrice(
  asset: Asset,
  db: Database.Database
): Promise<PriceData | null> {
  // For cash, return 1:1
  if (asset.asset_type === 'cash') {
    const amdRate = await getUsdAmdRate()
    const currencyCode = asset.currency_code || 'USD'

    if (currencyCode === 'USD') {
      return {
        price_usd: 1,
        price_amd: amdRate,
        change_24h_percent: null,
        source: 'fixed',
        updated_at: new Date().toISOString()
      }
    }

    // Convert from other currencies
    const rates = await getExchangeRateApiRates(currencyCode)
    const usdRate = rates['USD']
    if (usdRate) {
      return {
        price_usd: usdRate,
        price_amd: usdRate * amdRate,
        change_24h_percent: null,
        source: 'exchangerate-api',
        updated_at: new Date().toISOString()
      }
    }
    return null
  }

  // For tradeable assets, check cache first
  if (asset.asset_type === 'crypto' && asset.api_id) {
    const cached = getCachedPrice('crypto', asset.api_id)
    if (cached) return cached
  }

  if (['stock', 'etf', 'bond'].includes(asset.asset_type) && asset.ticker) {
    const cached = getCachedPrice('stock', asset.ticker)
    if (cached) return cached
  }

  // For non-tradeable assets, use estimated_value
  if (['real_estate', 'vehicle', 'collectible', 'electronics', 'other'].includes(asset.asset_type)) {
    if (asset.estimated_value) {
      const amdRate = await getUsdAmdRate()
      const valueCurrency = asset.value_currency || 'USD'
      let valueUsd = asset.estimated_value

      if (valueCurrency !== 'USD') {
        const rates = await getExchangeRateApiRates(valueCurrency)
        valueUsd = asset.estimated_value * (rates['USD'] ?? 1)
      }

      return {
        price_usd: valueUsd,
        price_amd: valueUsd * amdRate,
        change_24h_percent: null,
        source: 'manual',
        updated_at: asset.updated_at
      }
    }
    return null
  }

  // Check database for last known price
  const priceRepo = new PriceHistoryRepository(db)
  const lastPrice = priceRepo.getLatestByAssetId(asset.id)
  if (lastPrice) {
    return {
      price_usd: lastPrice.price_usd,
      price_amd: lastPrice.price_amd,
      change_24h_percent: null,
      source: lastPrice.source,
      updated_at: lastPrice.date
    }
  }

  return null
}

export async function getAssetsWithPrices(db: Database.Database): Promise<AssetWithPrice[]> {
  const assetRepo = new AssetRepository(db)
  const assets = assetRepo.getAll()
  const result: AssetWithPrice[] = []

  for (const asset of assets) {
    const price = await getAssetCurrentPrice(asset, db)

    let totalValueUsd: number | null = null
    let totalValueAmd: number | null = null
    let gainLossUsd: number | null = null
    let gainLossPercent: number | null = null
    let adjustedPurchasePrice: number | null = null
    let splitFactor: number | null = null

    if (price) {
      if (asset.asset_type === 'cash') {
        totalValueUsd = (asset.quantity ?? 0) * price.price_usd
        totalValueAmd = (asset.quantity ?? 0) * (price.price_amd ?? 0)
      } else if (['real_estate', 'vehicle', 'collectible', 'electronics', 'other'].includes(asset.asset_type)) {
        totalValueUsd = price.price_usd
        totalValueAmd = price.price_amd
      } else {
        totalValueUsd = (asset.quantity ?? 0) * price.price_usd
        totalValueAmd = (asset.quantity ?? 0) * (price.price_amd ?? 0)
      }

      // For tradeable assets with a purchase date, fetch split-adjusted historical price
      const isTradeable = ['stock', 'etf', 'bond'].includes(asset.asset_type)
      if (isTradeable && asset.ticker && asset.purchase_date) {
        const historical = await getHistoricalAdjustedPrice(asset.ticker, asset.purchase_date)
        if (historical) {
          splitFactor = historical.splitFactor

          if (asset.purchase_price) {
            // Adjust user's purchase price for splits/dilutions since purchase
            // splitFactor < 1 means shares were diluted, so each old share is worth less
            adjustedPurchasePrice = asset.purchase_price * splitFactor
          } else {
            // No purchase price entered — use the historical adjusted close
            adjustedPurchasePrice = historical.adjustedClose
          }

          if (adjustedPurchasePrice && totalValueUsd !== null) {
            const costBasis = adjustedPurchasePrice * (asset.quantity ?? 1)
            gainLossUsd = totalValueUsd - costBasis
            gainLossPercent = costBasis > 0 ? ((totalValueUsd - costBasis) / costBasis) * 100 : null
          }
        }
      }

      // Fallback: non-tradeable or no historical data — use raw purchase_price
      if (gainLossUsd === null && asset.purchase_price && totalValueUsd !== null) {
        let purchasePriceUsd = asset.purchase_price

        // For manual-value assets, purchase_price is in the same currency as estimated_value
        if (['real_estate', 'vehicle', 'collectible', 'electronics', 'other'].includes(asset.asset_type)) {
          const valueCurrency = asset.value_currency || 'USD'
          if (valueCurrency !== 'USD') {
            const rates = await getExchangeRateApiRates(valueCurrency)
            purchasePriceUsd = asset.purchase_price * (rates['USD'] ?? 1)
          }
        }

        const costBasis = purchasePriceUsd * (asset.quantity ?? 1)
        gainLossUsd = totalValueUsd - costBasis
        gainLossPercent = costBasis > 0 ? ((totalValueUsd - costBasis) / costBasis) * 100 : null
      }
    }

    result.push({
      ...asset,
      current_price_usd: price?.price_usd ?? null,
      current_price_amd: price?.price_amd ?? null,
      total_value_usd: totalValueUsd,
      total_value_amd: totalValueAmd,
      gain_loss_usd: gainLossUsd,
      gain_loss_percent: gainLossPercent,
      adjusted_purchase_price: adjustedPurchasePrice,
      split_factor: splitFactor
    })
  }

  return result
}

export async function createPortfolioSnapshot(db: Database.Database): Promise<void> {
  const priceRepo = new PriceHistoryRepository(db)
  const assetsWithPrices = await getAssetsWithPrices(db)

  const today = format(new Date(), 'yyyy-MM-dd')
  let totalUsd = 0
  let totalAmd = 0
  const breakdown: PortfolioBreakdown = {}

  for (const asset of assetsWithPrices) {
    const valueUsd = asset.total_value_usd ?? 0
    const valueAmd = asset.total_value_amd ?? 0
    totalUsd += valueUsd
    totalAmd += valueAmd

    if (!breakdown[asset.asset_type]) {
      breakdown[asset.asset_type] = {
        value_usd: 0,
        value_amd: 0,
        percentage: 0,
        assets: []
      }
    }

    breakdown[asset.asset_type].value_usd += valueUsd
    breakdown[asset.asset_type].value_amd += valueAmd
    breakdown[asset.asset_type].assets.push({
      id: asset.id,
      name: asset.name,
      value_usd: valueUsd,
      value_amd: valueAmd
    })
  }

  // Calculate percentages
  for (const type of Object.keys(breakdown)) {
    breakdown[type].percentage = totalUsd > 0 ? (breakdown[type].value_usd / totalUsd) * 100 : 0
  }

  priceRepo.upsertSnapshot(today, totalUsd, totalAmd, JSON.stringify(breakdown))
}

export async function searchTickerAll(query: string, assetType?: string): Promise<TickerSearchResult[]> {
  if (assetType === 'crypto') {
    return searchCryptoCoins(query)
  }
  if (assetType === 'stock' || assetType === 'etf' || assetType === 'bond') {
    return searchTickers(query)
  }

  // Search both
  const [cryptoResults, stockResults] = await Promise.all([
    searchCryptoCoins(query),
    searchTickers(query)
  ])

  return [...stockResults, ...cryptoResults].slice(0, 15)
}

export function startPriceUpdateScheduler(db: Database.Database): void {
  const settingsRepo = new SettingsRepository(db)
  const settings = settingsRepo.getAll()
  const intervalMs = settings.update_interval_minutes * 60 * 1000

  // Initial refresh
  setTimeout(() => {
    refreshAllPrices(db).catch(console.error)
    createPortfolioSnapshot(db).catch(console.error)
  }, 5000)

  updateInterval = setInterval(() => {
    refreshAllPrices(db).catch(console.error)
    createPortfolioSnapshot(db).catch(console.error)
  }, intervalMs)
}

export function stopPriceUpdateScheduler(): void {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
}
