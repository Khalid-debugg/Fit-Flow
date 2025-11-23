import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import {
  createTestDatabase,
  cleanupTestDatabase,
  getTestDatabase,
  createTestPlan
} from '../helpers'

describe('Plan Operations', () => {
  beforeEach(() => {
    createTestDatabase()
  })

  afterEach(() => {
    cleanupTestDatabase()
  })

  describe('Create Plan', () => {
    it('should create a plan successfully', () => {
      const plan = createTestPlan({
        name: 'Monthly Plan',
        description: 'Basic monthly membership',
        price: 150,
        durationDays: 30,
        isOffer: false
      })

      expect(plan.id).toBeDefined()
      expect(plan.name).toBe('Monthly Plan')
      expect(plan.price).toBe(150)
      expect(plan.durationDays).toBe(30)
      expect(plan.isOffer).toBe(false)
    })

    it('should create an offer plan', () => {
      const plan = createTestPlan({
        name: 'Black Friday Deal',
        price: 99,
        durationDays: 30,
        isOffer: true
      })

      expect(plan.id).toBeDefined()
      expect(plan.isOffer).toBe(true)
    })

    it('should require name', () => {
      const db = getTestDatabase()
      expect(() => {
        db.prepare(
          `INSERT INTO membership_plans (id, name, price, duration_days, is_offer) VALUES (?, ?, ?, ?, ?)`
        ).run('test-id', null, 100, 30, 0)
      }).toThrow()
    })

    it('should require price', () => {
      const db = getTestDatabase()
      expect(() => {
        db.prepare(
          `INSERT INTO membership_plans (id, name, price, duration_days, is_offer) VALUES (?, ?, ?, ?, ?)`
        ).run('test-id', 'Test Plan', null, 30, 0)
      }).toThrow()
    })

    it('should require duration_days', () => {
      const db = getTestDatabase()
      expect(() => {
        db.prepare(
          `INSERT INTO membership_plans (id, name, price, duration_days, is_offer) VALUES (?, ?, ?, ?, ?)`
        ).run('test-id', 'Test Plan', 100, null, 0)
      }).toThrow()
    })
  })

  describe('Read Plans', () => {
    it('should retrieve plan by id', () => {
      const plan = createTestPlan({ name: 'Yearly Plan', durationDays: 365 })

      const db = getTestDatabase()
      const retrieved = db
        .prepare('SELECT * FROM membership_plans WHERE id = ?')
        .get(plan.id) as any

      expect(retrieved).toBeDefined()
      expect(retrieved.name).toBe('Yearly Plan')
      expect(retrieved.duration_days).toBe(365)
    })

    it('should retrieve all plans', () => {
      createTestPlan({ name: 'Plan 1' })
      createTestPlan({ name: 'Plan 2' })
      createTestPlan({ name: 'Plan 3' })

      const db = getTestDatabase()
      const plans = db.prepare('SELECT * FROM membership_plans').all()

      expect(plans).toHaveLength(3)
    })

    it('should filter offer plans', () => {
      createTestPlan({ name: 'Regular Plan', isOffer: false })
      createTestPlan({ name: 'Special Offer', isOffer: true })
      createTestPlan({ name: 'Another Offer', isOffer: true })

      const db = getTestDatabase()
      const offers = db.prepare('SELECT * FROM membership_plans WHERE is_offer = 1').all()

      expect(offers).toHaveLength(2)
    })
  })

  describe('Update Plan', () => {
    it('should update plan details', () => {
      const plan = createTestPlan({ name: 'Old Name', price: 100 })

      const db = getTestDatabase()
      db.prepare(
        'UPDATE membership_plans SET name = ?, price = ? WHERE id = ?'
      ).run('New Name', 150, plan.id)

      const updated = db
        .prepare('SELECT * FROM membership_plans WHERE id = ?')
        .get(plan.id) as any

      expect(updated.name).toBe('New Name')
      expect(updated.price).toBe(150)
    })

    it('should update offer status', () => {
      const plan = createTestPlan({ isOffer: false })

      const db = getTestDatabase()
      db.prepare('UPDATE membership_plans SET is_offer = ? WHERE id = ?').run(1, plan.id)

      const updated = db
        .prepare('SELECT * FROM membership_plans WHERE id = ?')
        .get(plan.id) as any

      expect(updated.is_offer).toBe(1)
    })
  })

  describe('Delete Plan', () => {
    it('should delete plan successfully', () => {
      const plan = createTestPlan()

      const db = getTestDatabase()
      db.prepare('DELETE FROM membership_plans WHERE id = ?').run(plan.id)

      const deleted = db.prepare('SELECT * FROM membership_plans WHERE id = ?').get(plan.id)

      expect(deleted).toBeUndefined()
    })

    it('should not allow deleting plan with active memberships', () => {
      const db = getTestDatabase()
      const plan = createTestPlan()
      const member = db
        .prepare(
          `INSERT INTO members (id, name, phone, gender, join_date) VALUES (?, ?, ?, ?, ?) RETURNING id`
        )
        .get('member-1', 'Test Member', '1234567890', 'male', '2025-01-01') as any

      db.prepare(
        `INSERT INTO memberships (id, member_id, plan_id, start_date, end_date, amount_paid, payment_method, payment_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('membership-1', member.id, plan.id, '2025-01-01', '2025-02-01', 100, 'cash', '2025-01-01')

      expect(() => {
        db.prepare('DELETE FROM membership_plans WHERE id = ?').run(plan.id)
      }).toThrow()
    })
  })

  describe('Plan Duration Filters', () => {
    beforeEach(() => {
      createTestPlan({ name: 'Daily', durationDays: 1 })
      createTestPlan({ name: 'Weekly', durationDays: 7 })
      createTestPlan({ name: 'Monthly', durationDays: 30 })
      createTestPlan({ name: 'Quarterly', durationDays: 90 })
      createTestPlan({ name: 'Yearly', durationDays: 365 })
      createTestPlan({ name: 'Custom 45 days', durationDays: 45 })
    })

    it('should filter daily plans (1-6 days)', () => {
      const db = getTestDatabase()
      const daily = db
        .prepare(
          'SELECT * FROM membership_plans WHERE duration_days >= 1 AND duration_days < 7'
        )
        .all()

      expect(daily).toHaveLength(1)
    })

    it('should filter weekly plans (7 days, multiples of 7 < 30)', () => {
      const db = getTestDatabase()
      const weekly = db
        .prepare(
          'SELECT * FROM membership_plans WHERE (duration_days % 7 = 0 AND duration_days < 30)'
        )
        .all()

      expect(weekly).toHaveLength(1)
    })

    it('should filter monthly plans (28-31 or multiples of 30)', () => {
      const db = getTestDatabase()
      const monthly = db
        .prepare(
          'SELECT * FROM membership_plans WHERE (duration_days BETWEEN 28 AND 31 OR duration_days % 30 = 0)'
        )
        .all()

      expect(monthly.length).toBeGreaterThanOrEqual(2) // Monthly and Quarterly
    })

    it('should filter yearly plans (365+ or multiples of 365)', () => {
      const db = getTestDatabase()
      const yearly = db
        .prepare(
          'SELECT * FROM membership_plans WHERE (duration_days % 365 = 0 OR duration_days >= 365)'
        )
        .all()

      expect(yearly).toHaveLength(1)
    })
  })

  describe('Plan Pricing', () => {
    it('should handle decimal prices', () => {
      const plan = createTestPlan({ price: 149.99 })

      const db = getTestDatabase()
      const retrieved = db
        .prepare('SELECT * FROM membership_plans WHERE id = ?')
        .get(plan.id) as any

      expect(retrieved.price).toBe(149.99)
    })

    it('should handle zero price', () => {
      const plan = createTestPlan({ price: 0 })

      const db = getTestDatabase()
      const retrieved = db
        .prepare('SELECT * FROM membership_plans WHERE id = ?')
        .get(plan.id) as any

      expect(retrieved.price).toBe(0)
    })
  })
})
