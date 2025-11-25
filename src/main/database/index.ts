import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync } from 'fs'

let db: Database.Database | null = null

export function initDatabase(): Database.Database {
  const dataPath = join(app.getPath('documents'), 'FitFlow', 'backups')
  const dbPath = join(dataPath, 'fitflow.db')

  // Ensure the backups directory exists
  const fs = require('fs')
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true })
  }

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
