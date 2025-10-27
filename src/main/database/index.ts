import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync } from 'fs'

let db: Database.Database | null = null

export function initDatabase(): Database.Database {
  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'fitflow.db')

  db = new Database(dbPath)

  const schemaPath = join(__dirname, 'schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')

  db.exec(schema)

  console.log('Database initialized at:', dbPath)

  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
