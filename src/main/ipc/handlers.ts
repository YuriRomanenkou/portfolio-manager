import { ipcMain, dialog } from 'electron'
import Database from 'better-sqlite3'
import { writeFileSync } from 'fs'
import { IPC_CHANNELS } from './channels'
import { AssetRepository } from '../database/repositories/assetRepository'
import { TransactionRepository } from '../database/repositories/transactionRepository'
import { PriceHistoryRepository } from '../database/repositories/priceHistoryRepository'
import { SettingsRepository } from '../database/repositories/settingsRepository'
import {
  getAssetsWithPrices,
  refreshAllPrices,
  createPortfolioSnapshot,
  searchTickerAll,
  getUsdAmdRate
} from '../services/priceService'
import { generateRecommendations, getIdealAllocation, getRiskScore } from '../services/recommendationEngine'
import { CreateAssetInput, UpdateAssetInput, CreateTransactionInput } from '../../shared/types'

export function registerIpcHandlers(db: Database.Database): void {
  const assetRepo = new AssetRepository(db)
  const transactionRepo = new TransactionRepository(db)
  const priceRepo = new PriceHistoryRepository(db)
  const settingsRepo = new SettingsRepository(db)

  // ─── Assets ────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.ASSETS_GET_ALL, async () => {
    try {
      return { success: true, data: await getAssetsWithPrices(db) }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.ASSETS_GET_BY_ID, async (_event, id: number) => {
    try {
      const asset = assetRepo.getById(id)
      return { success: true, data: asset }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.ASSETS_CREATE, async (_event, input: CreateAssetInput) => {
    try {
      const asset = assetRepo.create(input)
      return { success: true, data: asset }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.ASSETS_UPDATE, async (_event, input: UpdateAssetInput) => {
    try {
      const asset = assetRepo.update(input)
      return { success: true, data: asset }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.ASSETS_DELETE, async (_event, id: number) => {
    try {
      assetRepo.delete(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // ─── Transactions ──────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.TRANSACTIONS_GET_BY_ASSET, async (_event, assetId: number) => {
    try {
      return { success: true, data: transactionRepo.getByAssetId(assetId) }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TRANSACTIONS_CREATE, async (_event, input: CreateTransactionInput) => {
    try {
      const transaction = transactionRepo.create(input)

      // If it's a valuation_update, update the asset's estimated_value
      if (input.type === 'valuation_update') {
        assetRepo.update({
          id: input.asset_id,
          estimated_value: input.total_value,
          value_currency: input.currency
        })
      }

      // If it's buy/sell, update quantity
      if (input.type === 'buy' && input.quantity) {
        const asset = assetRepo.getById(input.asset_id)
        if (asset) {
          assetRepo.update({
            id: input.asset_id,
            quantity: (asset.quantity ?? 0) + input.quantity
          })
        }
      }
      if (input.type === 'sell' && input.quantity) {
        const asset = assetRepo.getById(input.asset_id)
        if (asset) {
          assetRepo.update({
            id: input.asset_id,
            quantity: Math.max(0, (asset.quantity ?? 0) - input.quantity)
          })
        }
      }

      return { success: true, data: transaction }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TRANSACTIONS_DELETE, async (_event, id: number) => {
    try {
      transactionRepo.delete(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // ─── Prices ────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.PRICES_REFRESH, async () => {
    try {
      await refreshAllPrices(db)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.PRICES_GET_HISTORY, async (_event, assetId: number) => {
    try {
      return { success: true, data: priceRepo.getByAssetId(assetId) }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.PRICES_SEARCH_TICKER, async (_event, query: string, assetType?: string) => {
    try {
      const results = await searchTickerAll(query, assetType)
      return { success: true, data: results }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // ─── Exchange Rates ────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.EXCHANGE_RATES_GET, async () => {
    try {
      const rate = await getUsdAmdRate()
      return { success: true, data: { usd_to_amd: rate } }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // ─── Portfolio ─────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.PORTFOLIO_GET_SNAPSHOTS, async (_event, limit?: number) => {
    try {
      return { success: true, data: priceRepo.getSnapshots(limit ?? 365) }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.PORTFOLIO_CREATE_SNAPSHOT, async () => {
    try {
      await createPortfolioSnapshot(db)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.PORTFOLIO_GET_STATS, async () => {
    try {
      const assets = await getAssetsWithPrices(db)
      const totalUsd = assets.reduce((sum, a) => sum + (a.total_value_usd ?? 0), 0)
      const totalAmd = assets.reduce((sum, a) => sum + (a.total_value_amd ?? 0), 0)
      const totalGainLoss = assets.reduce((sum, a) => sum + (a.gain_loss_usd ?? 0), 0)

      const byType: Record<string, { value_usd: number; count: number; percentage: number }> = {}
      for (const asset of assets) {
        const type = asset.asset_type
        if (!byType[type]) byType[type] = { value_usd: 0, count: 0, percentage: 0 }
        byType[type].value_usd += asset.total_value_usd ?? 0
        byType[type].count++
      }
      for (const type of Object.keys(byType)) {
        byType[type].percentage = totalUsd > 0 ? (byType[type].value_usd / totalUsd) * 100 : 0
      }

      return {
        success: true,
        data: {
          total_value_usd: totalUsd,
          total_value_amd: totalAmd,
          total_gain_loss_usd: totalGainLoss,
          asset_count: assets.length,
          by_type: byType
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // ─── Settings ──────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    try {
      return { success: true, data: settingsRepo.getAll() }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, settings: Record<string, string>) => {
    try {
      settingsRepo.setAll(settings as any)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // ─── Recommendations ──────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.RECOMMENDATIONS_GET, async () => {
    try {
      const assets = await getAssetsWithPrices(db)
      const settings = settingsRepo.getAll()
      const recommendations = generateRecommendations(assets, settings.risk_profile)
      const idealAllocation = getIdealAllocation(settings.risk_profile)
      const riskScore = getRiskScore(assets)

      return {
        success: true,
        data: {
          recommendations,
          idealAllocation,
          riskScore,
          riskProfile: settings.risk_profile
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // ─── Export ────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.EXPORT_CSV, async () => {
    try {
      const assets = await getAssetsWithPrices(db)
      const headers = ['Название', 'Тип', 'Тикер', 'Количество', 'Стоимость (USD)', 'Стоимость (AMD)', 'Прибыль/Убыток (USD)', 'Прибыль/Убыток (%)']
      const rows = assets.map((a) => [
        a.name,
        a.asset_type,
        a.ticker ?? '',
        a.quantity ?? '',
        a.total_value_usd?.toFixed(2) ?? '',
        a.total_value_amd?.toFixed(2) ?? '',
        a.gain_loss_usd?.toFixed(2) ?? '',
        a.gain_loss_percent?.toFixed(2) ?? ''
      ])

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

      const result = await dialog.showSaveDialog({
        defaultPath: `portfolio_${new Date().toISOString().split('T')[0]}.csv`,
        filters: [{ name: 'CSV', extensions: ['csv'] }]
      })

      if (!result.canceled && result.filePath) {
        writeFileSync(result.filePath, '\ufeff' + csv, 'utf-8') // BOM for Excel
        return { success: true, data: result.filePath }
      }
      return { success: false, error: 'Отменено' }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.EXPORT_JSON, async () => {
    try {
      const assets = await getAssetsWithPrices(db)

      const result = await dialog.showSaveDialog({
        defaultPath: `portfolio_${new Date().toISOString().split('T')[0]}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      })

      if (!result.canceled && result.filePath) {
        writeFileSync(result.filePath, JSON.stringify(assets, null, 2), 'utf-8')
        return { success: true, data: result.filePath }
      }
      return { success: false, error: 'Отменено' }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
