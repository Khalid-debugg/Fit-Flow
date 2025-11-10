import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import type { MemberDbRow, MemberFilters } from '../../renderer/src/models/member'
import { toSnake } from './utils'
import crypto from 'crypto'

function generateEncryptedId() {
  return crypto.randomBytes(8).toString('hex')
}

export function registerMemberHandlers() {
  ipcMain.handle('members:get', async (_event, page: number = 1, filters: MemberFilters) => {
    const db = getDatabase()
    const limit = 10
    const offset = (page - 1) * limit

    const whereConditions: string[] = []
    const params: (string | number)[] = []

    if (filters.query?.trim()) {
      const search = `%${filters.query.trim()}%`
      whereConditions.push(
        '(m.name LIKE ? OR m.email LIKE ? OR m.phone LIKE ? OR m.address LIKE ?)'
      )
      params.push(search, search, search, search)
    }

    if (filters.gender !== 'all') {
      whereConditions.push('m.gender = ?')
      params.push(filters.gender)
    }

    if (filters.dateFrom) {
      whereConditions.push('m.join_date >= ?')
      params.push(filters.dateFrom)
    }

    if (filters.dateTo) {
      whereConditions.push('m.join_date <= ?')
      params.push(filters.dateTo)
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const query = `
      SELECT 
        m.*,
        ms.id AS membership_id,
        mp.name AS plan_name,
        mp.price AS plan_price,
        ms.start_date,
        ms.end_date,
        (
          SELECT COUNT(*) FROM memberships WHERE member_id = m.id
        ) AS membership_count
      FROM members m
      LEFT JOIN memberships ms ON m.id = ms.member_id 
        AND ms.end_date >= date('now')
      LEFT JOIN membership_plans mp ON ms.plan_id = mp.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `

    const rows = db.prepare(query).all(...params, limit, offset) as MemberDbRow[]

    const processedMembers = rows.map((row) => {
      let status: 'active' | 'inactive' | 'expired' = 'inactive'
      const today = new Date().toISOString().split('T')[0]

      if (row.membership_id && row.end_date && row.end_date >= today) {
        status = 'active'
      } else if (row.membership_count > 0) {
        status = 'expired'
      }

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        gender: row.gender,
        address: row.address,
        joinDate: row.join_date,
        notes: row.notes,
        createdAt: row.created_at,
        status,
        currentMembership: row.membership_id
          ? {
              id: row.membership_id,
              planName: row.plan_name!,
              planPrice: row.plan_price!,
              startDate: row.start_date!,
              endDate: row.end_date!
            }
          : undefined
      }
    })

    const filtered =
      filters.status === 'all'
        ? processedMembers
        : processedMembers.filter((m) => m.status === filters.status)

    const countQuery = `SELECT COUNT(*) as total FROM members m ${whereClause}`
    const totalResult = db.prepare(countQuery).get(...params) as { total: number }

    const total = filters.status === 'all' ? totalResult.total : filtered.length

    return {
      members: filtered,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  })

  ipcMain.handle('members:getById', async (_event, id: string) => {
    const db = getDatabase()
    const row = db
      .prepare(
        `
        SELECT 
          m.*,
          ms.id AS membership_id,
          mp.name AS plan_name,
          mp.price AS plan_price,
          ms.start_date,
          ms.end_date,
          (
            SELECT COUNT(*) FROM memberships WHERE member_id = m.id
          ) AS membership_count
        FROM members m
        LEFT JOIN memberships ms ON m.id = ms.member_id 
          AND ms.end_date >= date('now')
        LEFT JOIN membership_plans mp ON ms.plan_id = mp.id
        WHERE m.id = ?
        `
      )
      .get(id) as MemberDbRow | undefined

    if (!row) return null

    let status: 'active' | 'inactive' | 'expired' = 'inactive'
    const today = new Date().toISOString().split('T')[0]
    if (row.membership_id && row.end_date && row.end_date >= today) {
      status = 'active'
    } else if (row.membership_count > 0) {
      status = 'expired'
    }

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      gender: row.gender,
      address: row.address,
      joinDate: row.join_date,
      notes: row.notes,
      createdAt: row.created_at,
      status,
      currentMembership: row.membership_id
        ? {
            id: row.membership_id,
            planName: row.plan_name!,
            planPrice: row.plan_price!,
            startDate: row.start_date!,
            endDate: row.end_date!
          }
        : undefined
    }
  })

  ipcMain.handle('members:create', async (_event, member) => {
    const db = getDatabase()
    const id = generateEncryptedId()
    const snake = toSnake(member)

    const stmt = db.prepare(`
      INSERT INTO members (id, name, email, phone, gender, address, join_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      snake.name,
      snake.email || null,
      snake.phone,
      snake.gender,
      snake.address || null,
      snake.join_date,
      snake.notes || null
    )

    return { id, ...member }
  })

  ipcMain.handle('members:update', async (_event, id: string, member) => {
    const db = getDatabase()
    const snake = toSnake(member)
    const stmt = db.prepare(`
      UPDATE members
      SET name = ?, email = ?, phone = ?, gender = ?, address = ?, notes = ?
      WHERE id = ?
    `)
    stmt.run(
      snake.name,
      snake.email || null,
      snake.phone,
      snake.gender,
      snake.address || null,
      snake.notes || null,
      id
    )

    return { id, ...member }
  })

  ipcMain.handle('members:delete', async (_event, id: string) => {
    const db = getDatabase()
    db.prepare('DELETE FROM members WHERE id = ?').run(id)
    return { success: true }
  })
}
