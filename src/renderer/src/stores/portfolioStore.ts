import { create } from 'zustand'
import type {
  AssetWithPrice,
  CreateAssetInput,
  UpdateAssetInput,
  Transaction,
  CreateTransactionInput,
  PortfolioSnapshot
} from '../../../shared/types'

interface PortfolioState {
  assets: AssetWithPrice[]
  loading: boolean
  error: string | null
  lastUpdated: string | null

  // Stats
  totalValueUsd: number
  totalValueAmd: number
  totalGainLoss: number
  assetCount: number
  byType: Record<string, { value_usd: number; count: number; percentage: number }>

  // Snapshots
  snapshots: PortfolioSnapshot[]

  // Actions
  fetchAssets: () => Promise<void>
  createAsset: (input: CreateAssetInput) => Promise<void>
  updateAsset: (input: UpdateAssetInput) => Promise<void>
  deleteAsset: (id: number) => Promise<void>
  refreshPrices: () => Promise<void>
  fetchStats: () => Promise<void>
  fetchSnapshots: (limit?: number) => Promise<void>
  createSnapshot: () => Promise<void>

  // Transactions
  fetchTransactions: (assetId: number) => Promise<Transaction[]>
  createTransaction: (input: CreateTransactionInput) => Promise<void>
  deleteTransaction: (id: number) => Promise<void>
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  assets: [],
  loading: false,
  error: null,
  lastUpdated: null,
  totalValueUsd: 0,
  totalValueAmd: 0,
  totalGainLoss: 0,
  assetCount: 0,
  byType: {},
  snapshots: [],

  fetchAssets: async () => {
    set({ loading: true, error: null })
    try {
      const assets = await window.api.assets.getAll()
      const totalValueUsd = assets.reduce((sum, a) => sum + (a.total_value_usd ?? 0), 0)
      const totalValueAmd = assets.reduce((sum, a) => sum + (a.total_value_amd ?? 0), 0)
      const totalGainLoss = assets.reduce((sum, a) => sum + (a.gain_loss_usd ?? 0), 0)

      set({
        assets,
        totalValueUsd,
        totalValueAmd,
        totalGainLoss,
        assetCount: assets.length,
        loading: false,
        lastUpdated: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      })
    } catch (error) {
      set({ loading: false, error: String(error) })
    }
  },

  createAsset: async (input) => {
    try {
      await window.api.assets.create(input)
      await get().fetchAssets()
    } catch (error) {
      set({ error: String(error) })
    }
  },

  updateAsset: async (input) => {
    try {
      await window.api.assets.update(input)
      await get().fetchAssets()
    } catch (error) {
      set({ error: String(error) })
    }
  },

  deleteAsset: async (id) => {
    try {
      await window.api.assets.delete(id)
      await get().fetchAssets()
    } catch (error) {
      set({ error: String(error) })
    }
  },

  refreshPrices: async () => {
    set({ loading: true })
    try {
      await window.api.prices.refresh()
      await get().fetchAssets()
    } catch (error) {
      set({ loading: false, error: String(error) })
    }
  },

  fetchStats: async () => {
    try {
      const stats = await window.api.portfolio.getStats()
      set({
        totalValueUsd: stats.total_value_usd,
        totalValueAmd: stats.total_value_amd,
        totalGainLoss: stats.total_gain_loss_usd,
        assetCount: stats.asset_count,
        byType: stats.by_type
      })
    } catch (error) {
      set({ error: String(error) })
    }
  },

  fetchSnapshots: async (limit = 365) => {
    try {
      const snapshots = await window.api.portfolio.getSnapshots(limit)
      set({ snapshots })
    } catch (error) {
      set({ error: String(error) })
    }
  },

  createSnapshot: async () => {
    try {
      await window.api.portfolio.createSnapshot()
    } catch (error) {
      set({ error: String(error) })
    }
  },

  fetchTransactions: async (assetId) => {
    try {
      return await window.api.transactions.getByAsset(assetId)
    } catch (error) {
      set({ error: String(error) })
      return []
    }
  },

  createTransaction: async (input) => {
    try {
      await window.api.transactions.create(input)
      await get().fetchAssets()
    } catch (error) {
      set({ error: String(error) })
    }
  },

  deleteTransaction: async (id) => {
    try {
      await window.api.transactions.delete(id)
      await get().fetchAssets()
    } catch (error) {
      set({ error: String(error) })
    }
  }
}))
