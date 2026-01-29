import { ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/channels'
import type {
  AssetWithPrice,
  Asset,
  CreateAssetInput,
  UpdateAssetInput,
  Transaction,
  CreateTransactionInput,
  PriceHistory,
  PortfolioSnapshot,
  Settings,
  Recommendation,
  TickerSearchResult
} from '../shared/types'

interface IpcResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

async function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  const result: IpcResult<T> = await ipcRenderer.invoke(channel, ...args)
  if (!result.success) {
    throw new Error(result.error ?? 'Unknown error')
  }
  return result.data as T
}

export const api = {
  // Assets
  assets: {
    getAll: () => invoke<AssetWithPrice[]>(IPC_CHANNELS.ASSETS_GET_ALL),
    getById: (id: number) => invoke<Asset>(IPC_CHANNELS.ASSETS_GET_BY_ID, id),
    create: (input: CreateAssetInput) => invoke<Asset>(IPC_CHANNELS.ASSETS_CREATE, input),
    update: (input: UpdateAssetInput) => invoke<Asset>(IPC_CHANNELS.ASSETS_UPDATE, input),
    delete: (id: number) => invoke<void>(IPC_CHANNELS.ASSETS_DELETE, id)
  },

  // Transactions
  transactions: {
    getByAsset: (assetId: number) =>
      invoke<Transaction[]>(IPC_CHANNELS.TRANSACTIONS_GET_BY_ASSET, assetId),
    create: (input: CreateTransactionInput) =>
      invoke<Transaction>(IPC_CHANNELS.TRANSACTIONS_CREATE, input),
    delete: (id: number) => invoke<void>(IPC_CHANNELS.TRANSACTIONS_DELETE, id)
  },

  // Prices
  prices: {
    refresh: () => invoke<void>(IPC_CHANNELS.PRICES_REFRESH),
    getHistory: (assetId: number) =>
      invoke<PriceHistory[]>(IPC_CHANNELS.PRICES_GET_HISTORY, assetId),
    searchTicker: (query: string, assetType?: string) =>
      invoke<TickerSearchResult[]>(IPC_CHANNELS.PRICES_SEARCH_TICKER, query, assetType)
  },

  // Exchange Rates
  exchangeRates: {
    get: () => invoke<{ usd_to_amd: number }>(IPC_CHANNELS.EXCHANGE_RATES_GET)
  },

  // Portfolio
  portfolio: {
    getSnapshots: (limit?: number) =>
      invoke<PortfolioSnapshot[]>(IPC_CHANNELS.PORTFOLIO_GET_SNAPSHOTS, limit),
    createSnapshot: () => invoke<void>(IPC_CHANNELS.PORTFOLIO_CREATE_SNAPSHOT),
    getStats: () =>
      invoke<{
        total_value_usd: number
        total_value_amd: number
        total_gain_loss_usd: number
        asset_count: number
        by_type: Record<string, { value_usd: number; count: number; percentage: number }>
      }>(IPC_CHANNELS.PORTFOLIO_GET_STATS)
  },

  // Settings
  settings: {
    get: () => invoke<Settings>(IPC_CHANNELS.SETTINGS_GET),
    set: (settings: Partial<Settings>) => invoke<void>(IPC_CHANNELS.SETTINGS_SET, settings)
  },

  // Recommendations
  recommendations: {
    get: () =>
      invoke<{
        recommendations: Recommendation[]
        idealAllocation: Record<string, number>
        riskScore: number
        riskProfile: string
      }>(IPC_CHANNELS.RECOMMENDATIONS_GET)
  },

  // Export
  export: {
    csv: () => invoke<string>(IPC_CHANNELS.EXPORT_CSV),
    json: () => invoke<string>(IPC_CHANNELS.EXPORT_JSON)
  }
}

export type ElectronApi = typeof api
