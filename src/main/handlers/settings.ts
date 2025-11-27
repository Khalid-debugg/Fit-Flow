import { ipcMain, app, dialog } from 'electron'
import { getDatabase } from '../database'
import * as fs from 'fs'
import * as path from 'path'
import { Settings, SettingsDbRow, BackupFile, BackupInfo } from '@renderer/models/settings'

// Helper function to get MIME type from file extension
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp'
  }
  return mimeTypes[extension.toLowerCase()] || 'image/png'
}

// Helper function to check if backup is needed
function shouldCreateBackup(lastBackupDate: string | null, frequency: string): boolean {
  if (!lastBackupDate) {
    return false // Initialized database exists, last_backup_date should be set on init
  }

  const now = new Date()
  const lastBackup = new Date(lastBackupDate)
  const timeDiff = now.getTime() - lastBackup.getTime()
  const daysDiff = timeDiff / (1000 * 3600 * 24)

  switch (frequency) {
    case 'daily':
      return daysDiff >= 1
    case 'weekly':
      return daysDiff >= 7
    case 'monthly':
      return daysDiff >= 30
    default:
      return false
  }
}

// Function to perform auto backup
async function performAutoBackup(): Promise<void> {
  try {
    const db = getDatabase()
    const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as
      | SettingsDbRow
      | undefined

    // Skip auto backup if disabled
    if (!settings || settings.auto_backup !== 1) {
      return
    }

    // Check if backup is needed based on frequency
    if (!shouldCreateBackup(settings.last_backup_date, settings.backup_frequency)) {
      return
    }

    // Perform periodic backup
    const dbPath = path.join(app.getPath('documents'), 'FitFlow', 'backups', 'fitflow.db')
    const backupDir =
      settings?.backup_folder_path || path.join(app.getPath('documents'), 'FitFlow', 'backups')

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const timestamp =
      new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] +
      '_' +
      new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-')
    const backupPath = path.join(backupDir, `fitflow-backup-${timestamp}.db`)

    fs.copyFileSync(dbPath, backupPath)

    // Update last backup date
    db.prepare('UPDATE settings SET last_backup_date = ? WHERE id = ?').run(
      new Date().toISOString(),
      '1'
    )

    console.log('Periodic backup created successfully:', backupPath)
  } catch (error) {
    console.error('Auto backup failed:', error)
  }
}

// Export the auto backup function to be called on app initialization
export { performAutoBackup }

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', async () => {
    const db = getDatabase()
    const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as
      | SettingsDbRow
      | undefined

    if (!settings) {
      return {
        id: '1',
        language: 'ar' as const,
        currency: 'EGP',
        gymName: 'FitFlow Gym',
        gymAddress: undefined,
        gymPhone: undefined,
        gymLogoPath: undefined,
        allowedGenders: 'both' as const,
        defaultPaymentMethod: 'cash' as const,
        autoBackup: true,
        backupFrequency: 'daily' as const
      }
    }

    return {
      id: settings.id,
      language: settings.language,
      currency: settings.currency,
      gymName: settings.gym_name,
      gymAddress: settings.gym_address || undefined,
      gymCountryCode: settings.gym_country_code || '+20',
      gymPhone: settings.gym_phone || undefined,
      gymLogoPath: settings.gym_logo_path || undefined,
      allowedGenders: settings.allowed_genders,
      defaultPaymentMethod: settings.default_payment_method,
      autoBackup: settings.auto_backup === 1,
      backupFrequency: settings.backup_frequency,
      backupFolderPath: settings.backup_folder_path || undefined,
      lastBackupDate: settings.last_backup_date || undefined,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at
    }
  })

  ipcMain.handle('settings:update', async (_event, settings: Settings) => {
    const db = getDatabase()

    db.prepare(
      `UPDATE settings SET language = ?, currency = ?, gym_name = ?, gym_address = ?, gym_country_code = ?, gym_phone = ?, gym_logo_path = ?, allowed_genders = ?, default_payment_method = ?, auto_backup = ?, backup_frequency = ?, backup_folder_path = ? WHERE id = '1'`
    ).run(
      settings.language,
      settings.currency,
      settings.gymName,
      settings.gymAddress || null,
      settings.gymCountryCode || '+20',
      settings.gymPhone || null,
      settings.gymLogoPath || null,
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

  ipcMain.handle('backup:create', async () => {
    try {
      const db = getDatabase()
      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as
        | SettingsDbRow
        | undefined

      const dbPath = path.join(app.getPath('documents'), 'FitFlow', 'backups', 'fitflow.db')
      const backupDir =
        settings?.backup_folder_path || path.join(app.getPath('documents'), 'FitFlow', 'backups')

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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  ipcMain.handle('backup:getInfo', async (): Promise<BackupInfo> => {
    try {
      const db = getDatabase()
      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as
        | SettingsDbRow
        | undefined

      const backupDir =
        settings?.backup_folder_path || path.join(app.getPath('documents'), 'FitFlow', 'backups')

      if (!fs.existsSync(backupDir)) {
        return {
          lastBackup: null,
          backupCount: 0,
          totalSize: 0,
          backups: [],
          folderPath: backupDir
        }
      }

      const files: BackupFile[] = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith('fitflow-backup-') && f.endsWith('.db'))
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
        lastBackup: files[0]?.created || null,
        backupCount: files.length,
        totalSize: totalSize,
        backups: files,
        folderPath: backupDir
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return {
        lastBackup: null,
        backupCount: 0,
        totalSize: 0,
        backups: [],
        folderPath: path.join(app.getPath('documents'), 'FitFlow', 'backups')
      }
    }
  })

  ipcMain.handle('backup:restore', async (_event, backupPath: string) => {
    try {
      const dbPath = path.join(app.getPath('documents'), 'FitFlow', 'backups', 'fitflow.db')

      if (!fs.existsSync(backupPath)) {
        return {
          success: false,
          error: 'Backup file not found'
        }
      }

      const emergencyBackupPath = path.join(
        app.getPath('documents'),
        'FitFlow',
        'backups',
        `fitflow-before-restore-${Date.now()}.db`
      )
      fs.copyFileSync(dbPath, emergencyBackupPath)

      fs.copyFileSync(backupPath, dbPath)

      return {
        success: true,
        emergencyBackupPath
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  ipcMain.handle('backup:cleanOld', async () => {
    try {
      const db = getDatabase()
      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as
        | SettingsDbRow
        | undefined

      const backupDir =
        settings?.backup_folder_path || path.join(app.getPath('documents'), 'FitFlow', 'backups')

      if (!fs.existsSync(backupDir)) {
        return { success: true, deleted: 0 }
      }

      const files = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith('fitflow-backup-') && f.endsWith('.db'))
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  ipcMain.handle('backup:openFolder', async (_event, folderPath: string) => {
    try {
      const { shell } = await import('electron')
      if (fs.existsSync(folderPath)) {
        await shell.openPath(folderPath)
        return { success: true }
      }
      return {
        success: false,
        error: 'Folder not found'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  ipcMain.handle('gym:selectLogo', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'Select Gym Logo',
      buttonLabel: 'Select Image',
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg'] }]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }

    try {
      const sourcePath = result.filePaths[0]
      const extension = path.extname(sourcePath)
      const logoDir = path.join(app.getPath('userData'), 'logos')

      if (!fs.existsSync(logoDir)) {
        fs.mkdirSync(logoDir, { recursive: true })
      }

      const destinationPath = path.join(logoDir, `gym-logo${extension}`)

      // Remove old logo if exists
      if (fs.existsSync(destinationPath)) {
        fs.unlinkSync(destinationPath)
      }

      fs.copyFileSync(sourcePath, destinationPath)

      // Read the image and convert to base64 for preview
      const imageBuffer = fs.readFileSync(destinationPath)
      const base64Image = imageBuffer.toString('base64')
      const mimeType = getMimeType(extension)
      const dataUrl = `data:${mimeType};base64,${base64Image}`

      return {
        canceled: false,
        logoPath: destinationPath,
        previewUrl: dataUrl
      }
    } catch (error) {
      return {
        canceled: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  ipcMain.handle('gym:getLogoPreview', async (_event, logoPath: string) => {
    try {
      if (!logoPath || !fs.existsSync(logoPath)) {
        return { success: false, error: 'Logo file not found' }
      }

      const imageBuffer = fs.readFileSync(logoPath)
      const base64Image = imageBuffer.toString('base64')
      const extension = path.extname(logoPath)
      const mimeType = getMimeType(extension)
      const dataUrl = `data:${mimeType};base64,${base64Image}`

      return {
        success: true,
        previewUrl: dataUrl
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  ipcMain.handle('gym:getDefaultLogo', async () => {
    try {
      // Return the path to the default FitFlow logo in resources
      const defaultLogoPath = path.join(process.resourcesPath, 'icon.png')
      if (fs.existsSync(defaultLogoPath)) {
        return { success: true, path: defaultLogoPath }
      }
      // Fallback to build resources during development
      const devLogoPath = path.join(__dirname, '..', '..', 'resources', 'icon.png')
      if (fs.existsSync(devLogoPath)) {
        return { success: true, path: devLogoPath }
      }
      return { success: false, error: 'Default logo not found' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}
