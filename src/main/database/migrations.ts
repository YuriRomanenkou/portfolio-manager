import Database from 'better-sqlite3'
import { CREATE_TABLES_SQL, DEFAULT_SETTINGS } from './schema'

export function runMigrations(db: Database.Database): void {
  // Create schema version table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const currentVersion = db.prepare(
    'SELECT MAX(version) as version FROM schema_version'
  ).get() as { version: number | null }

  const version = currentVersion?.version ?? 0

  if (version < 1) {
    applyV1(db)
  }
}

function applyV1(db: Database.Database): void {
  const transaction = db.transaction(() => {
    // Create all tables
    db.exec(CREATE_TABLES_SQL)

    // Insert default settings
    const insertSetting = db.prepare(
      'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
    )
    for (const setting of DEFAULT_SETTINGS) {
      insertSetting.run(setting.key, setting.value)
    }

    // Record migration
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(1)
  })

  transaction()
}
