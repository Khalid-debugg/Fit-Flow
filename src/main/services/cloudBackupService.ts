import * as fs from 'fs'
import * as path from 'path'
import { getDatabase } from '../database'
import { SettingsDbRow } from '@renderer/models/settings'
import { generateHardwareId } from '../license/hwid'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'
const DEFAULT_API_URL = `${API_BASE_URL}/api/backups`

console.log('[Cloud Backup] API configured with base URL:', API_BASE_URL)

interface CloudBackupResult {
  success: boolean
  message?: string
  error?: string
  data?: {
    id: string
    fileName: string
    fileSize: number
    checksum: string
    createdAt: string
  }
}

/**
 * Get device information for cloud backup
 * Uses the same hardware ID as the license system
 */
function getDeviceInfo() {
  const os = require('os')
  const platform = process.platform
  const deviceId = generateHardwareId() // Use same hardware ID as license
  const deviceName = `${os.hostname()} (${platform})`

  return {
    deviceId,
    deviceName
  }
}

/**
 * Create multipart form data boundary and body
 */
function createMultipartFormData(
  filePath: string,
  fileName: string,
  fields: Record<string, string>
): { boundary: string; body: Buffer } {
  const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`
  const fileBuffer = fs.readFileSync(filePath)

  const parts: Buffer[] = []

  // Add text fields
  for (const [key, value] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\n`))
    parts.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`))
    parts.push(Buffer.from(`${value}\r\n`))
  }

  // Add file field
  parts.push(Buffer.from(`--${boundary}\r\n`))
  parts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`))
  parts.push(Buffer.from('Content-Type: application/octet-stream\r\n\r\n'))
  parts.push(fileBuffer)
  parts.push(Buffer.from('\r\n'))

  // Add closing boundary
  parts.push(Buffer.from(`--${boundary}--\r\n`))

  return {
    boundary,
    body: Buffer.concat(parts)
  }
}

/**
 * Upload backup file to cloud
 */
export async function uploadBackupToCloud(
  backupPath: string,
  licenseKey: string,
  apiUrl?: string
): Promise<CloudBackupResult> {
  try {
    console.log('[Cloud Backup] Starting upload:', backupPath)

    if (!fs.existsSync(backupPath)) {
      console.error('[Cloud Backup] File not found:', backupPath)
      return {
        success: false,
        error: 'Backup file not found'
      }
    }

    const stats = fs.statSync(backupPath)
    const fileName = path.basename(backupPath)
    const deviceInfo = getDeviceInfo()

    console.log('[Cloud Backup] File info:', {
      fileName,
      size: stats.size,
      deviceId: deviceInfo.deviceId
    })

    // Create multipart form data
    const { boundary, body } = createMultipartFormData(backupPath, fileName, {
      licenseKey,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      fileName
    })

    const url = `${apiUrl || DEFAULT_API_URL}/upload`
    console.log('[Cloud Backup] Uploading to:', url)

    // Upload to cloud using native fetch
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString()
      },
      body: new Uint8Array(body)
    })

    const result = await response.json()
    console.log('[Cloud Backup] Upload response:', { status: response.status, result })

    if (!response.ok) {
      console.error('[Cloud Backup] Upload failed:', result)
      return {
        success: false,
        error: result.message || 'Upload failed'
      }
    }

    console.log('[Cloud Backup] Upload successful')
    return result
  } catch (error) {
    console.error('[Cloud Backup] Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * List all cloud backups
 */
export async function listCloudBackups(
  licenseKey: string,
  apiUrl?: string
): Promise<CloudBackupResult> {
  try {
    console.log('[Cloud Backup] Fetching backup list')

    const deviceInfo = getDeviceInfo()
    const url = `${apiUrl || DEFAULT_API_URL}/list`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        licenseKey,
        deviceId: deviceInfo.deviceId
      })
    })

    const result = await response.json()
    console.log('[Cloud Backup] List response:', {
      status: response.status,
      count: result.data?.backups?.length
    })

    if (!response.ok) {
      console.error('[Cloud Backup] List failed:', result)
      return {
        success: false,
        error: result.message || 'Failed to list backups'
      }
    }

    return result
  } catch (error) {
    console.error('[Cloud Backup] List error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Download backup from cloud
 */
export async function downloadBackupFromCloud(
  backupId: string,
  licenseKey: string,
  destinationPath: string,
  apiUrl?: string
): Promise<CloudBackupResult> {
  try {
    console.log('[Cloud Backup] Downloading backup:', backupId)

    const deviceInfo = getDeviceInfo()
    const url = `${apiUrl || DEFAULT_API_URL}/download`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        licenseKey,
        deviceId: deviceInfo.deviceId,
        backupId
      })
    })

    if (!response.ok) {
      const result = await response.json()
      console.error('[Cloud Backup] Download failed:', result)
      return {
        success: false,
        error: result.message || 'Download failed'
      }
    }

    // Save downloaded file
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(destinationPath, buffer)

    console.log('[Cloud Backup] Download successful:', destinationPath)
    return {
      success: true,
      message: 'Backup downloaded successfully'
    }
  } catch (error) {
    console.error('[Cloud Backup] Download error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete cloud backup
 */
export async function deleteCloudBackup(
  backupId: string,
  licenseKey: string,
  apiUrl?: string
): Promise<CloudBackupResult> {
  try {
    console.log('[Cloud Backup] Deleting backup:', backupId)

    const deviceInfo = getDeviceInfo()
    const url = `${apiUrl || DEFAULT_API_URL}/delete`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        licenseKey,
        deviceId: deviceInfo.deviceId,
        backupId
      })
    })

    const result = await response.json()
    console.log('[Cloud Backup] Delete response:', { status: response.status, result })

    if (!response.ok) {
      console.error('[Cloud Backup] Delete failed:', result)
      return {
        success: false,
        error: result.message || 'Delete failed'
      }
    }

    return result
  } catch (error) {
    console.error('[Cloud Backup] Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Perform automatic cloud backup
 * This should be called after creating a local backup
 */
export async function performAutoCloudBackup(backupPath: string): Promise<void> {
  try {
    console.log('[Cloud Backup] Auto cloud backup triggered for:', backupPath)

    const db = getDatabase()
    const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as
      | SettingsDbRow
      | undefined

    // Skip if cloud backup is disabled
    if (!settings || settings.cloud_backup_enabled !== 1) {
      console.log('[Cloud Backup] Cloud backup is disabled')
      return
    }

    if (settings.last_cloud_backup_date) {
      const now = new Date()
      const lastCloudBackup = new Date(settings.last_cloud_backup_date)
      const timeDiff = now.getTime() - lastCloudBackup.getTime()
      const hoursDiff = timeDiff / (1000 * 3600)

      if (hoursDiff < 24) {
        const hoursRemaining = Math.ceil(24 - hoursDiff)
        console.log(
          '[Cloud Backup] Skipped: Already uploaded today (last upload:',
          settings.last_cloud_backup_date,
          ')'
        )

        const { sendNotificationToRenderer } = await import('../utils/notificationBridge')
        sendNotificationToRenderer({
          type: 'info',
          title: 'settings:backup.autoErrors.cloudUploadRateLimited',
          translationKey: 'settings:backup.autoErrors.cloudUploadRateLimited',
          translationParams: {
            hours: hoursRemaining
          }
        })
        return
      }
    }

    const licenseModule = await import('../license')
    const licenseKey = licenseModule.getLicenseKey()

    if (!licenseKey) {
      console.log('[Cloud Backup] Skipped: No license key available')

      const { sendNotificationToRenderer } = await import('../utils/notificationBridge')
      sendNotificationToRenderer({
        type: 'warning',
        title: 'settings:backup.autoErrors.cloudUploadNoLicense',
        translationKey: 'settings:backup.autoErrors.cloudUploadNoLicense'
      })
      return
    }

    console.log('[Cloud Backup] Starting upload with license key')

    // Upload to cloud
    const result = await uploadBackupToCloud(
      backupPath,
      licenseKey,
      settings.cloud_backup_api_url || undefined
    )

    if (result.success) {
      db.prepare('UPDATE settings SET last_cloud_backup_date = ? WHERE id = ?').run(
        new Date().toISOString(),
        '1'
      )
      console.log('[Cloud Backup] Success:', result.data?.fileName)

      const { sendNotificationToRenderer } = await import('../utils/notificationBridge')
      sendNotificationToRenderer({
        type: 'success',
        title: 'settings:backup.autoSuccess.cloudUploadSuccess',
        translationKey: 'settings:backup.autoSuccess.cloudUploadSuccess',
        translationParams: {
          fileName: result.data?.fileName || 'backup'
        }
      })
    } else {
      console.error('[Cloud Backup] Failed:', result.error)

      const { sendNotificationToRenderer } = await import('../utils/notificationBridge')
      sendNotificationToRenderer({
        type: 'error',
        title: 'settings:backup.autoErrors.cloudUploadFailed',
        description: result.error || 'settings:backup.autoErrors.cloudUploadFailedDesc',
        translationKey: 'settings:backup.autoErrors.cloudUploadFailed'
      })
    }
  } catch (error) {
    console.error('[Cloud Backup] Auto cloud backup error:', error)

    const { sendNotificationToRenderer } = await import('../utils/notificationBridge')
    const errorMsg = error instanceof Error ? error.message : ''

    if (
      errorMsg.includes('fetch') ||
      errorMsg.includes('network') ||
      errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('ENOTFOUND')
    ) {
      sendNotificationToRenderer({
        type: 'error',
        title: 'settings:backup.autoErrors.cloudUploadFailed',
        description: 'settings:backup.autoErrors.cloudUploadFailedDesc',
        translationKey: 'settings:backup.autoErrors.cloudUploadFailed'
      })
    } else {
      sendNotificationToRenderer({
        type: 'error',
        title: 'settings:backup.autoErrors.cloudUploadError',
        description: errorMsg,
        translationKey: 'settings:backup.autoErrors.cloudUploadError',
        translationParams: {
          error: errorMsg
        }
      })
    }
  }
}
