import { execSync } from 'child_process'
import crypto from 'crypto'

/**
 * Generate a unique hardware ID based on the current machine
 * Uses motherboard UUID and MAC address for hardware binding
 */
export function generateHardwareId(): string {
  try {
    const platform = process.platform

    let hwInfo = ''

    if (platform === 'win32') {
      // Get motherboard UUID on Windows
      try {
        const uuid = execSync('wmic csproduct get UUID', { encoding: 'utf8' })
        hwInfo += uuid.split('\n')[1].trim()
      } catch (e) {
        console.warn('Could not get motherboard UUID:', e)
      }

      // Get MAC address on Windows
      try {
        const mac = execSync('getmac', { encoding: 'utf8' })
        const macMatch = mac.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/)
        if (macMatch) {
          hwInfo += macMatch[0]
        }
      } catch (e) {
        console.warn('Could not get MAC address:', e)
      }
    } else if (platform === 'darwin') {
      // macOS - get hardware UUID
      try {
        const uuid = execSync("system_profiler SPHardwareDataType | awk '/UUID/ { print $3; }'", {
          encoding: 'utf8'
        })
        hwInfo += uuid.trim()
      } catch (e) {
        console.warn('Could not get hardware UUID:', e)
      }
    } else if (platform === 'linux') {
      // Linux - get machine-id
      try {
        const machineId = execSync('cat /etc/machine-id', { encoding: 'utf8' })
        hwInfo += machineId.trim()
      } catch (e) {
        console.warn('Could not get machine-id:', e)
      }
    }

    if (!hwInfo) {
      throw new Error('Could not generate hardware ID')
    }

    // Create a hash of the hardware info for consistent length
    const hash = crypto.createHash('sha256').update(hwInfo).digest('hex')

    // Return first 32 characters formatted nicely
    return hash.substring(0, 32).toUpperCase()
  } catch (error) {
    console.error('Error generating hardware ID:', error)
    throw new Error('Failed to generate hardware ID')
  }
}

/**
 * Format hardware ID for display (groups of 4)
 * Example: ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12-3456
 */
export function formatHardwareId(hwid: string): string {
  return hwid.match(/.{1,4}/g)?.join('-') || hwid
}
