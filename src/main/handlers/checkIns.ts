import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { toCamel } from './utils'
import type {
  CheckIn,
  CheckInDbRow,
  CheckInFilters,
  CheckInStats
} from '../../renderer/src/models/checkIn'
import crypto from 'crypto'

function generateEncryptedId() {
  return crypto.randomBytes(8).toString('hex')
}

export function registerCheckInHandlers() {
  ipcMain.handle('checkIns:get', async (_event, page: number = 1, filters: CheckInFilters) => {
    const db = getDatabase()
    const limit = 10
    const offset = (page - 1) * limit

    const whereConditions: string[] = []
    const params: (string | number)[] = []

    if (filters.query?.trim()) {
      const search = `%${filters.query.trim()}%`
      whereConditions.push('(m.name LIKE ? OR m.phone LIKE ?)')
      params.push(search, search)
    }

    if (filters.dateFrom) {
      whereConditions.push('DATE(ci.check_in_time) >= ?')
      params.push(filters.dateFrom)
    }

    if (filters.dateTo) {
      whereConditions.push('DATE(ci.check_in_time) <= ?')
      params.push(filters.dateTo)
    }

    // Filter by membership status using a subquery to get the latest membership
    const today = new Date().toISOString().split('T')[0]

    // Build the status filter for the WHERE clause
    if (filters.status === 'active') {
      whereConditions.push('latest_ms.end_date >= ?')
      params.push(today)
    } else if (filters.status === 'expired') {
      whereConditions.push('latest_ms.end_date < ?')
      params.push(today)
    } else if (filters.status === 'none') {
      whereConditions.push('latest_ms.end_date IS NULL')
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Join with the most recent membership per member (not just active ones)
    const membershipJoin = `
      LEFT JOIN (
        SELECT member_id, MAX(end_date) as end_date
        FROM memberships
        GROUP BY member_id
      ) latest_ms ON m.id = latest_ms.member_id`

    // Get total count first (before applying limit/offset)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM check_ins ci
      INNER JOIN members m ON ci.member_id = m.id
      ${membershipJoin}
      ${whereClause}
    `
    const totalResult = db.prepare(countQuery).get(...params) as { total: number }
    const total = totalResult.total

    const query = `
      SELECT
        ci.id,
        ci.member_id,
        ci.check_in_time,
        ci.created_at,
        m.name AS member_name,
        m.country_code AS member_country_code,
        m.phone AS member_phone,
        latest_ms.end_date AS membership_end_date
      FROM check_ins ci
      INNER JOIN members m ON ci.member_id = m.id
      ${membershipJoin}
      ${whereClause}
      ORDER BY ci.check_in_time DESC
      LIMIT ? OFFSET ?
    `

    const rows = db.prepare(query).all(...params, limit, offset) as CheckInDbRow[]

    const processedCheckIns = rows.map((row) => {
      const checkIn = toCamel(row) as CheckIn
      checkIn.id = row.id
      checkIn.memberId = row.member_id
      checkIn.checkInTime = row.check_in_time
      checkIn.memberName = row.member_name
      checkIn.memberPhone = row.member_phone
      checkIn.membershipEndDate = row.membership_end_date || null

      if (row.membership_end_date && row.membership_end_date >= today) {
        checkIn.membershipStatus = 'active'
      } else if (row.membership_end_date && row.membership_end_date < today) {
        checkIn.membershipStatus = 'expired'
      } else {
        checkIn.membershipStatus = 'none'
      }

      return checkIn
    })

    return {
      checkIns: processedCheckIns,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  })

  ipcMain.handle('checkIns:create', async (_event, memberId: string) => {
    const db = getDatabase()
    const id = generateEncryptedId()
    const checkInTime = new Date().toISOString()
    const today = new Date().toISOString().split('T')[0]

    // Get member's active membership info including payment status and check-in limits
    const membership = db
      .prepare(
        `
      SELECT
        ms.id,
        ms.remaining_balance,
        ms.payment_status,
        ms.remaining_check_ins,
        ms.end_date,
        mp.plan_type,
        mp.check_in_limit
      FROM memberships ms
      INNER JOIN membership_plans mp ON ms.plan_id = mp.id
      WHERE ms.member_id = ? AND ms.end_date >= ?
      ORDER BY ms.end_date DESC
      LIMIT 1
    `
      )
      .get(memberId, today) as
      | {
          id: string
          remaining_balance: number
          payment_status: string
          remaining_check_ins: number | null
          end_date: string
          plan_type: string
          check_in_limit: number | null
        }
      | undefined

    const warnings: string[] = []

    // Check for payment warnings
    if (membership) {
      if (membership.payment_status === 'partial') {
        warnings.push(`PAYMENT_PARTIAL:${membership.remaining_balance}`)
      } else if (membership.payment_status === 'unpaid') {
        warnings.push('PAYMENT_UNPAID')
      }

      // Check for check-in based membership limits
      if (membership.plan_type === 'checkin' && membership.remaining_check_ins !== null) {
        if (membership.remaining_check_ins <= 0) {
          throw new Error('NO_CHECK_INS_REMAINING')
        }

        if (membership.remaining_check_ins <= 2) {
          warnings.push(`LOW_CHECK_INS:${membership.remaining_check_ins}`)
        }

        // Decrement remaining check-ins for check-in based plans
        db.prepare(
          `
          UPDATE memberships
          SET remaining_check_ins = remaining_check_ins - 1
          WHERE id = ?
        `
        ).run(membership.id)
      }
    }

    // Create the check-in
    const stmt = db.prepare(`
      INSERT INTO check_ins (id, member_id, check_in_time)
      VALUES (?, ?, ?)
    `)

    stmt.run(id, memberId, checkInTime)

    return {
      id,
      memberId,
      checkInTime,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  })

  ipcMain.handle('checkIns:checkToday', async (_event, memberId: string) => {
    const db = getDatabase()
    const today = new Date().toISOString().split('T')[0]

    const row = db
      .prepare(
        `
      SELECT id, member_id, check_in_time
      FROM check_ins
      WHERE member_id = ? AND DATE(check_in_time) = ?
    `
      )
      .get(memberId, today) as CheckInDbRow | undefined

    if (!row) return null

    return {
      id: row.id,
      memberId: row.member_id,
      checkInTime: row.check_in_time
    }
  })

  ipcMain.handle('checkIns:getStats', async () => {
    const db = getDatabase()
    const today = new Date().toISOString().split('T')[0]

    const now = new Date()
    const dayOfWeek = now.getDay()
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - diffToMonday)
    const weekStart = startOfWeek.toISOString().split('T')[0]

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const stats: CheckInStats = {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      activeMembers: 0
    }

    const todayResult = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM check_ins
      WHERE DATE(check_in_time) = ?
    `
      )
      .get(today) as { count: number }
    stats.today = todayResult.count

    const weekResult = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM check_ins
      WHERE DATE(check_in_time) >= ?
    `
      )
      .get(weekStart) as { count: number }
    stats.thisWeek = weekResult.count

    const monthResult = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM check_ins
      WHERE DATE(check_in_time) >= ?
    `
      )
      .get(startOfMonth) as { count: number }
    stats.thisMonth = monthResult.count

    const activeResult = db
      .prepare(
        `
      SELECT COUNT(DISTINCT member_id) as count
      FROM memberships
      WHERE end_date >= date('now')
    `
      )
      .get() as { count: number }
    stats.activeMembers = activeResult.count

    return stats
  })

  ipcMain.handle('checkIns:getByMemberId', async (_event, memberId: string) => {
    const db = getDatabase()

    const rows = db
      .prepare(
        `
      SELECT
        id,
        member_id,
        check_in_time,
        created_at
      FROM check_ins
      WHERE member_id = ?
      ORDER BY check_in_time DESC
      LIMIT 30
    `
      )
      .all(memberId) as CheckInDbRow[]

    return rows.map((row) => ({
      id: row.id,
      memberId: row.member_id,
      checkInTime: row.check_in_time,
      createdAt: row.created_at
    }))
  })

  ipcMain.handle('checkIns:delete', async (_event, id: string) => {
    const db = getDatabase()

    // Get the check-in details to restore remaining_check_ins if needed
    const checkIn = db
      .prepare(
        `
      SELECT member_id, check_in_time
      FROM check_ins
      WHERE id = ?
    `
      )
      .get(id) as { member_id: string; check_in_time: string } | undefined

    if (!checkIn) {
      throw new Error('CHECK_IN_NOT_FOUND')
    }

    const checkInDate = checkIn.check_in_time.split('T')[0]

    // Find the membership that was active at the time of check-in
    const membership = db
      .prepare(
        `
      SELECT
        ms.id,
        ms.remaining_check_ins,
        mp.plan_type
      FROM memberships ms
      INNER JOIN membership_plans mp ON ms.plan_id = mp.id
      WHERE ms.member_id = ?
        AND ms.start_date <= ?
        AND ms.end_date >= ?
      ORDER BY ms.end_date DESC
      LIMIT 1
    `
      )
      .get(checkIn.member_id, checkInDate, checkInDate) as
      | {
          id: string
          remaining_check_ins: number | null
          plan_type: string
        }
      | undefined

    // Restore check-in count if it was a check-in based membership
    if (membership && membership.plan_type === 'checkin' && membership.remaining_check_ins !== null) {
      db.prepare(
        `
        UPDATE memberships
        SET remaining_check_ins = remaining_check_ins + 1
        WHERE id = ?
      `
      ).run(membership.id)
    }

    // Delete the check-in
    db.prepare('DELETE FROM check_ins WHERE id = ?').run(id)

    return { success: true }
  })
}
