import Database from 'better-sqlite3'
import { Asset, CreateAssetInput, UpdateAssetInput } from '../../../shared/types'

export class AssetRepository {
  constructor(private db: Database.Database) {}

  getAll(): Asset[] {
    return this.db
      .prepare('SELECT * FROM assets WHERE is_active = 1 ORDER BY asset_type, name')
      .all() as Asset[]
  }

  getById(id: number): Asset | undefined {
    return this.db
      .prepare('SELECT * FROM assets WHERE id = ? AND is_active = 1')
      .get(id) as Asset | undefined
  }

  getByType(assetType: string): Asset[] {
    return this.db
      .prepare('SELECT * FROM assets WHERE asset_type = ? AND is_active = 1 ORDER BY name')
      .all(assetType) as Asset[]
  }

  create(input: CreateAssetInput): Asset {
    const result = this.db.prepare(`
      INSERT INTO assets (name, asset_type, ticker, api_id, quantity, estimated_value, value_currency, purchase_price, purchase_date, notes, currency_code)
      VALUES (@name, @asset_type, @ticker, @api_id, @quantity, @estimated_value, @value_currency, @purchase_price, @purchase_date, @notes, @currency_code)
    `).run({
      name: input.name,
      asset_type: input.asset_type,
      ticker: input.ticker ?? null,
      api_id: input.api_id ?? null,
      quantity: input.quantity ?? null,
      estimated_value: input.estimated_value ?? null,
      value_currency: input.value_currency ?? null,
      purchase_price: input.purchase_price ?? null,
      purchase_date: input.purchase_date ?? null,
      notes: input.notes ?? null,
      currency_code: input.currency_code ?? null
    })

    return this.getById(Number(result.lastInsertRowid))!
  }

  update(input: UpdateAssetInput): Asset {
    const existing = this.getById(input.id)
    if (!existing) throw new Error(`Asset ${input.id} not found`)

    const fields: string[] = []
    const values: Record<string, unknown> = { id: input.id }

    const updatable = [
      'name', 'asset_type', 'ticker', 'api_id', 'quantity',
      'estimated_value', 'value_currency', 'purchase_price',
      'purchase_date', 'notes', 'currency_code'
    ] as const

    for (const field of updatable) {
      if (field in input) {
        fields.push(`${field} = @${field}`)
        values[field] = (input as Record<string, unknown>)[field] ?? null
      }
    }

    if (fields.length === 0) return existing

    fields.push("updated_at = datetime('now')")

    this.db.prepare(`UPDATE assets SET ${fields.join(', ')} WHERE id = @id`).run(values)

    return this.getById(input.id)!
  }

  delete(id: number): void {
    this.db.prepare("UPDATE assets SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(id)
  }

  hardDelete(id: number): void {
    this.db.prepare('DELETE FROM assets WHERE id = ?').run(id)
  }
}
