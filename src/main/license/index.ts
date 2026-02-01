import { ipcMain, app } from 'electron'
import { generateHardwareId, formatHardwareId } from './hwid'
import { validateOfflineLicense, shouldPerformOnlineCheck } from './validator'
import {
  loadLicense,
  saveLicense,
  hasLicense,
  deleteLicense,
  updateLastOnlineCheck,
  type StoredLicenseData
} from './storage'

export * from './hwid'
export * from './validator'
export * from './storage'

// API Base URL - should match your fitflow-landing deployment
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'

/**
 * Get the current license key
 */
export function getLicenseKey(): string | null {
  try {
    const licenseData = loadLicense()
    return licenseData?.licenseKey || null
  } catch (error) {
    console.error('Error getting license key:', error)
    return null
  }
}

// Log the API URL on startup for debugging
console.log('License API configured with base URL:', API_BASE_URL)

/**
 * Check if the app is currently licensed (offline check)
 */
export function isAppLicensed(): {
  valid: boolean
  reason?: string
  trialDaysRemaining?: number
  requiresPayment?: boolean
} {
  try {
    const hardwareId = generateHardwareId()
    const licenseData = loadLicense()

    if (!licenseData) {
      return {
        valid: false,
        reason: 'No license found'
      }
    }

    const result = validateOfflineLicense(licenseData, hardwareId)
    return result
  } catch (error) {
    console.error('Error checking license:', error)
    return {
      valid: false,
      reason: 'Error validating license'
    }
  }
}

/**
 * Activate license online via API
 */
async function activateOnline(
  licenseKey: string,
  deviceId: string
): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/license/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        licenseKey,
        deviceId,
        deviceName: require('os').hostname(),
        platform: process.platform,
        appVersion: app.getVersion()
      })
    })

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('API returned non-JSON response:', await response.text())
      return {
        success: false,
        message: `Server error. Make sure the backend is running at ${API_BASE_URL}`
      }
    }

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Activation failed'
      }
    }

    return {
      success: true,
      message: data.message,
      data: data.data
    }
  } catch (error) {
    console.error('Online activation error:', error)
    const errorMessage =
      error instanceof Error && error.message.includes('fetch')
        ? `Unable to connect to server at ${API_BASE_URL}. Is the backend running?`
        : 'Unable to connect to activation server. Please check your internet connection.'
    return {
      success: false,
      message: errorMessage
    }
  }
}

/**
 * Validate license online via API
 */
async function validateOnline(
  licenseKey: string,
  deviceId: string
): Promise<{
  success: boolean
  valid: boolean
  data?: any
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/license/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        licenseKey,
        deviceId
      })
    })

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Validation API returned non-JSON response')
      return {
        success: false,
        valid: false
      }
    }

    const data = await response.json()
    return {
      success: response.ok,
      valid: data.valid || false,
      data: data.data
    }
  } catch (error) {
    console.error('Online validation error:', error)
    return {
      success: false,
      valid: false
    }
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

  // Check if already licensed (with periodic online check)
  ipcMain.handle('license:isLicensed', async () => {
    try {
      const offlineResult = isAppLicensed()

      if (!offlineResult.valid) {
        return false
      }

      // Perform periodic online check if needed
      const licenseData = loadLicense()
      if (licenseData && shouldPerformOnlineCheck(licenseData)) {
        const hardwareId = generateHardwareId()
        const onlineResult = await validateOnline(licenseData.licenseKey, hardwareId)

        if (onlineResult.success) {
          updateLastOnlineCheck()

          // Update stored license data if server returned new info
          if (onlineResult.data) {
            const updatedData: StoredLicenseData = {
              ...licenseData,
              trialEndsAt: onlineResult.data.trialEndsAt || licenseData.trialEndsAt,
              subscriptionStatus:
                onlineResult.data.subscriptionStatus || licenseData.subscriptionStatus,
              lastOnlineCheck: new Date().toISOString()
            }
            saveLicense(updatedData)
          }

          return onlineResult.valid
        }

        // If online check fails, continue with offline validation
        console.log('Online check failed, using offline validation')
      }

      return offlineResult.valid
    } catch (error) {
      console.error('Error checking license:', error)
      return false
    }
  })

  // Activate with license key
  ipcMain.handle('license:activate', async (_, licenseKey: string) => {
    try {
      const hardwareId = generateHardwareId()

      // Call online activation API
      const result = await activateOnline(licenseKey, hardwareId)

      if (result.success && result.data) {
        // Save license data locally
        const licenseData: StoredLicenseData = {
          licenseKey,
          deviceId: hardwareId,
          activatedAt: result.data.activatedAt,
          trialEndsAt: result.data.trialEndsAt || null,
          subscriptionStatus: result.data.subscriptionStatus,
          signedLicense: result.data.signedLicense,
          lastOnlineCheck: new Date().toISOString()
        }

        saveLicense(licenseData)

        return {
          success: true,
          message: result.message
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
      const licenseStatus = isAppLicensed()
      const hwid = generateHardwareId()
      const licenseData = loadLicense()

      return {
        isLicensed: licenseStatus.valid,
        reason: licenseStatus.reason,
        trialDaysRemaining: licenseStatus.trialDaysRemaining || 0,
        requiresPayment: licenseStatus.requiresPayment || false,
        hardwareId: hwid,
        formattedHardwareId: formatHardwareId(hwid),
        hasLicenseFile: hasLicense(),
        licenseData: licenseData
          ? {
              activatedAt: licenseData.activatedAt,
              trialEndsAt: licenseData.trialEndsAt,
              subscriptionStatus: licenseData.subscriptionStatus
            }
          : null
      }
    } catch (error) {
      return {
        isLicensed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Deactivate license
  ipcMain.handle('license:deactivate', async () => {
    try {
      const licenseData = loadLicense()

      if (!licenseData) {
        return {
          success: false,
          message: 'No license found to deactivate'
        }
      }

      // Call online deactivation API if possible
      try {
        const response = await fetch(`${API_BASE_URL}/api/license/deactivate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            licenseKey: licenseData.licenseKey,
            deviceId: licenseData.deviceId
          })
        })

        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()

          if (response.ok) {
            console.log('License deactivated on server successfully')
          } else {
            console.warn('Failed to deactivate on server:', data.message)
          }
        } else {
          console.warn('Failed to deactivate on server: Non-JSON response')
        }
      } catch (error) {
        console.warn('Could not reach server for deactivation, will deactivate locally only:', error)
      }

      // Delete local license file - this is critical
      try {
        deleteLicense()
        console.log('Local license file deleted successfully')

        // Verify deletion
        const stillExists = hasLicense()
        if (stillExists) {
          console.error('License file still exists after deletion attempt!')
          return {
            success: false,
            message: 'Failed to delete local license file'
          }
        }
      } catch (deleteError) {
        console.error('Failed to delete license file:', deleteError)
        return {
          success: false,
          message: 'Failed to delete local license file: ' + (deleteError instanceof Error ? deleteError.message : 'Unknown error')
        }
      }

      return {
        success: true,
        message: 'License deactivated successfully'
      }
    } catch (error) {
      console.error('Deactivation error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}
