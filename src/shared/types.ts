export type AssetType =
  | 'cash'
  | 'crypto'
  | 'stock'
  | 'bond'
  | 'etf'
  | 'real_estate'
  | 'vehicle'
  | 'collectible'
  | 'electronics'
  | 'other'

export type TransactionType = 'buy' | 'sell' | 'deposit' | 'withdraw' | 'valuation_update'

export type DisplayCurrency = 'USD' | 'AMD'

export type RiskProfile = 'aggressive' | 'moderate' | 'conservative'

export interface Asset {
  id: number
  name: string
  asset_type: AssetType
  ticker: string | null
  api_id: string | null
  quantity: number | null
  estimated_value: number | null
  value_currency: string | null
  purchase_price: number | null
  purchase_date: string | null
  notes: string | null
  currency_code: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export interface AssetWithPrice extends Asset {
  current_price_usd: number | null
  current_price_amd: number | null
  total_value_usd: number | null
  total_value_amd: number | null
  gain_loss_usd: number | null
  gain_loss_percent: number | null
  /** Purchase price adjusted for splits/dilutions since purchase date */
  adjusted_purchase_price: number | null
  /** Cumulative split/dilution factor since purchase date (< 1 means shares were diluted) */
  split_factor: number | null
}

export interface Transaction {
  id: number
  asset_id: number
  type: TransactionType
  quantity: number | null
  price_per_unit: number | null
  total_value: number
  currency: string
  date: string
  notes: string | null
  created_at: string
}

export interface PriceHistory {
  id: number
  asset_id: number
  price_usd: number
  price_amd: number | null
  date: string
  source: string
}

export interface ExchangeRate {
  id: number
  base_currency: string
  target_currency: string
  rate: number
  date: string
  source: string
}

export interface PortfolioSnapshot {
  id: number
  date: string
  total_value_usd: number
  total_value_amd: number
  breakdown_json: string
}

export interface PortfolioBreakdown {
  [assetType: string]: {
    value_usd: number
    value_amd: number
    percentage: number
    assets: Array<{
      id: number
      name: string
      value_usd: number
      value_amd: number
    }>
  }
}

export interface Settings {
  display_currency: DisplayCurrency
  update_interval_minutes: number
  risk_profile: RiskProfile
}

export interface Recommendation {
  id: string
  type: 'warning' | 'suggestion' | 'info'
  title: string
  description: string
  priority: number
}

export interface CreateAssetInput {
  name: string
  asset_type: AssetType
  ticker?: string
  api_id?: string
  quantity?: number
  estimated_value?: number
  value_currency?: string
  purchase_price?: number
  purchase_date?: string
  notes?: string
  currency_code?: string
}

export interface UpdateAssetInput extends Partial<CreateAssetInput> {
  id: number
}

export interface CreateTransactionInput {
  asset_id: number
  type: TransactionType
  quantity?: number
  price_per_unit?: number
  total_value: number
  currency: string
  date: string
  notes?: string
}

export interface PriceData {
  price_usd: number
  price_amd: number | null
  change_24h_percent: number | null
  source: string
  updated_at: string
}

export interface TickerSearchResult {
  symbol: string
  name: string
  type: string
  exchange?: string
}
