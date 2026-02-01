import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { toSnake, toCamel } from './utils'
import type {
  Membership,
  MembershipDbRow,
  MembershipFilters,
  MembershipPaymentDbRow
} from '../../renderer/src/models/membership'
import crypto from 'crypto'
import { PlanDbRow } from '@renderer/models/plan'
import { MemberDbRow } from '@renderer/models/member'

function generateEncryptedId() {
  return crypto.randomBytes(8).toString('hex')
}

export function registerMembershipHandlers() {
  ipcMain.handle(
    'memberships:get',
    async (_event, page: number = 1, filters: MembershipFilters) => {
      const db = getDatabase()
      const limit = 10
      const offset = (page - 1) * limit

      const whereConditions: string[] = []
      const params: (string | number)[] = []

      if (filters.query?.trim()) {
        const search = `%${filters.query.trim()}%`
        whereConditions.push('(m.name LIKE ? OR m.phone LIKE ? OR CAST(m.id AS TEXT) LIKE ?)')
        params.push(search, search, search)
      }

      if (filters.memberId) {
        whereConditions.push('ms.member_id = ?')
        params.push(filters.memberId)
      }

      if (filters.planId) {
        whereConditions.push('ms.plan_id = ?')
        params.push(filters.planId)
      }
      // Filter by date range (start_date)
      if (filters.dateFrom) {
        whereConditions.push('ms.start_date >= ?')
        params.push(filters.dateFrom)
      }

      if (filters.dateTo) {
        whereConditions.push('ms.start_date <= ?')
        params.push(filters.dateTo)
      }

      // Filter by status (active/expired)
      const today = new Date().toISOString().split('T')[0]
      if (filters.status === 'active') {
        whereConditions.push('ms.end_date >= ?')
        params.push(today)
      } else if (filters.status === 'expired') {
        whereConditions.push('ms.end_date < ?')
        params.push(today)
      }

      const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : ''

      // Get total count first (before applying limit/offset)
      const countQuery = `
      SELECT COUNT(*) as total
      FROM memberships ms
      INNER JOIN members m ON ms.member_id = m.id
      INNER JOIN membership_plans mp ON ms.plan_id = mp.id
      ${whereClause}
    `
      const totalResult = db.prepare(countQuery).get(...params) as { total: number }
      const total = totalResult.total

      const query = `
      SELECT
        ms.*,
        m.name AS member_name,
        m.phone AS member_phone,
        m.country_code AS member_country_code,
        mp.name AS plan_name,
        mp.price AS plan_price,
        mp.plan_type AS plan_type
      FROM memberships ms
      INNER JOIN members m ON ms.member_id = m.id
      INNER JOIN membership_plans mp ON ms.plan_id = mp.id
      ${whereClause}
      ORDER BY ms.created_at DESC
      LIMIT ? OFFSET ?
    `

      const rows = db.prepare(query).all(...params, limit, offset) as MembershipDbRow[]

      const processedMemberships = rows.map((row) => {
        const membership = toCamel(row) as Membership
        membership.id = row.id
        membership.memberId = row.member_id
        membership.planId = row.plan_id
        membership.startDate = row.start_date
        membership.endDate = row.end_date
        membership.totalPrice = row.total_price
        membership.amountPaid = row.amount_paid
        membership.remainingBalance = row.remaining_balance
        membership.paymentStatus = row.payment_status
        membership.paymentMethod = row.payment_method
        membership.paymentDate = row.payment_date
        membership.remainingCheckIns = row.remaining_check_ins
        membership.isCustom = Boolean(row.is_custom)
        membership.priceModifierType = row.price_modifier_type
        membership.priceModifierValue = row.price_modifier_value
        membership.customPriceName = row.custom_price_name
        membership.memberName = row.member_name
        membership.memberPhone = row.member_phone
        membership.memberCountryCode = row.member_country_code
        membership.planName = row.plan_name
        membership.planPrice = row.plan_price
        membership.planType = row.plan_type
        return membership
      })

      return {
        memberships: processedMemberships,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    }
  )

  ipcMain.handle('memberships:getById', async (_event, id: string) => {
    const db = getDatabase()
    const row = db
      .prepare(
        `
      SELECT
        ms.*,
        m.name AS member_name,
        m.phone AS member_phone,
        mp.name AS plan_name,
        mp.price AS plan_price,
        mp.plan_type AS plan_type
      FROM memberships ms
      INNER JOIN members m ON ms.member_id = m.id
      INNER JOIN membership_plans mp ON ms.plan_id = mp.id
      WHERE ms.id = ?
    `
      )
      .get(id) as MembershipDbRow | undefined

    if (!row) return null

    const membership = toCamel(row) as Membership
    membership.id = row.id
    membership.memberId = row.member_id
    membership.planId = row.plan_id
    membership.startDate = row.start_date
    membership.endDate = row.end_date
    membership.totalPrice = row.total_price
    membership.amountPaid = row.amount_paid
    membership.remainingBalance = row.remaining_balance
    membership.paymentStatus = row.payment_status
    membership.paymentMethod = row.payment_method
    membership.paymentDate = row.payment_date
    membership.remainingCheckIns = row.remaining_check_ins
    membership.isCustom = Boolean(row.is_custom)
    membership.priceModifierType = row.price_modifier_type
    membership.priceModifierValue = row.price_modifier_value
    membership.customPriceName = row.custom_price_name
    membership.memberName = row.member_name
    membership.memberPhone = row.member_phone
    membership.planName = row.plan_name
    membership.planPrice = row.plan_price
    membership.planType = row.plan_type

    return membership
  })

  ipcMain.handle('memberships:create', async (_event, membership: Membership) => {
    const db = getDatabase()
    const snake = toSnake(membership)

    // Check for overlapping memberships
    const overlapping = db
      .prepare(
        `
      SELECT id, start_date, end_date
      FROM memberships
      WHERE member_id = ?
      AND (
        (start_date <= ? AND end_date >= ?)  
        OR (start_date <= ? AND end_date >= ?)  
        OR (start_date >= ? AND end_date <= ?)  
      )
    `
      )
      .get(
        snake.member_id,
        snake.start_date,
        snake.start_date, // Check if start_date falls within existing
        snake.end_date,
        snake.end_date, // Check if end_date falls within existing
        snake.start_date,
        snake.end_date // Check if new membership completely overlaps
      )

    if (overlapping) {
      throw new Error('MEMBERSHIP_OVERLAP')
    }

    const id = generateEncryptedId()

    // Calculate payment status and remaining balance
    const totalPrice = snake.total_price as number
    const amountPaid = snake.amount_paid as number
    const remainingBalance = totalPrice - amountPaid
    let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'

    if (amountPaid >= totalPrice) {
      paymentStatus = 'paid'
    } else if (amountPaid > 0) {
      paymentStatus = 'partial'
    }

    const stmt = db.prepare(`
      INSERT INTO memberships (
        id, member_id, plan_id, start_date, end_date,
        total_price, amount_paid, remaining_balance, payment_status,
        payment_method, payment_date, remaining_check_ins, is_custom,
        price_modifier_type, price_modifier_value, custom_price_name, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const paymentDate =
      typeof snake.payment_date === 'string' && snake.payment_date.trim() !== ''
        ? snake.payment_date
        : new Date().toISOString().split('T')[0]

    stmt.run(
      id,
      snake.member_id,
      snake.plan_id,
      snake.start_date,
      snake.end_date,
      totalPrice,
      amountPaid,
      remainingBalance,
      paymentStatus,
      snake.payment_method,
      paymentDate,
      snake.remaining_check_ins || null,
      snake.is_custom ? 1 : 0,
      snake.price_modifier_type || null,
      snake.price_modifier_value || null,
      snake.custom_price_name || null,
      snake.notes || null
    )

    // Always create a completed payment record for initial payment (even if 0)
    const initialPaymentId = generateEncryptedId()
    db.prepare(
      `
      INSERT INTO membership_payments (
        id, membership_id, amount, payment_method, payment_date, payment_status, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      initialPaymentId,
      id,
      amountPaid,
      snake.payment_method,
      paymentDate,
      'completed',
      'Initial payment'
    )

    // Handle remaining balance based on whether payments are scheduled
    if (remainingBalance > 0) {
      if (
        snake.has_scheduled_payments &&
        snake.scheduled_payments &&
        Array.isArray(snake.scheduled_payments)
      ) {
        // Create scheduled payments with specific dates
        for (const scheduledPayment of snake.scheduled_payments) {
          const paymentId = generateEncryptedId()
          db.prepare(
            `
            INSERT INTO membership_payments (
              id, membership_id, amount, payment_method, payment_date, payment_status, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            paymentId,
            id,
            scheduledPayment.amount,
            scheduledPayment.payment_method,
            scheduledPayment.payment_date,
            'scheduled',
            scheduledPayment.notes || null
          )
        }
      } else {
        // Create a single pending payment for remaining balance (no specific date)
        const pendingPaymentId = generateEncryptedId()
        db.prepare(
          `
          INSERT INTO membership_payments (
            id, membership_id, amount, payment_method, payment_date, payment_status, notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `
        ).run(
          pendingPaymentId,
          id,
          remainingBalance,
          snake.payment_method,
          paymentDate, // Use same date as initial payment, just a placeholder
          'pending',
          'Remaining balance'
        )
      }
    }

    return { id, ...membership }
  })

  ipcMain.handle('memberships:update', async (_event, id: string, membership: Membership) => {
    const db = getDatabase()
    const snake = toSnake(membership)

    // Check for overlapping memberships (excluding current one being updated)
    const overlapping = db
      .prepare(
        `
      SELECT id, start_date, end_date
      FROM memberships
      WHERE member_id = ?
      AND id != ?
      AND (
        (start_date <= ? AND end_date >= ?)
        OR (start_date <= ? AND end_date >= ?)
        OR (start_date >= ? AND end_date <= ?)
      )
    `
      )
      .get(
        snake.member_id,
        id,
        snake.start_date,
        snake.start_date,
        snake.end_date,
        snake.end_date,
        snake.start_date,
        snake.end_date
      )

    if (overlapping) {
      throw new Error('MEMBERSHIP_OVERLAP')
    }

    // Calculate payment status and remaining balance
    const totalPrice = snake.total_price as number
    const amountPaid = snake.amount_paid as number
    const remainingBalance = totalPrice - amountPaid
    let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'

    if (amountPaid >= totalPrice) {
      paymentStatus = 'paid'
    } else if (amountPaid > 0) {
      paymentStatus = 'partial'
    }

    const stmt = db.prepare(`
      UPDATE memberships
      SET
        member_id = ?,
        plan_id = ?,
        start_date = ?,
        end_date = ?,
        total_price = ?,
        amount_paid = ?,
        remaining_balance = ?,
        payment_status = ?,
        payment_method = ?,
        payment_date = ?,
        remaining_check_ins = ?,
        is_custom = ?,
        price_modifier_type = ?,
        price_modifier_value = ?,
        custom_price_name = ?,
        notes = ?
      WHERE id = ?
    `)

    stmt.run(
      snake.member_id,
      snake.plan_id,
      snake.start_date,
      snake.end_date,
      totalPrice,
      amountPaid,
      remainingBalance,
      paymentStatus,
      snake.payment_method,
      snake.payment_date,
      snake.remaining_check_ins || null,
      snake.is_custom ? 1 : 0,
      snake.price_modifier_type || null,
      snake.price_modifier_value || null,
      snake.custom_price_name || null,
      snake.notes || null,
      id
    )

    return { id, ...membership }
  })

  ipcMain.handle('memberships:delete', async (_event, id: string) => {
    const db = getDatabase()
    db.prepare('DELETE FROM memberships WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('memberships:getMembers', async () => {
    const db = getDatabase()
    const rows = db
      .prepare('SELECT id, name, phone, country_code FROM members ORDER BY name')
      .all() as MemberDbRow[]
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      countryCode: row.country_code
    }))
  })

  ipcMain.handle('memberships:getPlans', async () => {
    const db = getDatabase()
    const rows = db
      .prepare(
        'SELECT id, name, price, duration_days, plan_type, check_in_limit FROM membership_plans ORDER BY name'
      )
      .all() as PlanDbRow[]
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      price: r.price,
      durationDays: r.duration_days,
      planType: r.plan_type,
      checkInLimit: r.check_in_limit
    }))
  })
  ipcMain.handle('memberships:extend', async (_event, id: string) => {
    const db = getDatabase()

    const row = db
      .prepare(
        'SELECT start_date, end_date, total_price, amount_paid, remaining_balance FROM memberships WHERE id = ?'
      )
      .get(id) as MembershipDbRow

    if (!row) throw new Error('MEMBERSHIP_NOT_FOUND')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endDate = new Date(row.end_date)
    endDate.setHours(0, 0, 0, 0)

    // Calculate membership duration in days
    const start = new Date(row.start_date)
    const end = new Date(row.end_date)
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    // Determine new start date
    let newStartDate: Date
    if (endDate < today) {
      // If membership has expired, start from today
      newStartDate = new Date(today)
    } else {
      // If membership is still active, start from day after end date
      newStartDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000)
    }

    // Calculate new end date by adding duration to new start date
    const newEndDate = new Date(newStartDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const newTotalPrice = row.total_price * 2
    const newAmountPaid = row.amount_paid * 2
    const newRemainingBalance = newTotalPrice - newAmountPaid
    const paymentDate = new Date().toISOString().split('T')[0]

    const paymentStatus =
      newAmountPaid >= newTotalPrice ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid'

    db.prepare(
      `
    UPDATE memberships
    SET
      end_date = ?,
      total_price = ?,
      amount_paid = ?,
      remaining_balance = ?,
      payment_status = ?,
      payment_date = ?
    WHERE id = ?
  `
    ).run(
      newEndDate,
      newTotalPrice,
      newAmountPaid,
      newRemainingBalance,
      paymentStatus,
      paymentDate,
      id
    )

    return { id, newEndDate, newAmountPaid }
  })

  // Payment handlers
  ipcMain.handle(
    'memberships:addPayment',
    async (
      _event,
      membershipId: string,
      payment: { amount: number; paymentMethod: string; paymentDate: string; notes?: string }
    ) => {
      const db = getDatabase()

      // Get current membership
      const membership = db
        .prepare('SELECT total_price, amount_paid, remaining_balance FROM memberships WHERE id = ?')
        .get(membershipId) as
        | { total_price: number; amount_paid: number; remaining_balance: number }
        | undefined

      if (!membership) throw new Error('MEMBERSHIP_NOT_FOUND')

      // Calculate new amounts
      const newAmountPaid = membership.amount_paid + payment.amount
      const newRemainingBalance = membership.total_price - newAmountPaid
      const newPaymentStatus =
        newAmountPaid >= membership.total_price ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid'

      // Create payment record
      const paymentId = generateEncryptedId()
      db.prepare(
        `
        INSERT INTO membership_payments (
          id, membership_id, amount, payment_method, payment_date, payment_status, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        paymentId,
        membershipId,
        payment.amount,
        payment.paymentMethod,
        payment.paymentDate,
        'completed',
        payment.notes || null
      )

      // Update membership
      db.prepare(
        `
        UPDATE memberships
        SET
          amount_paid = ?,
          remaining_balance = ?,
          payment_status = ?,
          payment_method = ?,
          payment_date = ?
        WHERE id = ?
      `
      ).run(
        newAmountPaid,
        newRemainingBalance,
        newPaymentStatus,
        payment.paymentMethod,
        payment.paymentDate,
        membershipId
      )

      return {
        id: paymentId,
        newAmountPaid,
        newRemainingBalance,
        newPaymentStatus
      }
    }
  )

  ipcMain.handle('memberships:getPayments', async (_event, membershipId: string) => {
    const db = getDatabase()
    const rows = db
      .prepare(
        `
      SELECT *
      FROM membership_payments
      WHERE membership_id = ?
      ORDER BY payment_date DESC, created_at DESC
    `
      )
      .all(membershipId) as MembershipPaymentDbRow[]

    return rows.map((r) => ({
      id: r.id,
      membershipId: r.membership_id,
      amount: r.amount,
      paymentMethod: r.payment_method,
      paymentDate: r.payment_date,
      paymentStatus: r.payment_status,
      notes: r.notes,
      createdAt: r.created_at
    }))
  })

  // Mark scheduled payment as completed
  ipcMain.handle(
    'memberships:completeScheduledPayment',
    async (_event, paymentId: string, membershipId: string) => {
      const db = getDatabase()

      // Update the payment status to completed
      db.prepare(
        `
      UPDATE membership_payments
      SET payment_status = 'completed'
      WHERE id = ?
    `
      ).run(paymentId)

      // Get the payment amount
      const payment = db
        .prepare('SELECT amount FROM membership_payments WHERE id = ?')
        .get(paymentId) as { amount: number }

      // Get current membership data
      const membership = db
        .prepare('SELECT total_price, amount_paid, remaining_balance FROM memberships WHERE id = ?')
        .get(membershipId) as
        | { total_price: number; amount_paid: number; remaining_balance: number }
        | undefined

      if (!membership) throw new Error('MEMBERSHIP_NOT_FOUND')

      // Calculate new amounts
      const newAmountPaid = membership.amount_paid + payment.amount
      const newRemainingBalance = membership.total_price - newAmountPaid
      const newPaymentStatus =
        newAmountPaid >= membership.total_price ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid'

      // Update membership
      db.prepare(
        `
      UPDATE memberships
      SET
        amount_paid = ?,
        remaining_balance = ?,
        payment_status = ?
      WHERE id = ?
    `
      ).run(newAmountPaid, newRemainingBalance, newPaymentStatus, membershipId)

      return {
        newAmountPaid,
        newRemainingBalance,
        newPaymentStatus
      }
    }
  )
}
