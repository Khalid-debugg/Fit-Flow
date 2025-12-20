import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { toSnake, toCamel } from './utils'
import type { Plan, PlanDbRow, PlanFilter } from '../../renderer/src/models/plan'
import crypto from 'crypto'

function generateEncryptedId() {
  return crypto.randomBytes(8).toString('hex') // 16-character unique hex string
}

export function registerPlanHandlers() {
  ipcMain.handle('plans:get', async (_event, page: number = 1, filter: PlanFilter = 'all') => {
    const db = getDatabase()
    const limit = 6
    const offset = (page - 1) * limit

    const durationFilter: Record<string, string> = {
      daily: 'duration_days >= 1 AND duration_days < 7',
      weekly: '(duration_days % 7 = 0 AND duration_days < 30)',
      monthly: '(duration_days BETWEEN 28 AND 31 OR duration_days % 30 = 0)',
      annually: '(duration_days % 365 = 0 OR duration_days >= 365)',
      custom:
        'NOT ((duration_days >= 1 AND duration_days < 7) OR (duration_days % 7 = 0 AND duration_days < 30) OR (duration_days BETWEEN 28 AND 31 OR duration_days % 30 = 0) OR (duration_days % 365 = 0 OR duration_days >= 365))',
      offer: 'is_offer = 1'
    }

    const whereClause = filter !== 'all' ? `WHERE ${durationFilter[filter]}` : ''

    const query = `
    SELECT *
    FROM membership_plans
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `
    const rows = db.prepare(query).all(limit, offset) as PlanDbRow[]

    const totalQuery = `
    SELECT COUNT(*) as total
    FROM membership_plans
    ${whereClause}
  `
    const total = (db.prepare(totalQuery).get() as { total: number }).total

    return {
      plans: rows.map((r) => {
        const plan = toCamel(r)
        plan.isOffer = Boolean(r.is_offer)
        plan.durationDays = r.duration_days ? Number(r.duration_days) : null
        plan.planType = r.plan_type
        plan.checkInLimit = r.check_in_limit
        return plan
      }),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  })

  ipcMain.handle('plans:getById', async (_event, id: string) => {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM membership_plans WHERE id = ?').get(id) as
      | Plan
      | undefined
    return row ? (toCamel(row) as Plan) : null
  })

  ipcMain.handle('plans:create', async (_event, plan: Plan) => {
    const db = getDatabase()
    const id = generateEncryptedId()
    const snake = toSnake(plan)

    const stmt = db.prepare(`
      INSERT INTO membership_plans (
        id, name, description, price, duration_days, is_offer,
        plan_type, check_in_limit
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      id,
      snake.name,
      snake.description || null,
      snake.price,
      snake.duration_days || null,
      snake.is_offer ? 1 : 0,
      snake.plan_type || 'duration',
      snake.check_in_limit || null
    )

    return { id, ...plan }
  })

  ipcMain.handle('plans:update', async (_event, id: string, plan: Plan) => {
    const db = getDatabase()
    const snake = toSnake(plan)

    const stmt = db.prepare(`
      UPDATE membership_plans
      SET name = ?, description = ?, price = ?, duration_days = ?, is_offer = ?,
          plan_type = ?, check_in_limit = ?
      WHERE id = ?
    `)
    stmt.run(
      snake.name,
      snake.description || null,
      snake.price,
      snake.duration_days || null,
      snake.is_offer ? 1 : 0,
      snake.plan_type || 'duration',
      snake.check_in_limit || null,
      id
    )
    return { id, ...plan }
  })

  ipcMain.handle('plans:delete', async (_event, id: string) => {
    const db = getDatabase()
    db.prepare('DELETE FROM membership_plans WHERE id = ?').run(id)
    return { success: true }
  })
}
