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
