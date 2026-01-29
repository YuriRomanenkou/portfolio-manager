import Database from 'better-sqlite3'
import { PriceHistory, ExchangeRate, PortfolioSnapshot } from '../../../shared/types'

export class PriceHistoryRepository {
  constructor(private db: Database.Database) {}

  getByAssetId(assetId: number, limit = 365): PriceHistory[] {
    return this.db
      .prepare('SELECT * FROM price_history WHERE asset_id = ? ORDER BY date DESC LIMIT ?')
      .all(assetId, limit) as PriceHistory[]
  }

  getLatestByAssetId(assetId: number): PriceHistory | undefined {
    return this.db
      .prepare('SELECT * FROM price_history WHERE asset_id = ? ORDER BY date DESC LIMIT 1')
      .get(assetId) as PriceHistory | undefined
  }

  upsert(assetId: number, priceUsd: number, priceAmd: number | null, date: string, source: string): void {
    this.db.prepare(`
      INSERT INTO price_history (asset_id, price_usd, price_amd, date, source)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(asset_id, date, source) DO UPDATE SET
        price_usd = excluded.price_usd,
        price_amd = excluded.price_amd
    `).run(assetId, priceUsd, priceAmd, date, source)
  }

  // Exchange Rates
  getExchangeRate(base: string, target: string, date: string): ExchangeRate | undefined {
    return this.db
      .prepare('SELECT * FROM exchange_rates WHERE base_currency = ? AND target_currency = ? AND date = ?')
      .get(base, target, date) as ExchangeRate | undefined
  }

  getLatestExchangeRate(base: string, target: string): ExchangeRate | undefined {
    return this.db
      .prepare('SELECT * FROM exchange_rates WHERE base_currency = ? AND target_currency = ? ORDER BY date DESC LIMIT 1')
      .get(base, target) as ExchangeRate | undefined
  }

  upsertExchangeRate(base: string, target: string, rate: number, date: string, source: string): void {
    this.db.prepare(`
      INSERT INTO exchange_rates (base_currency, target_currency, rate, date, source)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(base_currency, target_currency, date) DO UPDATE SET
        rate = excluded.rate,
        source = excluded.source
    `).run(base, target, rate, date, source)
  }

  // Portfolio Snapshots
  getSnapshots(limit = 365): PortfolioSnapshot[] {
    return this.db
      .prepare('SELECT * FROM portfolio_snapshots ORDER BY date DESC LIMIT ?')
      .all(limit) as PortfolioSnapshot[]
  }

  upsertSnapshot(date: string, totalUsd: number, totalAmd: number, breakdownJson: string): void {
    this.db.prepare(`
      INSERT INTO portfolio_snapshots (date, total_value_usd, total_value_amd, breakdown_json)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        total_value_usd = excluded.total_value_usd,
        total_value_amd = excluded.total_value_amd,
        breakdown_json = excluded.breakdown_json
    `).run(date, totalUsd, totalAmd, breakdownJson)
  }
}
