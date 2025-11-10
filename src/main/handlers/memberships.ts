import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { toSnake, toCamel } from './utils'
import type {
  Membership,
  MembershipDbRow,
  MembershipFilters
} from '../../renderer/src/models/membership'
import crypto from 'crypto'
import { PlanDbRow } from '@renderer/models/plan'

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
        whereConditions.push('(m.name LIKE ? OR m.phone LIKE ?)')
        params.push(search, search)
      }

      if (filters.memberId) {
        whereConditions.push('ms.member_id = ?')
        params.push(filters.memberId)
      }

      if (filters.paymentMethod !== 'all') {
        whereConditions.push('ms.payment_method = ?')
        params.push(filters.paymentMethod)
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

      const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : ''

      const query = `
      SELECT 
        ms.*,
        m.name AS member_name,
        m.phone AS member_phone,
        mp.name AS plan_name,
        mp.price AS plan_price
      FROM memberships ms
      INNER JOIN members m ON ms.member_id = m.id
      INNER JOIN membership_plans mp ON ms.plan_id = mp.id
      ${whereClause}
      ORDER BY ms.created_at DESC
      LIMIT ? OFFSET ?
    `

      const rows = db.prepare(query).all(...params, limit, offset) as MembershipDbRow[]

      const today = new Date().toISOString().split('T')[0]
      const processedMemberships = rows.map((row) => {
        const membership = toCamel(row) as Membership
        membership.id = row.id
        membership.memberId = row.member_id
        membership.planId = row.plan_id
        membership.startDate = row.start_date
        membership.endDate = row.end_date
        membership.amountPaid = row.amount_paid
        membership.paymentMethod = row.payment_method
        membership.paymentDate = row.payment_date
        membership.memberName = row.member_name
        membership.memberPhone = row.member_phone
        membership.planName = row.plan_name
        membership.planPrice = row.plan_price
        return membership
      })

      const filtered =
        filters.status === 'all'
          ? processedMemberships
          : processedMemberships.filter((ms) => {
              const isActive = ms.endDate >= today
              return filters.status === 'active' ? isActive : !isActive
            })

      const countQuery = `
      SELECT COUNT(*) as total 
      FROM memberships ms
      INNER JOIN members m ON ms.member_id = m.id
      INNER JOIN membership_plans mp ON ms.plan_id = mp.id
      ${whereClause}
    `
      const totalResult = db.prepare(countQuery).get(...params) as { total: number }
      const total = filters.status === 'all' ? totalResult.total : filtered.length

      return {
        memberships: filtered,
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
        mp.price AS plan_price
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
    membership.amountPaid = row.amount_paid
    membership.paymentMethod = row.payment_method
    membership.paymentDate = row.payment_date
    membership.memberName = row.member_name
    membership.memberPhone = row.member_phone
    membership.planName = row.plan_name
    membership.planPrice = row.plan_price

    return membership
  })

  ipcMain.handle('memberships:create', async (_event, membership: Membership) => {
    const db = getDatabase()
    const id = generateEncryptedId()
    const snake = toSnake(membership)

    const stmt = db.prepare(`
      INSERT INTO memberships (
        id, member_id, plan_id, start_date, end_date, 
        amount_paid, payment_method, payment_date, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      snake.member_id,
      snake.plan_id,
      snake.start_date,
      snake.end_date,
      snake.amount_paid,
      snake.payment_method,
      snake.payment_date,
      snake.notes || null
    )

    return { id, ...membership }
  })

  ipcMain.handle('memberships:update', async (_event, id: string, membership: Membership) => {
    const db = getDatabase()
    const snake = toSnake(membership)

    const stmt = db.prepare(`
      UPDATE memberships
      SET 
        member_id = ?, 
        plan_id = ?, 
        start_date = ?, 
        end_date = ?, 
        amount_paid = ?, 
        payment_method = ?, 
        payment_date = ?, 
        notes = ?
      WHERE id = ?
    `)

    stmt.run(
      snake.member_id,
      snake.plan_id,
      snake.start_date,
      snake.end_date,
      snake.amount_paid,
      snake.payment_method,
      snake.payment_date,
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
    const rows = db.prepare('SELECT id, name, phone FROM members ORDER BY name').all()
    return rows
  })

  ipcMain.handle('memberships:getPlans', async () => {
    const db = getDatabase()
    const rows = db
      .prepare('SELECT id, name, price, duration_days FROM membership_plans ORDER BY name')
      .all() as PlanDbRow[]
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      price: r.price,
      durationDays: r.duration_days
    }))
  })
}
