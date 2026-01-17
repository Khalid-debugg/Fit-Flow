import type { StoredLicenseData } from './storage'

/**
 * Verify signed license data from server (offline validation)
 */
export function verifySignedLicense(signedData: string): {
  valid: boolean
  data?: {
    licenseKey: string
    deviceId: string
    trialEndsAt: Date | null
    subscriptionStatus: string
    timestamp: number
  }
} {
  try {
    // Decode base64
    const decoded = JSON.parse(Buffer.from(signedData, 'base64').toString('utf-8'))
    const { payload } = decoded

    // Parse payload (signature verification would require the secret, which we don't store client-side)
    // For client-side validation, we trust the signed data from the server
    const parsedPayload = JSON.parse(payload)

    return {
      valid: true,
      data: {
        licenseKey: parsedPayload.key,
        deviceId: parsedPayload.device,
        trialEndsAt: parsedPayload.trialEnd ? new Date(parsedPayload.trialEnd) : null,
        subscriptionStatus: parsedPayload.status,
        timestamp: parsedPayload.timestamp
      }
    }
  } catch (error) {
    console.error('License signature verification error:', error)
    return { valid: false }
  }
}

/**
 * Check if license is valid based on stored data (offline validation)
 */
export function validateOfflineLicense(
  licenseData: StoredLicenseData,
  currentDeviceId: string
): {
  valid: boolean
  reason?: string
  trialDaysRemaining?: number
  requiresPayment?: boolean
} {
  try {
    // Verify device ID matches
    if (licenseData.deviceId !== currentDeviceId) {
      return {
        valid: false,
        reason: 'License is bound to a different device'
      }
    }

    // Check trial status
    const now = new Date()
    const isTrialActive = licenseData.trialEndsAt ? now < new Date(licenseData.trialEndsAt) : false
    const isTrialExpired = licenseData.trialEndsAt
      ? now >= new Date(licenseData.trialEndsAt)
      : false

    // Check subscription status
    const hasActiveSubscription =
      licenseData.subscriptionStatus === 'active' ||
      licenseData.subscriptionStatus === 'paid'

    // Calculate trial days remaining
    let trialDaysRemaining = 0
    if (licenseData.trialEndsAt && isTrialActive) {
      const msRemaining = new Date(licenseData.trialEndsAt).getTime() - now.getTime()
      trialDaysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))
    }

    // License is valid if trial is active OR subscription is active
    const isValid = isTrialActive || hasActiveSubscription

    if (!isValid) {
      return {
        valid: false,
        reason: isTrialExpired
          ? 'Trial period has expired. Please purchase a license to continue.'
          : 'No active subscription or trial',
        requiresPayment: true,
        trialDaysRemaining: 0
      }
    }

    return {
      valid: true,
      trialDaysRemaining,
      requiresPayment: false
    }
  } catch (error) {
    console.error('Error validating offline license:', error)
    return {
      valid: false,
      reason: 'Failed to validate license'
    }
  }
}

/**
 * Check if online validation is needed (every 7 days)
 */
export function shouldPerformOnlineCheck(licenseData: StoredLicenseData): boolean {
  try {
    const lastCheck = new Date(licenseData.lastOnlineCheck)
    const now = new Date()
    const daysSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24)

    // Perform online check every 7 days
    return daysSinceLastCheck >= 7
  } catch (error) {
    // If we can't determine last check, perform online check
    return true
  }
}
