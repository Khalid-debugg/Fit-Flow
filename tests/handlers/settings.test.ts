import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { createTestDatabase, cleanupTestDatabase, getTestDatabase } from '../helpers'

describe('Settings Operations', () => {
  beforeEach(() => {
    createTestDatabase()
  })

  afterEach(() => {
    cleanupTestDatabase()
  })

  describe('Default Settings', () => {
    it('should have default settings on database creation', () => {
      const db = getTestDatabase()
      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any

      expect(settings).toBeDefined()
      expect(settings.id).toBe('1')
      expect(settings.language).toBe('ar')
      expect(settings.currency).toBe('EGP')
      expect(settings.allowed_genders).toBe('both')
      expect(settings.default_payment_method).toBe('cash')
      expect(settings.auto_backup).toBe(1)
      expect(settings.backup_frequency).toBe('weekly')
    })
  })

  describe('Update Settings', () => {
    it('should update language setting', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET language = ? WHERE id = ?').run('en', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.language).toBe('en')
    })

    it('should update currency setting', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET currency = ? WHERE id = ?').run('USD', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.currency).toBe('USD')
    })

    it('should update allowed genders', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET allowed_genders = ? WHERE id = ?').run('male', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.allowed_genders).toBe('male')
    })

    it('should update default payment method', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET default_payment_method = ? WHERE id = ?').run('card', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.default_payment_method).toBe('card')
    })

    it('should update auto backup setting', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET auto_backup = ? WHERE id = ?').run(0, '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.auto_backup).toBe(0)
    })

    it('should update backup frequency', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET backup_frequency = ? WHERE id = ?').run('monthly', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.backup_frequency).toBe('monthly')
    })

    it('should update backup folder path', () => {
      const db = getTestDatabase()
      const path = '/custom/backup/path'
      db.prepare('UPDATE settings SET backup_folder_path = ? WHERE id = ?').run(path, '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.backup_folder_path).toBe(path)
    })

    it('should update last backup date', () => {
      const db = getTestDatabase()
      const date = new Date().toISOString()
      db.prepare('UPDATE settings SET last_backup_date = ? WHERE id = ?').run(date, '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.last_backup_date).toBe(date)
    })

    it('should update multiple settings at once', () => {
      const db = getTestDatabase()
      db.prepare(
        `UPDATE settings SET
         language = ?,
         currency = ?,
         allowed_genders = ?,
         default_payment_method = ?
         WHERE id = ?`
      ).run('en', 'USD', 'female', 'transfer', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.language).toBe('en')
      expect(settings.currency).toBe('USD')
      expect(settings.allowed_genders).toBe('female')
      expect(settings.default_payment_method).toBe('transfer')
    })
  })

  describe('Settings Validation', () => {
    it('should enforce language constraint', () => {
      const db = getTestDatabase()
      expect(() => {
        db.prepare('UPDATE settings SET language = ? WHERE id = ?').run('fr', '1')
      }).toThrow()
    })

    it('should enforce allowed_genders constraint', () => {
      const db = getTestDatabase()
      expect(() => {
        db.prepare('UPDATE settings SET allowed_genders = ? WHERE id = ?').run('other', '1')
      }).toThrow()
    })

    it('should enforce default_payment_method constraint', () => {
      const db = getTestDatabase()
      expect(() => {
        db.prepare('UPDATE settings SET default_payment_method = ? WHERE id = ?').run(
          'bitcoin',
          '1'
        )
      }).toThrow()
    })

    it('should enforce auto_backup constraint', () => {
      const db = getTestDatabase()
      expect(() => {
        db.prepare('UPDATE settings SET auto_backup = ? WHERE id = ?').run(2, '1')
      }).toThrow()
    })

    it('should enforce backup_frequency constraint', () => {
      const db = getTestDatabase()
      expect(() => {
        db.prepare('UPDATE settings SET backup_frequency = ? WHERE id = ?').run('hourly', '1')
      }).toThrow()
    })

    it('should enforce single settings row constraint', () => {
      const db = getTestDatabase()
      expect(() => {
        db.prepare('INSERT INTO settings (id) VALUES (?)').run('2')
      }).toThrow()
    })
  })

  describe('Settings Language Options', () => {
    it('should accept Arabic language', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET language = ? WHERE id = ?').run('ar', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.language).toBe('ar')
    })

    it('should accept English language', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET language = ? WHERE id = ?').run('en', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.language).toBe('en')
    })
  })

  describe('Settings Gender Options', () => {
    it('should accept male only', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET allowed_genders = ? WHERE id = ?').run('male', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.allowed_genders).toBe('male')
    })

    it('should accept female only', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET allowed_genders = ? WHERE id = ?').run('female', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.allowed_genders).toBe('female')
    })

    it('should accept both genders', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET allowed_genders = ? WHERE id = ?').run('both', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.allowed_genders).toBe('both')
    })
  })

  describe('Settings Payment Methods', () => {
    it('should accept cash', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET default_payment_method = ? WHERE id = ?').run('cash', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.default_payment_method).toBe('cash')
    })

    it('should accept card', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET default_payment_method = ? WHERE id = ?').run('card', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.default_payment_method).toBe('card')
    })

    it('should accept transfer', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET default_payment_method = ? WHERE id = ?').run('transfer', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.default_payment_method).toBe('transfer')
    })

    it('should accept e-wallet', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET default_payment_method = ? WHERE id = ?').run('e-wallet', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.default_payment_method).toBe('e-wallet')
    })
  })

  describe('Backup Frequency Options', () => {
    it('should accept daily frequency', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET backup_frequency = ? WHERE id = ?').run('daily', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.backup_frequency).toBe('daily')
    })

    it('should accept weekly frequency', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET backup_frequency = ? WHERE id = ?').run('weekly', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.backup_frequency).toBe('weekly')
    })

    it('should accept monthly frequency', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET backup_frequency = ? WHERE id = ?').run('monthly', '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.backup_frequency).toBe('monthly')
    })
  })

  describe('Nullable Fields', () => {
    it('should allow null backup_folder_path', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET backup_folder_path = ? WHERE id = ?').run(null, '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.backup_folder_path).toBeNull()
    })

    it('should allow null last_backup_date', () => {
      const db = getTestDatabase()
      db.prepare('UPDATE settings SET last_backup_date = ? WHERE id = ?').run(null, '1')

      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as any
      expect(settings.last_backup_date).toBeNull()
    })
  })
})
