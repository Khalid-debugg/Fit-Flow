import { describe, it, expect } from '@jest/globals'

/**
 * Helper function to check if backup is needed
 * (Extracted from settings.ts for testing)
 */
function shouldCreateBackup(lastBackupDate: string | null, frequency: string): boolean {
  if (!lastBackupDate) {
    return true // No backup exists, create initial backup
  }

  const now = new Date()
  const lastBackup = new Date(lastBackupDate)
  const timeDiff = now.getTime() - lastBackup.getTime()
  const daysDiff = timeDiff / (1000 * 3600 * 24)

  switch (frequency) {
    case 'daily':
      return daysDiff >= 1
    case 'weekly':
      return daysDiff >= 7
    case 'monthly':
      return daysDiff >= 30
    default:
      return false
  }
}

describe('Backup Logic', () => {
  describe('shouldCreateBackup', () => {
    it('should create backup if none exists', () => {
      expect(shouldCreateBackup(null, 'daily')).toBe(true)
      expect(shouldCreateBackup(null, 'weekly')).toBe(true)
      expect(shouldCreateBackup(null, 'monthly')).toBe(true)
    })

    it('should create daily backup after 24 hours', () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      expect(shouldCreateBackup(yesterday, 'daily')).toBe(true)
    })

    it('should not create daily backup within 24 hours', () => {
      const now = new Date().toISOString()
      expect(shouldCreateBackup(now, 'daily')).toBe(false)

      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      expect(shouldCreateBackup(oneHourAgo, 'daily')).toBe(false)

      const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
      expect(shouldCreateBackup(twentyHoursAgo, 'daily')).toBe(false)
    })

    it('should create weekly backup after 7 days', () => {
      const lastWeek = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      expect(shouldCreateBackup(lastWeek, 'weekly')).toBe(true)
    })

    it('should not create weekly backup within 7 days', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      expect(shouldCreateBackup(threeDaysAgo, 'weekly')).toBe(false)

      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      expect(shouldCreateBackup(sixDaysAgo, 'weekly')).toBe(false)
    })

    it('should create monthly backup after 30 days', () => {
      const lastMonth = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
      expect(shouldCreateBackup(lastMonth, 'monthly')).toBe(true)
    })

    it('should not create monthly backup within 30 days', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      expect(shouldCreateBackup(tenDaysAgo, 'monthly')).toBe(false)

      const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString()
      expect(shouldCreateBackup(twentyNineDaysAgo, 'monthly')).toBe(false)
    })

    it('should handle invalid frequency', () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      expect(shouldCreateBackup(yesterday, 'invalid')).toBe(false)
      expect(shouldCreateBackup(yesterday, '')).toBe(false)
    })

    it('should handle edge case at exact threshold', () => {
      // Exactly 1 day ago
      const exactlyOneDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      expect(shouldCreateBackup(exactlyOneDay, 'daily')).toBe(true)

      // Exactly 7 days ago
      const exactlySevenDays = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      expect(shouldCreateBackup(exactlySevenDays, 'weekly')).toBe(true)

      // Exactly 30 days ago
      const exactlyThirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      expect(shouldCreateBackup(exactlyThirtyDays, 'monthly')).toBe(true)
    })
  })
})
