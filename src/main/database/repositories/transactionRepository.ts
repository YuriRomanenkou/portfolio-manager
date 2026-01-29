import Database from 'better-sqlite3'
import { Transaction, CreateTransactionInput } from '../../../shared/types'

export class TransactionRepository {
  constructor(private db: Database.Database) {}

  getByAssetId(assetId: number): Transaction[] {
    return this.db
      .prepare('SELECT * FROM transactions WHERE asset_id = ? ORDER BY date DESC')
      .all(assetId) as Transaction[]
  }

  getAll(): Transaction[] {
    return this.db
      .prepare('SELECT * FROM transactions ORDER BY date DESC')
      .all() as Transaction[]
  }

  create(input: CreateTransactionInput): Transaction {
    const result = this.db.prepare(`
      INSERT INTO transactions (asset_id, type, quantity, price_per_unit, total_value, currency, date, notes)
      VALUES (@asset_id, @type, @quantity, @price_per_unit, @total_value, @currency, @date, @notes)
    `).run({
      asset_id: input.asset_id,
      type: input.type,
      quantity: input.quantity ?? null,
      price_per_unit: input.price_per_unit ?? null,
      total_value: input.total_value,
      currency: input.currency,
      date: input.date,
      notes: input.notes ?? null
    })

    return this.db
      .prepare('SELECT * FROM transactions WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as Transaction
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
  }
}
