import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { Member, MemberFilters } from '@renderer/models/member'

export function registerMemberHandlers() {
  ipcMain.handle('members:get', async (_event, page: number = 1, filters: MemberFilters) => {
    const db = getDatabase()
    const limit = 10
    const offset = (page - 1) * limit

    const whereConditions: string[] = []
    const params: (string | number)[] = []

    if (filters.query && filters.query.trim()) {
      whereConditions.push(
        '(m.name LIKE ? OR m.email LIKE ? OR m.phone LIKE ? OR m.address LIKE ?)'
      )
      const searchTerm = `%${filters.query.trim()}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }

    if (filters.gender && filters.gender !== 'all') {
      whereConditions.push('m.gender = ?')
      params.push(filters.gender)
    }

    if (filters.status && filters.status !== 'all') {
      whereConditions.push('m.status = ?')
      params.push(filters.status)
    }

    if (filters.dateFrom) {
      whereConditions.push('m.join_date >= ?')
      params.push(filters.dateFrom)
    }

    if (filters.dateTo) {
      whereConditions.push('m.join_date <= ?')
      params.push(filters.dateTo)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const members = db
      .prepare(
        `
      SELECT 
        m.*,
        ms.id as membership_id,
        mp.name as plan_name,
        mp.price as plan_price,
        ms.start_date,
        ms.end_date,
        ms.status as membership_status
      FROM members m
      LEFT JOIN memberships ms ON m.id = ms.member_id 
        AND ms.status = 'active'
        AND ms.end_date >= date('now')
      LEFT JOIN membership_plans mp ON ms.plan_id = mp.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `
      )
      .all(...params, limit, offset) as Member[]

    const countQuery = `SELECT COUNT(*) as total FROM members m ${whereClause}`
    const totalResult = db.prepare(countQuery).get(...params) as { total: number }

    return {
      members: members.map((member: Member) => ({
        ...member,
        current_membership: member.current_membership
          ? {
              id: member.current_membership.id,
              plan_name: member.current_membership.plan_name,
              plan_price: member.current_membership.plan_price,
              start_date: member.current_membership.start_date,
              end_date: member.current_membership.end_date,
              status: member.current_membership.status
            }
          : null,
        membership_id: undefined,
        plan_name: undefined,
        plan_price: undefined,
        start_date: undefined,
        end_date: undefined,
        membership_status: undefined
      })),
      total: totalResult.total,
      page,
      totalPages: Math.ceil(totalResult.total / limit)
    }
  })

  ipcMain.handle('members:getById', async (_event, id: number) => {
    const db = getDatabase()
    const member = db
      .prepare(
        `
      SELECT 
        m.*,
        ms.id as membership_id,
        mp.name as plan_name,
        mp.price as plan_price,
        ms.start_date,
        ms.end_date,
        ms.status as membership_status
      FROM members m
      LEFT JOIN memberships ms ON m.id = ms.member_id 
        AND ms.status = 'active'
        AND ms.end_date >= date('now')
      LEFT JOIN membership_plans mp ON ms.plan_id = mp.id
      WHERE m.id = ?
    `
      )
      .get(id) as Member

    if (!member) return null

    return {
      ...member,
      current_membership: member.current_membership
        ? {
            id: member.current_membership.id,
            plan_name: member.current_membership.plan_name,
            plan_price: member.current_membership.plan_price,
            start_date: member.current_membership.start_date,
            end_date: member.current_membership.end_date,
            status: member.current_membership.status
          }
        : null,
      membership_id: undefined,
      plan_name: undefined,
      plan_price: undefined,
      start_date: undefined,
      end_date: undefined,
      membership_status: undefined
    }
  })

  ipcMain.handle('members:create', async (_event, member) => {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO members (name, email, phone, gender, address, join_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      member.name,
      member.email || null,
      member.phone,
      member.gender,
      member.address || null,
      member.join_date,
      member.notes || null
    )
    return { id: result.lastInsertRowid, ...member }
  })

  ipcMain.handle('members:update', async (_event, id: number, member) => {
    const db = getDatabase()
    const stmt = db.prepare(`
      UPDATE members 
      SET name = ?, email = ?, phone = ?, gender = ?, address = ?, status = ?, notes = ?
      WHERE id = ?
    `)
    stmt.run(
      member.name,
      member.email || null,
      member.phone,
      member.gender,
      member.address || null,
      member.status,
      member.notes || null,
      id
    )
    return { id, ...member }
  })

  ipcMain.handle('members:delete', async (_event, id: number) => {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM members WHERE id = ?')
    stmt.run(id)
    return { success: true }
  })
}
