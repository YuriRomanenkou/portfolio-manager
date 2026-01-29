import Database from 'better-sqlite3'
import { Settings } from '../../../shared/types'

export class SettingsRepository {
  constructor(private db: Database.Database) {}

  get(key: string): string | undefined {
    const row = this.db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key) as { value: string } | undefined
    return row?.value
  }

  set(key: string, value: string): void {
    this.db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `).run(key, value)
  }

  getAll(): Settings {
    return {
      display_currency: (this.get('display_currency') as 'USD' | 'AMD') ?? 'USD',
      update_interval_minutes: parseInt(this.get('update_interval_minutes') ?? '30', 10),
      risk_profile: (this.get('risk_profile') as 'aggressive' | 'moderate' | 'conservative') ?? 'moderate'
    }
  }

  setAll(settings: Partial<Settings>): void {
    const transaction = this.db.transaction(() => {
      if (settings.display_currency !== undefined) {
        this.set('display_currency', settings.display_currency)
      }
      if (settings.update_interval_minutes !== undefined) {
        this.set('update_interval_minutes', String(settings.update_interval_minutes))
      }
      if (settings.risk_profile !== undefined) {
        this.set('risk_profile', settings.risk_profile)
      }
    })
    transaction()
  }
}
