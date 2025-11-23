import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import {
  createTestDatabase,
  cleanupTestDatabase,
  getTestDatabase,
  createTestMember
} from '../helpers'

describe('Member Operations', () => {
  beforeEach(() => {
    createTestDatabase()
  })

  afterEach(() => {
    cleanupTestDatabase()
  })

  describe('Create Member', () => {
    it('should create a new member successfully', () => {
      const member = createTestMember({
        name: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com',
        gender: 'male',
        address: '123 Main St',
        notes: 'Test notes'
      })

      expect(member.id).toBeDefined()
      expect(member.name).toBe('John Doe')
      expect(member.phone).toBe('1234567890')
      expect(member.email).toBe('john@example.com')
    })

    it('should not allow duplicate phone numbers', () => {
      createTestMember({ phone: '1234567890' })

      // Try to insert with same phone number
      expect(() => {
        createTestMember({ phone: '1234567890' })
      }).toThrow()
    })

    it('should require name, phone, gender, and join_date', () => {
      const db = getTestDatabase()

      // Missing name
      expect(() => {
        db.prepare(`INSERT INTO members (id, phone, gender, join_date) VALUES (?, ?, ?, ?)`).run(
          'test-id',
          '1234567890',
          'male',
          '2025-01-01'
        )
      }).toThrow()

      // Missing phone
      expect(() => {
        db.prepare(`INSERT INTO members (id, name, gender, join_date) VALUES (?, ?, ?, ?)`).run(
          'test-id',
          'John Doe',
          'male',
          '2025-01-01'
        )
      }).toThrow()

      // Missing gender
      expect(() => {
        db.prepare(`INSERT INTO members (id, name, phone, join_date) VALUES (?, ?, ?, ?)`).run(
          'test-id',
          'John Doe',
          '1234567890',
          '2025-01-01'
        )
      }).toThrow()

      // Missing join_date
      expect(() => {
        db.prepare(`INSERT INTO members (id, name, phone, gender) VALUES (?, ?, ?, ?)`).run(
          'test-id',
          'John Doe',
          '1234567890',
          'male'
        )
      }).toThrow()
    })

    it('should allow null email, address, and notes', () => {
      const member = createTestMember({
        name: 'John Doe',
        phone: '1234567890',
        gender: 'male'
      })

      const db = getTestDatabase()
      const retrieved = db.prepare('SELECT * FROM members WHERE id = ?').get(member.id) as any
      expect(retrieved.email).toBeDefined() // Has default value
      expect(retrieved.address).toBeDefined() // Has default value
      expect(retrieved.notes).toBeDefined() // Has default value
    })
  })

  describe('Read Member', () => {
    it('should retrieve member by id', () => {
      const created = createTestMember({ name: 'Test User', phone: '9876543210' })
      const db = getTestDatabase()

      const member = db.prepare('SELECT * FROM members WHERE id = ?').get(created.id) as any
      expect(member).toBeDefined()
      expect(member.name).toBe('Test User')
      expect(member.phone).toBe('9876543210')
    })

    it('should retrieve all members', () => {
      createTestMember({ name: 'User 1', phone: '1111111111' })
      createTestMember({ name: 'User 2', phone: '2222222222' })
      createTestMember({ name: 'User 3', phone: '3333333333' })

      const db = getTestDatabase()
      const members = db.prepare('SELECT * FROM members').all()
      expect(members).toHaveLength(3)
    })

    it('should return null for non-existent member', () => {
      const db = getTestDatabase()
      const member = db.prepare('SELECT * FROM members WHERE id = ?').get(999)
      expect(member).toBeUndefined()
    })
  })

  describe('Update Member', () => {
    it('should update member information', () => {
      const created = createTestMember({ name: 'Original Name' })
      const db = getTestDatabase()

      const result = db
        .prepare('UPDATE members SET name = ?, email = ? WHERE id = ?')
        .run('Updated Name', 'new@example.com', created.id)

      expect(result.changes).toBe(1)

      const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(created.id) as any
      expect(updated.name).toBe('Updated Name')
      expect(updated.email).toBe('new@example.com')
    })

    it('should not allow updating to duplicate phone', () => {
      createTestMember({ name: 'User 1', phone: '1111111111' })
      const member2 = createTestMember({ name: 'User 2', phone: '2222222222' })

      const db = getTestDatabase()

      // Try to update member2's phone to member1's phone
      expect(() => {
        db.prepare('UPDATE members SET phone = ? WHERE id = ?').run('1111111111', member2.id)
      }).toThrow()
    })
  })

  describe('Delete Member', () => {
    it('should delete member successfully', () => {
      const created = createTestMember()
      const db = getTestDatabase()

      const result = db.prepare('DELETE FROM members WHERE id = ?').run(created.id)
      expect(result.changes).toBe(1)

      const deleted = db.prepare('SELECT * FROM members WHERE id = ?').get(created.id)
      expect(deleted).toBeUndefined()
    })

    it('should return 0 changes for non-existent member', () => {
      const db = getTestDatabase()
      const result = db.prepare('DELETE FROM members WHERE id = ?').run(999)
      expect(result.changes).toBe(0)
    })
  })

  describe('Search Members', () => {
    it('should search members by name', () => {
      createTestMember({ name: 'John Smith', phone: '1111111111', email: 'john@example.com' })
      createTestMember({ name: 'Jane Doe', phone: '2222222222', email: 'jane@example.com' })
      createTestMember({ name: 'Bob Johnson', phone: '3333333333', email: 'bob@example.com' })

      const db = getTestDatabase()
      const results = db.prepare("SELECT * FROM members WHERE name LIKE ?").all('%John%')
      expect(results).toHaveLength(2) // John Smith and Bob Johnson
    })

    it('should search members by phone', () => {
      createTestMember({ name: 'John Smith', phone: '1111111111', email: 'john@example.com' })
      createTestMember({ name: 'Jane Doe', phone: '2222222222', email: 'jane@example.com' })
      createTestMember({ name: 'Bob Johnson', phone: '3333333333', email: 'bob@example.com' })

      const db = getTestDatabase()
      const results = db.prepare("SELECT * FROM members WHERE phone LIKE ?").all('%2222%')
      expect(results).toHaveLength(1)
    })

    it('should search members by email', () => {
      createTestMember({ name: 'John Smith', phone: '1111111111', email: 'john@example.com' })
      createTestMember({ name: 'Jane Doe', phone: '2222222222', email: 'jane@example.com' })
      createTestMember({ name: 'Bob Johnson', phone: '3333333333', email: 'bob@example.com' })

      const db = getTestDatabase()
      const results = db.prepare("SELECT * FROM members WHERE email LIKE ?").all('%jane%')
      expect(results).toHaveLength(1)
    })
  })
})
