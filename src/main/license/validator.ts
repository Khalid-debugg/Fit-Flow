import crypto from 'crypto'

// Your secret key - KEEP THIS SECRET! Change this to your own random string
const SECRET_KEY = 'fitflow-2024-secret-master-key-change-me-in-production'

/**
 * Generate a license key for a given hardware ID
 * This function should only be run by you (the admin) to generate keys
 */
export function generateLicenseKey(hardwareId: string): string {
  // Create a signature by hashing hardwareId + secret
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(hardwareId)
    .digest('hex')
    .substring(0, 24)
    .toUpperCase()

  // Format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  return signature.match(/.{1,4}/g)?.join('-') || signature
}

/**
 * Validate if a license key is valid for the current hardware
 */
export function validateLicenseKey(hardwareId: string, licenseKey: string): boolean {
  try {
    // Remove dashes from license key for comparison
    const cleanKey = licenseKey.replace(/-/g, '').toUpperCase()

    // Generate what the correct key should be
    const expectedKey = generateLicenseKey(hardwareId).replace(/-/g, '')

    // Compare
    return cleanKey === expectedKey
  } catch (error) {
    console.error('Error validating license:', error)
    return false
  }
}

/**
 * Verify license and return result with details
 */
export function verifyLicense(
  hardwareId: string,
  licenseKey: string
): { valid: boolean; message: string } {
  if (!licenseKey || !hardwareId) {
    return {
      valid: false,
      message: 'Missing license key or hardware ID'
    }
  }

  const isValid = validateLicenseKey(hardwareId, licenseKey)

  if (isValid) {
    return {
      valid: true,
      message: 'License is valid for this machine'
    }
  } else {
    return {
      valid: false,
      message: 'Invalid license key or wrong machine'
    }
  }
}
