#!/usr/bin/env node

/**
 * FitFlow License Key Generator
 *
 * This script generates license keys for specific hardware IDs.
 * Run this script when a user provides you with their Hardware ID.
 *
 * Usage:
 *   node generate-license.js <HARDWARE_ID>
 *
 * Example:
 *   node generate-license.js A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6
 */

const crypto = require('crypto')

// IMPORTANT: This must match the SECRET_KEY in src/main/license/validator.ts
const SECRET_KEY = 'fitflow-2024-secret-master-key-change-me-in-production'

function generateLicenseKey(hardwareId) {
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

// Main execution
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║         FitFlow License Key Generator v1.0               ║')
  console.log('╚══════════════════════════════════════════════════════════╝\n')
  console.log('Usage:')
  console.log('  node generate-license.js <HARDWARE_ID>\n')
  console.log('Example:')
  console.log('  node generate-license.js A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6\n')
  console.log('Note: The Hardware ID should be 32 characters (without dashes)')
  console.log('      or formatted with dashes (XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX)\n')
  process.exit(1)
}

// Get hardware ID from command line argument
let hardwareId = args[0].toUpperCase().replace(/-/g, '')

// Validate hardware ID
if (hardwareId.length !== 32) {
  console.error('\n❌ ERROR: Hardware ID must be 32 characters long')
  console.error(`   You provided: ${hardwareId} (${hardwareId.length} characters)\n`)
  process.exit(1)
}

if (!/^[0-9A-F]+$/.test(hardwareId)) {
  console.error('\n❌ ERROR: Hardware ID must contain only hexadecimal characters (0-9, A-F)')
  console.error(`   You provided: ${hardwareId}\n`)
  process.exit(1)
}

// Generate license key
const licenseKey = generateLicenseKey(hardwareId)

// Format hardware ID for display
const formattedHwId = hardwareId.match(/.{1,4}/g).join('-')

// Display results
console.log('\n╔══════════════════════════════════════════════════════════╗')
console.log('║              License Key Generated Successfully         ║')
console.log('╚══════════════════════════════════════════════════════════╝\n')
console.log('Hardware ID:')
console.log(`  ${formattedHwId}\n`)
console.log('Generated License Key:')
console.log(`  ${licenseKey}\n`)
console.log('Instructions:')
console.log('  1. Copy the license key above')
console.log('  2. Send it to the user')
console.log('  3. User should paste it in the activation dialog')
console.log('  4. The app will validate and activate automatically\n')
console.log('Note: This license key will ONLY work on the machine with')
console.log('      the Hardware ID shown above.\n')
