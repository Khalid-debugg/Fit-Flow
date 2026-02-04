import { randomBytes } from 'crypto'

export function toSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result = {} as Record<string, unknown>
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    result[snakeKey] = obj[key as keyof T]
  }
  return result
}

export function toCamel<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const result = {} as Record<string, unknown>
  for (const key of Object.keys(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = row[key as keyof T]
  }
  return result
}

/**
 * Generates a cryptographically secure encrypted ID
 * Uses 8 bytes (64 bits) of random data encoded as base62 (alphanumeric)
 * Result is a 11-character string containing only numbers and letters
 */
export function generateEncryptedId(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const bytes = randomBytes(8)
  let result = ''

  // Convert random bytes to base62
  let num = BigInt('0x' + bytes.toString('hex'))
  while (num > 0) {
    const remainder = Number(num % BigInt(62))
    result = chars[remainder] + result
    num = num / BigInt(62)
  }

  // Pad to ensure consistent length
  while (result.length < 11) {
    result = chars[0] + result
  }

  return result
}
