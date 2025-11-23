import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const LICENSE_FILE = 'license.dat'

/**
 * Get the path to store license file
 */
function getLicensePath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, LICENSE_FILE)
}

const ENCRYPTION_KEY = 'fitflow-encryption-key-32bytes!'
const IV_LENGTH = 16

/**
 * Simple encryption for storing license (obscurity, not high security)
 */
function encryptData(data: string): string {
  // Create a key from the password
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Prepend IV to encrypted data
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt stored license data
 */
function decryptData(data: string): string {
  try {
    const parts = data.split(':')
    if (parts.length !== 2) {
      return ''
    }

    const iv = Buffer.from(parts[0], 'hex')
    const encryptedData = parts[1]

    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Failed to decrypt license data:', error)
    return ''
  }
}

/**
 * Save license key to disk
 */
export function saveLicense(licenseKey: string): void {
  try {
    const licensePath = getLicensePath()
    const encrypted = encryptData(licenseKey)
    fs.writeFileSync(licensePath, encrypted, 'utf8')
  } catch (error) {
    console.error('Error saving license:', error)
    throw new Error('Failed to save license')
  }
}

/**
 * Load license key from disk
 */
export function loadLicense(): string | null {
  try {
    const licensePath = getLicensePath()

    if (!fs.existsSync(licensePath)) {
      return null
    }

    const encrypted = fs.readFileSync(licensePath, 'utf8')
    const decrypted = decryptData(encrypted)

    return decrypted || null
  } catch (error) {
    console.error('Error loading license:', error)
    return null
  }
}

/**
 * Check if license file exists
 */
export function hasLicense(): boolean {
  const licensePath = getLicensePath()
  return fs.existsSync(licensePath)
}

/**
 * Delete license file (for testing or deactivation)
 */
export function deleteLicense(): void {
  try {
    const licensePath = getLicensePath()
    if (fs.existsSync(licensePath)) {
      fs.unlinkSync(licensePath)
    }
  } catch (error) {
    console.error('Error deleting license:', error)
  }
}
