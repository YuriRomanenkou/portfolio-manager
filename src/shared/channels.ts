export const IPC_CHANNELS = {
  // Assets
  ASSETS_GET_ALL: 'assets:getAll',
  ASSETS_GET_BY_ID: 'assets:getById',
  ASSETS_CREATE: 'assets:create',
  ASSETS_UPDATE: 'assets:update',
  ASSETS_DELETE: 'assets:delete',

  // Transactions
  TRANSACTIONS_GET_BY_ASSET: 'transactions:getByAsset',
  TRANSACTIONS_CREATE: 'transactions:create',
  TRANSACTIONS_DELETE: 'transactions:delete',

  // Prices
  PRICES_GET_CURRENT: 'prices:getCurrent',
  PRICES_REFRESH: 'prices:refresh',
  PRICES_GET_HISTORY: 'prices:getHistory',
  PRICES_SEARCH_TICKER: 'prices:searchTicker',

  // Exchange Rates
  EXCHANGE_RATES_GET: 'exchangeRates:get',
  EXCHANGE_RATES_REFRESH: 'exchangeRates:refresh',

  // Portfolio
  PORTFOLIO_GET_SNAPSHOTS: 'portfolio:getSnapshots',
  PORTFOLIO_CREATE_SNAPSHOT: 'portfolio:createSnapshot',
  PORTFOLIO_GET_STATS: 'portfolio:getStats',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Recommendations
  RECOMMENDATIONS_GET: 'recommendations:get',

  // Export
  EXPORT_CSV: 'export:csv',
  EXPORT_JSON: 'export:json',

  // Events (main -> renderer)
  PRICES_UPDATED: 'event:pricesUpdated',
  SNAPSHOT_CREATED: 'event:snapshotCreated'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
