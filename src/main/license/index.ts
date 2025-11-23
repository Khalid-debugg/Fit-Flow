import { ipcMain } from 'electron'
import { generateHardwareId, formatHardwareId } from './hwid'
import { verifyLicense } from './validator'
import { loadLicense, saveLicense, hasLicense } from './storage'

export * from './hwid'
export * from './validator'
export * from './storage'

/**
 * Check if the app is currently licensed
 */
export function isAppLicensed(): boolean {
  try {
    const hardwareId = generateHardwareId()
    const licenseKey = loadLicense()

    if (!licenseKey) {
      return false
    }

    const result = verifyLicense(hardwareId, licenseKey)
    return result.valid
  } catch (error) {
    console.error('Error checking license:', error)
    return false
  }
}

/**
 * Register IPC handlers for license operations
 */
export function registerLicenseHandlers(): void {
  // Get hardware ID
  ipcMain.handle('license:getHardwareId', async () => {
    try {
      const hwid = generateHardwareId()
      return {
        success: true,
        hardwareId: hwid,
        formatted: formatHardwareId(hwid)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Check if already licensed
  ipcMain.handle('license:isLicensed', async () => {
    return isAppLicensed()
  })

  // Activate with license key
  ipcMain.handle('license:activate', async (_, licenseKey: string) => {
    try {
      const hardwareId = generateHardwareId()
      const result = verifyLicense(hardwareId, licenseKey)

      if (result.valid) {
        saveLicense(licenseKey)
        return {
          success: true,
          message: 'License activated successfully!'
        }
      } else {
        return {
          success: false,
          message: result.message
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Get license status
  ipcMain.handle('license:getStatus', async () => {
    try {
      const isLicensed = isAppLicensed()
      const hwid = generateHardwareId()

      return {
        isLicensed,
        hardwareId: hwid,
        formattedHardwareId: formatHardwareId(hwid),
        hasLicenseFile: hasLicense()
      }
    } catch (error) {
      return {
        isLicensed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}
