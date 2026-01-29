import type { AssetType } from '../../../shared/types'

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  cash: 'Денежные средства',
  crypto: 'Криптовалюта',
  stock: 'Акции',
  bond: 'Облигации',
  etf: 'ETF',
  real_estate: 'Недвижимость',
  vehicle: 'Автомобиль',
  collectible: 'Коллекционные',
  electronics: 'Электроника',
  other: 'Другое'
}

export const ASSET_TYPE_OPTIONS = Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => ({
  value: value as AssetType,
  label
}))

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  buy: 'Покупка',
  sell: 'Продажа',
  deposit: 'Пополнение',
  withdraw: 'Снятие',
  valuation_update: 'Переоценка'
}

export const RISK_PROFILE_LABELS: Record<string, string> = {
  aggressive: 'Агрессивный',
  moderate: 'Умеренный',
  conservative: 'Консервативный'
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  AMD: '֏',
  EUR: '€',
  GBP: '£',
  RUB: '₽',
  JPY: '¥'
}

export const CHART_COLORS = [
  '#1a73e8', '#34a853', '#ea4335', '#fbbc04',
  '#8e24aa', '#e65100', '#00695c', '#c62828',
  '#283593', '#4e342e'
]

export function isTradeableAsset(type: AssetType): boolean {
  return ['crypto', 'stock', 'etf', 'bond'].includes(type)
}

export function isManualValueAsset(type: AssetType): boolean {
  return ['real_estate', 'vehicle', 'collectible', 'electronics', 'other'].includes(type)
}

export function isCashAsset(type: AssetType): boolean {
  return type === 'cash'
}
