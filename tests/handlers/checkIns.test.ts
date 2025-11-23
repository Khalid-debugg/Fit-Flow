import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import {
  createTestDatabase,
  cleanupTestDatabase,
  getTestDatabase,
  createTestMember,
  createTestCheckIn,
  createTestPlan,
  createTestMembership
} from '../helpers'

describe('Check-In Operations', () => {
  beforeEach(() => {
    createTestDatabase()
  })

  afterEach(() => {
    cleanupTestDatabase()
  })

  describe('Create Check-In', () => {
    it('should create a check-in successfully', () => {
      const member = createTestMember({ name: 'John Doe' })
      const checkIn = createTestCheckIn({ memberId: member.id })

      expect(checkIn.id).toBeDefined()
      expect(checkIn.memberId).toBe(member.id)
      expect(checkIn.checkInTime).toBeDefined()
    })

    it('should create check-in with custom time', () => {
      const member = createTestMember()
      const customTime = '2025-01-15T10:30:00.000Z'
      const checkIn = createTestCheckIn({
        memberId: member.id,
        checkInTime: customTime
      })

      expect(checkIn.checkInTime).toBe(customTime)
    })

    it('should require member_id', () => {
      const db = getTestDatabase()
      expect(() => {
        db.prepare('INSERT INTO check_ins (id, member_id, check_in_time) VALUES (?, ?, ?)').run(
          'test-id',
          null,
          new Date().toISOString()
        )
      }).toThrow()
    })

    it('should enforce foreign key constraint', () => {
      const db = getTestDatabase()
      expect(() => {
        db.prepare('INSERT INTO check_ins (id, member_id, check_in_time) VALUES (?, ?, ?)').run(
          'test-id',
          'non-existent-member',
          new Date().toISOString()
        )
      }).toThrow()
    })
  })

  describe('Unique Check-In Per Day', () => {
    it('should prevent duplicate check-ins on same day', () => {
      const member = createTestMember()
      const today = new Date().toISOString()

      createTestCheckIn({ memberId: member.id, checkInTime: today })

      // Try to create another check-in on the same day
      expect(() => {
        const db = getTestDatabase()
        db.prepare('INSERT INTO check_ins (id, member_id, check_in_time) VALUES (?, ?, ?)').run(
          'another-id',
          member.id,
          today
        )
      }).toThrow()
    })

    it('should allow check-ins on different days', () => {
      const member = createTestMember()

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      createTestCheckIn({
        memberId: member.id,
        checkInTime: yesterday.toISOString()
      })

      const today = createTestCheckIn({
        memberId: member.id,
        checkInTime: new Date().toISOString()
      })

      expect(today.id).toBeDefined()
    })
  })

  describe('Read Check-Ins', () => {
    it('should retrieve check-in by id', () => {
      const member = createTestMember()
      const checkIn = createTestCheckIn({ memberId: member.id })

      const db = getTestDatabase()
      const retrieved = db.prepare('SELECT * FROM check_ins WHERE id = ?').get(checkIn.id) as any

      expect(retrieved).toBeDefined()
      expect(retrieved.member_id).toBe(member.id)
    })

    it('should retrieve all check-ins for a member', () => {
      const member = createTestMember()

      const day1 = new Date('2025-01-01T10:00:00.000Z')
      const day2 = new Date('2025-01-02T11:00:00.000Z')
      const day3 = new Date('2025-01-03T12:00:00.000Z')

      createTestCheckIn({ memberId: member.id, checkInTime: day1.toISOString() })
      createTestCheckIn({ memberId: member.id, checkInTime: day2.toISOString() })
      createTestCheckIn({ memberId: member.id, checkInTime: day3.toISOString() })

      const db = getTestDatabase()
      const checkIns = db
        .prepare('SELECT * FROM check_ins WHERE member_id = ? ORDER BY check_in_time DESC')
        .all(member.id)

      expect(checkIns).toHaveLength(3)
    })

    it('should join with member information', () => {
      const member = createTestMember({ name: 'Jane Smith', phone: '9876543210' })
      createTestCheckIn({ memberId: member.id })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT ci.*, m.name AS member_name, m.phone AS member_phone
           FROM check_ins ci
           INNER JOIN members m ON ci.member_id = m.id
           WHERE ci.member_id = ?`
        )
        .get(member.id) as any

      expect(result.member_name).toBe('Jane Smith')
      expect(result.member_phone).toBe('9876543210')
    })
  })

  describe('Check-In with Membership Status', () => {
    it('should identify active membership', () => {
      const member = createTestMember()
      const plan = createTestPlan()

      const today = new Date().toISOString().split('T')[0]
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      createTestMembership({
        memberId: member.id,
        planId: plan.id,
        startDate: today,
        endDate: futureDate.toISOString().split('T')[0]
      })

      createTestCheckIn({ memberId: member.id })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT ci.*, ms.end_date AS membership_end_date
           FROM check_ins ci
           INNER JOIN members m ON ci.member_id = m.id
           LEFT JOIN memberships ms ON m.id = ms.member_id AND ms.end_date >= date('now')
           WHERE ci.member_id = ?`
        )
        .get(member.id) as any

      expect(result.membership_end_date).toBeDefined()
      expect(result.membership_end_date >= today).toBe(true)
    })

    it('should identify expired membership', () => {
      const member = createTestMember()
      const plan = createTestPlan()

      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 60)
      const expiredDate = new Date()
      expiredDate.setDate(expiredDate.getDate() - 1)

      createTestMembership({
        memberId: member.id,
        planId: plan.id,
        startDate: pastDate.toISOString().split('T')[0],
        endDate: expiredDate.toISOString().split('T')[0]
      })

      createTestCheckIn({ memberId: member.id })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT ci.*, ms.end_date AS membership_end_date
           FROM check_ins ci
           INNER JOIN members m ON ci.member_id = m.id
           LEFT JOIN memberships ms ON m.id = ms.member_id AND ms.end_date >= date('now')
           WHERE ci.member_id = ?`
        )
        .get(member.id) as any

      // Since membership is expired, the LEFT JOIN with condition should return null
      expect(result.membership_end_date).toBeNull()
    })

    it('should identify no membership', () => {
      const member = createTestMember()
      createTestCheckIn({ memberId: member.id })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT ci.*, ms.end_date AS membership_end_date
           FROM check_ins ci
           INNER JOIN members m ON ci.member_id = m.id
           LEFT JOIN memberships ms ON m.id = ms.member_id AND ms.end_date >= date('now')
           WHERE ci.member_id = ?`
        )
        .get(member.id) as any

      expect(result.membership_end_date).toBeNull()
    })
  })

  describe('Check-In Statistics', () => {
    it('should count check-ins for today', () => {
      const member1 = createTestMember({ phone: '1111111111' })
      const member2 = createTestMember({ phone: '2222222222' })

      const today = new Date().toISOString()
      createTestCheckIn({ memberId: member1.id, checkInTime: today })
      createTestCheckIn({ memberId: member2.id, checkInTime: today })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT COUNT(*) as count
           FROM check_ins
           WHERE DATE(check_in_time) = DATE('now')`
        )
        .get() as any

      expect(result.count).toBe(2)
    })

    it('should count check-ins for date range', () => {
      const member = createTestMember()

      const dates = [
        new Date('2025-01-01'),
        new Date('2025-01-05'),
        new Date('2025-01-10'),
        new Date('2025-01-15')
      ]

      dates.forEach((date) => {
        createTestCheckIn({ memberId: member.id, checkInTime: date.toISOString() })
      })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT COUNT(*) as count
           FROM check_ins
           WHERE DATE(check_in_time) >= ? AND DATE(check_in_time) <= ?`
        )
        .get('2025-01-01', '2025-01-10') as any

      expect(result.count).toBe(3)
    })

    it('should count unique members who checked in', () => {
      const member1 = createTestMember({ phone: '1111111111' })
      const member2 = createTestMember({ phone: '2222222222' })
      const member3 = createTestMember({ phone: '3333333333' })

      createTestCheckIn({ memberId: member1.id, checkInTime: new Date('2025-01-01').toISOString() })
      createTestCheckIn({ memberId: member2.id, checkInTime: new Date('2025-01-02').toISOString() })
      createTestCheckIn({ memberId: member3.id, checkInTime: new Date('2025-01-03').toISOString() })
      createTestCheckIn({ memberId: member1.id, checkInTime: new Date('2025-01-04').toISOString() })

      const db = getTestDatabase()
      const result = db
        .prepare('SELECT COUNT(DISTINCT member_id) as count FROM check_ins')
        .get() as any

      expect(result.count).toBe(3)
    })
  })

  describe('Delete Check-In', () => {
    it('should delete check-in successfully', () => {
      const member = createTestMember()
      const checkIn = createTestCheckIn({ memberId: member.id })

      const db = getTestDatabase()
      db.prepare('DELETE FROM check_ins WHERE id = ?').run(checkIn.id)

      const deleted = db.prepare('SELECT * FROM check_ins WHERE id = ?').get(checkIn.id)

      expect(deleted).toBeUndefined()
    })

    it('should cascade delete check-ins when member is deleted', () => {
      const member = createTestMember()

      createTestCheckIn({ memberId: member.id, checkInTime: new Date('2025-01-01').toISOString() })
      createTestCheckIn({ memberId: member.id, checkInTime: new Date('2025-01-02').toISOString() })

      const db = getTestDatabase()
      db.prepare('DELETE FROM members WHERE id = ?').run(member.id)

      const checkIns = db.prepare('SELECT * FROM check_ins WHERE member_id = ?').all(member.id)

      expect(checkIns).toHaveLength(0)
    })
  })

  describe('Check-In Filtering', () => {
    beforeEach(() => {
      const member1 = createTestMember({ name: 'Alice Johnson', phone: '1111111111' })
      const member2 = createTestMember({ name: 'Bob Smith', phone: '2222222222' })

      createTestCheckIn({ memberId: member1.id, checkInTime: new Date('2025-01-10').toISOString() })
      createTestCheckIn({ memberId: member2.id, checkInTime: new Date('2025-01-15').toISOString() })
      createTestCheckIn({ memberId: member1.id, checkInTime: new Date('2025-01-20').toISOString() })
    })

    it('should filter by member name', () => {
      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT ci.* FROM check_ins ci
           INNER JOIN members m ON ci.member_id = m.id
           WHERE m.name LIKE ?`
        )
        .all('%Alice%')

      expect(result).toHaveLength(2)
    })

    it('should filter by date range', () => {
      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT * FROM check_ins
           WHERE DATE(check_in_time) >= ? AND DATE(check_in_time) <= ?`
        )
        .all('2025-01-01', '2025-01-15')

      expect(result).toHaveLength(2)
    })
  })
})
