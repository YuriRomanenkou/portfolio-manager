export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK(asset_type IN ('cash','crypto','stock','bond','etf','real_estate','vehicle','collectible','electronics','other')),
  ticker TEXT,
  api_id TEXT,
  quantity REAL,
  estimated_value REAL,
  value_currency TEXT,
  purchase_price REAL,
  purchase_date TEXT,
  notes TEXT,
  currency_code TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('buy','sell','deposit','withdraw','valuation_update')),
  quantity REAL,
  price_per_unit REAL,
  total_value REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  price_usd REAL NOT NULL,
  price_amd REAL,
  date TEXT NOT NULL,
  source TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  UNIQUE(asset_id, date, source)
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate REAL NOT NULL,
  date TEXT NOT NULL,
  source TEXT NOT NULL,
  UNIQUE(base_currency, target_currency, date)
);

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  total_value_usd REAL NOT NULL,
  total_value_amd REAL NOT NULL,
  breakdown_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`

export const DEFAULT_SETTINGS = [
  { key: 'display_currency', value: 'USD' },
  { key: 'update_interval_minutes', value: '30' },
  { key: 'risk_profile', value: 'moderate' }
]
