import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { addDays, isAfter, isBefore, parseISO } from 'date-fns'
import {
  createTestDatabase,
  cleanupTestDatabase,
  getTestDatabase,
  createTestMember,
  createTestPlan,
  createTestMembership
} from '../helpers'

describe('Membership Operations', () => {
  beforeEach(() => {
    createTestDatabase()
  })

  afterEach(() => {
    cleanupTestDatabase()
  })

  describe('Create Membership', () => {
    it('should create a membership successfully', () => {
      const member = createTestMember()
      const plan = createTestPlan({ durationDays: 30, price: 100 })

      const membership = createTestMembership({
        memberId: member.id,
        planId: plan.id,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        amountPaid: 100,
        paymentDate: '2025-01-01',
        paymentMethod: 'cash'
      })

      expect(membership.id).toBeDefined()
      expect(membership.memberId).toBe(member.id)
      expect(membership.planId).toBe(plan.id)
      expect(membership.startDate).toBe('2025-01-01')
      expect(membership.endDate).toBe('2025-01-31')
    })

    it('should require all mandatory fields', () => {
      const member = createTestMember()
      const plan = createTestPlan()
      const db = getTestDatabase()

      // Missing member_id
      expect(() => {
        db.prepare(
          `INSERT INTO memberships (plan_id, start_date, end_date, amount_paid, payment_date, payment_method)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(plan.id, '2025-01-01', '2025-01-31', 100, '2025-01-01', 'cash')
      }).toThrow()

      // Missing plan_id
      expect(() => {
        db.prepare(
          `INSERT INTO memberships (member_id, start_date, end_date, amount_paid, payment_date, payment_method)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(member.id, '2025-01-01', '2025-01-31', 100, '2025-01-01', 'cash')
      }).toThrow()
    })

    it('should enforce foreign key constraints', () => {
      const member = createTestMember()
      const db = getTestDatabase()

      // Try to create membership with non-existent plan
      expect(() => {
        db.prepare(
          `INSERT INTO memberships (member_id, plan_id, start_date, end_date, amount_paid, payment_date, payment_method)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(member.id, 999, '2025-01-01', '2025-01-31', 100, '2025-01-01', 'cash')
      }).toThrow()
    })

    it('should cascade delete memberships when member is deleted', () => {
      const member = createTestMember()
      const plan = createTestPlan()
      const membership = createTestMembership({ memberId: member.id, planId: plan.id })
      const db = getTestDatabase()

      // Delete the member
      db.prepare('DELETE FROM members WHERE id = ?').run(member.id)

      // Membership should be automatically deleted
      const deletedMembership = db
        .prepare('SELECT * FROM memberships WHERE id = ?')
        .get(membership.id)
      expect(deletedMembership).toBeUndefined()
    })
  })

  describe('Membership Date Logic', () => {
    it('should calculate correct end date based on start date and duration', () => {
      const startDate = new Date('2025-01-01')
      const durationDays = 30

      const endDate = addDays(startDate, durationDays)

      expect(endDate.toISOString().split('T')[0]).toBe('2025-01-31')
    })

    it('should identify active memberships', () => {
      const today = new Date('2025-01-15')
      const startDate = parseISO('2025-01-01')
      const endDate = parseISO('2025-01-31')

      const isActive = isAfter(today, startDate) && isBefore(today, endDate)

      expect(isActive).toBe(true)
    })

    it('should identify expired memberships', () => {
      const today = new Date('2025-02-15')
      const endDate = parseISO('2025-01-31')

      const isExpired = isAfter(today, endDate)

      expect(isExpired).toBe(true)
    })

    it('should identify future memberships', () => {
      const today = new Date('2024-12-15')
      const startDate = parseISO('2025-01-01')

      const isFuture = isBefore(today, startDate)

      expect(isFuture).toBe(true)
    })
  })

  describe('Query Memberships', () => {
    it('should retrieve memberships with member and plan details', () => {
      const member = createTestMember({ name: 'John Doe' })
      const plan = createTestPlan({ name: 'Gold Plan', price: 150 })
      createTestMembership({ memberId: member.id, planId: plan.id })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT
            memberships.*,
            members.name as member_name,
            membership_plans.name as plan_name,
            membership_plans.price as plan_price
          FROM memberships
          JOIN members ON memberships.member_id = members.id
          JOIN membership_plans ON memberships.plan_id = membership_plans.id
          WHERE memberships.member_id = ?`
        )
        .get(member.id) as any

      expect(result.member_name).toBe('John Doe')
      expect(result.plan_name).toBe('Gold Plan')
      expect(result.plan_price).toBe(150)
    })

    it('should filter memberships by date range', () => {
      const member1 = createTestMember({ phone: '1111111111' })
      const member2 = createTestMember({ phone: '2222222222' })
      const plan = createTestPlan()

      createTestMembership({
        memberId: member1.id,
        planId: plan.id,
        startDate: '2025-01-01'
      })
      createTestMembership({
        memberId: member2.id,
        planId: plan.id,
        startDate: '2025-02-01'
      })

      const db = getTestDatabase()
      const januaryMemberships = db
        .prepare(
          `SELECT * FROM memberships
           WHERE start_date >= ? AND start_date < ?`
        )
        .all('2025-01-01', '2025-02-01')

      expect(januaryMemberships).toHaveLength(1)
    })
  })

  describe('Update Membership', () => {
    it('should update membership dates', () => {
      const member = createTestMember()
      const plan = createTestPlan()
      const membership = createTestMembership({ memberId: member.id, planId: plan.id })
      const db = getTestDatabase()

      const newEndDate = '2025-02-28'
      const result = db
        .prepare('UPDATE memberships SET end_date = ? WHERE id = ?')
        .run(newEndDate, membership.id)

      expect(result.changes).toBe(1)

      const updated = db
        .prepare('SELECT * FROM memberships WHERE id = ?')
        .get(membership.id) as any
      expect(updated.end_date).toBe(newEndDate)
    })

    it('should update payment information', () => {
      const member = createTestMember()
      const plan = createTestPlan()
      const membership = createTestMembership({
        memberId: member.id,
        planId: plan.id,
        amountPaid: 100,
        paymentMethod: 'cash'
      })
      const db = getTestDatabase()

      const result = db
        .prepare('UPDATE memberships SET amount_paid = ?, payment_method = ? WHERE id = ?')
        .run(150, 'card', membership.id)

      expect(result.changes).toBe(1)

      const updated = db
        .prepare('SELECT * FROM memberships WHERE id = ?')
        .get(membership.id) as any
      expect(updated.amount_paid).toBe(150)
      expect(updated.payment_method).toBe('card')
    })
  })

  describe('Delete Membership', () => {
    it('should delete membership successfully', () => {
      const member = createTestMember()
      const plan = createTestPlan()
      const membership = createTestMembership({ memberId: member.id, planId: plan.id })
      const db = getTestDatabase()

      const result = db.prepare('DELETE FROM memberships WHERE id = ?').run(membership.id)
      expect(result.changes).toBe(1)

      const deleted = db.prepare('SELECT * FROM memberships WHERE id = ?').get(membership.id)
      expect(deleted).toBeUndefined()
    })
  })

  describe('Membership Statistics', () => {
    it('should count total memberships per member', () => {
      const member = createTestMember()
      const plan = createTestPlan()

      // Create 3 memberships for the same member
      createTestMembership({ memberId: member.id, planId: plan.id })
      createTestMembership({
        memberId: member.id,
        planId: plan.id,
        startDate: '2025-02-01'
      })
      createTestMembership({
        memberId: member.id,
        planId: plan.id,
        startDate: '2025-03-01'
      })

      const db = getTestDatabase()
      const count = db
        .prepare('SELECT COUNT(*) as total FROM memberships WHERE member_id = ?')
        .get(member.id) as any

      expect(count.total).toBe(3)
    })

    it('should calculate total revenue from memberships', () => {
      const member1 = createTestMember({ phone: '1111111111' })
      const member2 = createTestMember({ phone: '2222222222' })
      const plan = createTestPlan()

      createTestMembership({ memberId: member1.id, planId: plan.id, amountPaid: 100 })
      createTestMembership({ memberId: member2.id, planId: plan.id, amountPaid: 150 })

      const db = getTestDatabase()
      const revenue = db.prepare('SELECT SUM(amount_paid) as total FROM memberships').get() as any

      expect(revenue.total).toBe(250)
    })
  })
})
