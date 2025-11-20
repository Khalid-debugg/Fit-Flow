// src/main/handlers/settingsHandlers.ts

import { ipcMain, app, dialog } from 'electron'
import { getDatabase } from '../database'
import * as fs from 'fs'
import * as path from 'path'
import { Settings, SettingsDbRow } from '@renderer/models/settings'

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', async () => {
    const db = getDatabase()
    const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as SettingsDbRow

    if (!settings) {
      return {
        id: '1',
        language: 'ar',
        currency: 'EGP',
        dateFormat: 'DD/MM/YYYY',
        allowedGenders: 'both',
        defaultPaymentMethod: 'cash',
        autoBackup: true,
        backupFrequency: 'daily'
      }
    }

    return {
      id: settings.id,
      language: settings.language,
      currency: settings.currency,
      dateFormat: settings.date_format,
      allowedGenders: settings.allowed_genders,
      defaultPaymentMethod: settings.default_payment_method,
      autoBackup: settings.auto_backup === 1,
      backupFrequency: settings.backup_frequency,
      backupFolderPath: settings.backup_folder_path,
      lastBackupDate: settings.last_backup_date,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at
    }
  })

  ipcMain.handle('settings:update', async (_event, settings: Settings) => {
    const db = getDatabase()

    db.prepare(
      `
      UPDATE settings
      SET 
        language = ?,
        currency = ?,
        date_format = ?,
        allowed_genders = ?,
        default_payment_method = ?,
        auto_backup = ?,
        backup_frequency = ?,
        backup_folder_path = ?
      WHERE id = '1'
    `
    ).run(
      settings.language,
      settings.currency,
      settings.allowedGenders,
      settings.defaultPaymentMethod,
      settings.autoBackup ? 1 : 0,
      settings.backupFrequency,
      settings.backupFolderPath || null
    )

    return { success: true }
  })

  ipcMain.handle('backup:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Backup Folder',
      buttonLabel: 'Select Folder'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }

    return {
      canceled: false,
      folderPath: result.filePaths[0]
    }
  })

  ipcMain.handle('backup:getDbPath', async () => {
    const dbPath = path.join(app.getPath('userData'), 'database.db')
    return dbPath
  })

  // Create backup
  ipcMain.handle('backup:create', async (_event, customPath?: string) => {
    try {
      const dbPath = path.join(app.getPath('userData'), 'database.db')

      let backupDir: string
      if (customPath) {
        backupDir = customPath
      } else {
        backupDir = path.join(app.getPath('userData'), 'backups')
      }

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }

      const timestamp =
        new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] +
        '_' +
        new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-')
      const backupPath = path.join(backupDir, `fitflow-backup-${timestamp}.db`)

      fs.copyFileSync(dbPath, backupPath)

      const stats = fs.statSync(backupPath)
      const fileSizeInBytes = stats.size

      const db = getDatabase()
      db.prepare('UPDATE settings SET last_backup_date = ? WHERE id = ?').run(
        new Date().toISOString(),
        '1'
      )

      return {
        success: true,
        path: backupPath,
        size: fileSizeInBytes,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Backup failed:', error)
      return {
        success: false,
        error: (error as Error).message
      }
    }
  })

  ipcMain.handle('backup:getInfo', async (_event, customPath?: string) => {
    try {
      let backupDir: string
      if (customPath) {
        backupDir = customPath
      } else {
        backupDir = path.join(app.getPath('userData'), 'backups')
      }

      if (!fs.existsSync(backupDir)) {
        return {
          lastBackup: null,
          backupCount: 0,
          totalSize: 0,
          backups: [],
          folderPath: backupDir
        }
      }

      const files = fs
        .readdirSync(backupDir)
        .filter((f) => f.endsWith('.db'))
        .map((f) => {
          const filePath = path.join(backupDir, f)
          const stats = fs.statSync(filePath)
          return {
            name: f,
            path: filePath,
            size: stats.size,
            created: stats.birthtime.toISOString()
          }
        })
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

      const totalSize = files.reduce((sum, f) => sum + f.size, 0)

      return {
        lastBackup: files[0]?.created,
        backupCount: files.length,
        totalSize: totalSize,
        backups: files,
        folderPath: backupDir
      }
    } catch (error) {
      console.error('Failed to get backup info:', error)
      return {
        lastBackup: null,
        backupCount: 0,
        totalSize: 0,
        backups: [],
        folderPath: customPath
      }
    }
  })

  ipcMain.handle('backup:restore', async (_event, backupPath: string) => {
    try {
      const dbPath = path.join(app.getPath('userData'), 'database.db')

      if (!fs.existsSync(backupPath)) {
        return {
          success: false,
          error: 'Backup file not found'
        }
      }

      const emergencyBackupPath = path.join(
        app.getPath('userData'),
        `database-before-restore-${Date.now()}.db`
      )
      fs.copyFileSync(dbPath, emergencyBackupPath)

      fs.copyFileSync(backupPath, dbPath)

      return {
        success: true,
        emergencyBackupPath
      }
    } catch (error) {
      console.error('Restore failed:', error)
      return {
        success: false,
        error: (error as Error).message
      }
    }
  })

  // Delete backup
  ipcMain.handle('backup:delete', async (_event, backupPath: string) => {
    try {
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath)
        return { success: true }
      }
      return {
        success: false,
        error: 'Backup file not found'
      }
    } catch (error) {
      console.error('Failed to delete backup:', error)
      return {
        success: false,
        error: (error as Error).message
      }
    }
  })

  // Clean old backups (keep last 10)
  ipcMain.handle('backup:cleanOld', async (_event, customPath?: string) => {
    try {
      let backupDir: string
      if (customPath) {
        backupDir = customPath
      } else {
        backupDir = path.join(app.getPath('userData'), 'backups')
      }

      if (!fs.existsSync(backupDir)) {
        return { success: true, deleted: 0 }
      }

      const files = fs
        .readdirSync(backupDir)
        .filter((f) => f.endsWith('.db'))
        .map((f) => {
          const filePath = path.join(backupDir, f)
          const stats = fs.statSync(filePath)
          return {
            path: filePath,
            created: stats.birthtime
          }
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime())

      const toDelete = files.slice(10)
      toDelete.forEach((f) => fs.unlinkSync(f.path))

      return {
        success: true,
        deleted: toDelete.length
      }
    } catch (error) {
      console.error('Failed to clean old backups:', error)
      return {
        success: false,
        error: (error as Error).message
      }
    }
  })

  ipcMain.handle('backup:openFolder', async (_event, folderPath: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { shell } = require('electron')
      if (fs.existsSync(folderPath)) {
        shell.openPath(folderPath)
        return { success: true }
      }
      return {
        success: false,
        error: 'Folder not found'
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  })
}
