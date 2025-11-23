import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import {
  createTestDatabase,
  cleanupTestDatabase,
  getTestDatabase,
  createTestMember,
  createTestPlan,
  createTestMembership,
  createTestCheckIn
} from '../helpers'

describe('Dashboard Operations', () => {
  beforeEach(() => {
    createTestDatabase()
  })

  afterEach(() => {
    cleanupTestDatabase()
  })

  describe('Revenue Statistics', () => {
    it('should calculate total revenue for this month', () => {
      const member = createTestMember()
      const plan = createTestPlan({ price: 200 })

      const thisMonth = new Date()
      const paymentDate = thisMonth.toISOString().split('T')[0]

      createTestMembership({
        memberId: member.id,
        planId: plan.id,
        amountPaid: 200,
        paymentDate
      })

      createTestMembership({
        memberId: member.id,
        planId: plan.id,
        amountPaid: 150,
        paymentDate
      })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT SUM(amount_paid) as total
           FROM memberships
           WHERE strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')`
        )
        .get() as any

      expect(result.total).toBe(350)
    })

    it('should calculate revenue for last month', () => {
      const member = createTestMember()
      const plan = createTestPlan()

      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      const paymentDate = lastMonth.toISOString().split('T')[0]

      createTestMembership({
        memberId: member.id,
        planId: plan.id,
        amountPaid: 300,
        paymentDate
      })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT SUM(amount_paid) as total
           FROM memberships
           WHERE strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now', '-1 month')`
        )
        .get() as any

      expect(result.total).toBe(300)
    })

    it('should calculate daily revenue for last 30 days', () => {
      const member = createTestMember()
      const plan = createTestPlan()

      const today = new Date()
      const tenDaysAgo = new Date(today)
      tenDaysAgo.setDate(today.getDate() - 10)
      const fiveDaysAgo = new Date(today)
      fiveDaysAgo.setDate(today.getDate() - 5)

      const dates = [
        { date: tenDaysAgo.toISOString().split('T')[0], amount: 100 },
        { date: tenDaysAgo.toISOString().split('T')[0], amount: 150 },
        { date: fiveDaysAgo.toISOString().split('T')[0], amount: 200 },
        { date: today.toISOString().split('T')[0], amount: 120 }
      ]

      dates.forEach(({ date, amount }) => {
        createTestMembership({
          memberId: member.id,
          planId: plan.id,
          amountPaid: amount,
          paymentDate: date
        })
      })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT
            DATE(payment_date) as date,
            SUM(amount_paid) as revenue
           FROM memberships
           WHERE payment_date >= DATE('now', '-30 days')
           GROUP BY DATE(payment_date)
           ORDER BY date ASC`
        )
        .all() as any[]

      expect(result.length).toBeGreaterThan(0)
      const tenDaysAgoDate = tenDaysAgo.toISOString().split('T')[0]
      const dayRevenue = result.find((r) => r.date === tenDaysAgoDate)
      expect(dayRevenue?.revenue).toBe(250)
    })

    it('should handle zero revenue', () => {
      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT SUM(amount_paid) as total
           FROM memberships
           WHERE strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')`
        )
        .get() as any

      expect(result.total).toBeNull()
    })
  })

  describe('Membership Statistics', () => {
    it('should count active memberships', () => {
      const member1 = createTestMember({ phone: '1111111111' })
      const member2 = createTestMember({ phone: '2222222222' })
      const plan = createTestPlan()

      const today = new Date().toISOString().split('T')[0]
      const future = new Date()
      future.setDate(future.getDate() + 30)
      const futureDate = future.toISOString().split('T')[0]

      createTestMembership({
        memberId: member1.id,
        planId: plan.id,
        startDate: today,
        endDate: futureDate
      })

      createTestMembership({
        memberId: member2.id,
        planId: plan.id,
        startDate: today,
        endDate: futureDate
      })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT COUNT(DISTINCT member_id) as count
           FROM memberships
           WHERE end_date >= date('now')`
        )
        .get() as any

      expect(result.count).toBe(2)
    })

    it('should count expiring memberships (within 7 days)', () => {
      const member1 = createTestMember({ phone: '1111111111' })
      const member2 = createTestMember({ phone: '2222222222' })
      const plan = createTestPlan()

      const today = new Date()
      const expiringSoon = new Date()
      expiringSoon.setDate(today.getDate() + 5)

      const farFuture = new Date()
      farFuture.setDate(today.getDate() + 30)

      createTestMembership({
        memberId: member1.id,
        planId: plan.id,
        endDate: expiringSoon.toISOString().split('T')[0]
      })

      createTestMembership({
        memberId: member2.id,
        planId: plan.id,
        endDate: farFuture.toISOString().split('T')[0]
      })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT COUNT(*) as count
           FROM memberships
           WHERE end_date >= date('now')
             AND end_date <= date('now', '+7 days')`
        )
        .get() as any

      expect(result.count).toBe(1)
    })

    it('should retrieve expiring memberships with member details', () => {
      const member = createTestMember({ name: 'Expiring Member' })
      const plan = createTestPlan({ name: 'Monthly Plan' })

      const expiringSoon = new Date()
      expiringSoon.setDate(expiringSoon.getDate() + 3)

      createTestMembership({
        memberId: member.id,
        planId: plan.id,
        endDate: expiringSoon.toISOString().split('T')[0]
      })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT
            ms.*,
            m.name AS member_name,
            m.phone AS member_phone,
            mp.name AS plan_name,
            CAST(julianday(ms.end_date) - julianday('now') AS INTEGER) AS days_remaining
           FROM memberships ms
           INNER JOIN members m ON ms.member_id = m.id
           INNER JOIN membership_plans mp ON ms.plan_id = mp.id
           WHERE ms.end_date >= date('now')
             AND ms.end_date <= date('now', '+7 days')`
        )
        .all() as any[]

      expect(result).toHaveLength(1)
      expect(result[0].member_name).toBe('Expiring Member')
      expect(result[0].plan_name).toBe('Monthly Plan')
      expect(result[0].days_remaining).toBeGreaterThanOrEqual(0)
      expect(result[0].days_remaining).toBeLessThanOrEqual(7)
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

    it('should count check-ins for this week', () => {
      const member = createTestMember()

      const now = new Date()
      const dayOfWeek = now.getDay()
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

      const monday = new Date(now)
      monday.setDate(now.getDate() - diffToMonday)

      createTestCheckIn({ memberId: member.id, checkInTime: monday.toISOString() })
      createTestCheckIn({ memberId: member.id, checkInTime: now.toISOString() })

      const db = getTestDatabase()
      const weekStart = monday.toISOString().split('T')[0]
      const result = db
        .prepare(
          `SELECT COUNT(*) as count
           FROM check_ins
           WHERE DATE(check_in_time) >= ?`
        )
        .get(weekStart) as any

      expect(result.count).toBeGreaterThanOrEqual(1)
    })

    it('should count check-ins for this month', () => {
      const member = createTestMember()

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      const midMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 15)

      createTestCheckIn({ memberId: member.id, checkInTime: startOfMonth.toISOString() })
      createTestCheckIn({ memberId: member.id, checkInTime: midMonth.toISOString() })

      const db = getTestDatabase()
      const monthStart = startOfMonth.toISOString().split('T')[0]
      const result = db
        .prepare(
          `SELECT COUNT(*) as count
           FROM check_ins
           WHERE DATE(check_in_time) >= ?`
        )
        .get(monthStart) as any

      expect(result.count).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Recent Check-Ins with Membership Status', () => {
    it('should retrieve recent check-ins with member and membership details', () => {
      const member = createTestMember({ name: 'Active Member', phone: '1234567890' })
      const plan = createTestPlan({ name: 'Premium Plan' })

      const today = new Date().toISOString().split('T')[0]
      const future = new Date()
      future.setDate(future.getDate() + 30)

      createTestMembership({
        memberId: member.id,
        planId: plan.id,
        startDate: today,
        endDate: future.toISOString().split('T')[0]
      })

      createTestCheckIn({ memberId: member.id })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT
            ci.id,
            ci.member_id,
            ci.check_in_time,
            m.name AS member_name,
            m.phone AS member_phone,
            ms.end_date AS membership_end_date
           FROM check_ins ci
           INNER JOIN members m ON ci.member_id = m.id
           LEFT JOIN memberships ms ON ms.id = (
             SELECT id FROM memberships
             WHERE member_id = m.id
             ORDER BY end_date DESC
             LIMIT 1
           )
           ORDER BY ci.check_in_time DESC
           LIMIT 5`
        )
        .all() as any[]

      expect(result).toHaveLength(1)
      expect(result[0].member_name).toBe('Active Member')
      expect(result[0].member_phone).toBe('1234567890')
      expect(result[0].membership_end_date).toBeDefined()
    })

    it('should show membership status as active for valid memberships', () => {
      const member = createTestMember()
      const plan = createTestPlan()

      const today = new Date().toISOString().split('T')[0]
      const future = new Date()
      future.setDate(future.getDate() + 30)

      createTestMembership({
        memberId: member.id,
        planId: plan.id,
        startDate: today,
        endDate: future.toISOString().split('T')[0]
      })

      createTestCheckIn({ memberId: member.id })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT
            ci.*,
            ms.end_date AS membership_end_date
           FROM check_ins ci
           INNER JOIN members m ON ci.member_id = m.id
           LEFT JOIN memberships ms ON ms.id = (
             SELECT id FROM memberships
             WHERE member_id = m.id
             ORDER BY end_date DESC
             LIMIT 1
           )
           WHERE ci.member_id = ?`
        )
        .get(member.id) as any

      const isActive = result.membership_end_date >= today
      expect(isActive).toBe(true)
    })

    it('should show membership status as expired for past memberships', () => {
      const member = createTestMember()
      const plan = createTestPlan()

      const past = new Date()
      past.setDate(past.getDate() - 60)
      const expired = new Date()
      expired.setDate(expired.getDate() - 1)

      createTestMembership({
        memberId: member.id,
        planId: plan.id,
        startDate: past.toISOString().split('T')[0],
        endDate: expired.toISOString().split('T')[0]
      })

      createTestCheckIn({ memberId: member.id })

      const db = getTestDatabase()
      const result = db
        .prepare(
          `SELECT
            ci.*,
            ms.end_date AS membership_end_date
           FROM check_ins ci
           INNER JOIN members m ON ci.member_id = m.id
           LEFT JOIN memberships ms ON ms.id = (
             SELECT id FROM memberships
             WHERE member_id = m.id
             ORDER BY end_date DESC
             LIMIT 1
           )
           WHERE ci.member_id = ?`
        )
        .get(member.id) as any

      const today = new Date().toISOString().split('T')[0]
      const isExpired = result.membership_end_date < today
      expect(isExpired).toBe(true)
    })
  })

  describe('Revenue Trends', () => {
    it('should calculate percentage change between months', () => {
      const member = createTestMember()
      const plan = createTestPlan()

      const thisMonth = new Date()
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      createTestMembership({
        memberId: member.id,
        planId: plan.id,
        amountPaid: 500,
        paymentDate: lastMonth.toISOString().split('T')[0]
      })

      createTestMembership({
        memberId: member.id,
        planId: plan.id,
        amountPaid: 750,
        paymentDate: thisMonth.toISOString().split('T')[0]
      })

      const db = getTestDatabase()

      const thisMonthResult = db
        .prepare(
          `SELECT SUM(amount_paid) as total
           FROM memberships
           WHERE strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')`
        )
        .get() as any

      const lastMonthResult = db
        .prepare(
          `SELECT SUM(amount_paid) as total
           FROM memberships
           WHERE strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now', '-1 month')`
        )
        .get() as any

      const totalThisMonth = thisMonthResult.total || 0
      const totalLastMonth = lastMonthResult.total || 0
      const percentageChange =
        totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0

      expect(percentageChange).toBe(50) // 750 is 50% more than 500
    })
  })
})
