import { PriceData, TickerSearchResult } from '../../shared/types'

const BASE_URL = 'https://api.coingecko.com/api/v3'

let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 2100 // ~30 req/min

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()
  return fetch(url)
}

export async function getCryptoPrices(
  coinIds: string[]
): Promise<Map<string, PriceData>> {
  const result = new Map<string, PriceData>()
  if (coinIds.length === 0) return result

  // Batch up to 50 coins per request
  const batches: string[][] = []
  for (let i = 0; i < coinIds.length; i += 50) {
    batches.push(coinIds.slice(i, i + 50))
  }

  for (const batch of batches) {
    try {
      const ids = batch.join(',')
      const response = await rateLimitedFetch(
        `${BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      )

      if (!response.ok) {
        console.error(`CoinGecko API error: ${response.status}`)
        continue
      }

      const data = await response.json()

      for (const coinId of batch) {
        const coinData = data[coinId]
        if (coinData) {
          result.set(coinId, {
            price_usd: coinData.usd,
            price_amd: null, // Will be converted later
            change_24h_percent: coinData.usd_24h_change ?? null,
            source: 'coingecko',
            updated_at: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.error('CoinGecko API error:', error)
    }
  }

  return result
}

export async function searchCryptoCoins(query: string): Promise<TickerSearchResult[]> {
  try {
    const response = await rateLimitedFetch(
      `${BASE_URL}/search?query=${encodeURIComponent(query)}`
    )

    if (!response.ok) return []

    const data = await response.json()
    return (data.coins || []).slice(0, 10).map((coin: { id: string; symbol: string; name: string }) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      type: 'crypto',
      exchange: `CoinGecko ID: ${coin.id}`
    }))
  } catch {
    return []
  }
}

export async function getCoinIdBySymbol(symbol: string): Promise<string | null> {
  try {
    const response = await rateLimitedFetch(
      `${BASE_URL}/search?query=${encodeURIComponent(symbol)}`
    )

    if (!response.ok) return null

    const data = await response.json()
    const match = data.coins?.find(
      (c: { symbol: string }) => c.symbol.toLowerCase() === symbol.toLowerCase()
    )
    return match?.id ?? null
  } catch {
    return null
  }
}
