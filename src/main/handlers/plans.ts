import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { toSnake, toCamel } from './utils'
import type { Plan, PlanFilter } from '../../renderer/src/models/plan'

export function registerPlanHandlers() {
  ipcMain.handle('plans:get', async (_event, page: number = 1, filter: PlanFilter = 'all') => {
    const db = getDatabase()
    const limit = 3
    const offset = (page - 1) * limit

    const durationFilter: Record<string, string> = {
      daily: 'duration_days = 1',
      weekly: 'duration_days = 7',
      monthly: 'duration_days BETWEEN 28 AND 31',
      annually: 'duration_days >= 365'
    }

    const whereClause = filter !== 'all' ? `WHERE ${durationFilter[filter]}` : ''

    const query = `
        SELECT *
        FROM membership_plans
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `
    const rows = db.prepare(query).all(limit, offset) as Plan[]

    const totalQuery = `
        SELECT COUNT(*) as total
        FROM membership_plans
        ${whereClause}
      `
    const total = (db.prepare(totalQuery).get() as { total: number }).total

    return {
      plans: rows.map(toCamel) as Plan[],
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  })

  ipcMain.handle('plans:getById', async (_event, id: number) => {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM membership_plans WHERE id = ?').get(id) as
      | Plan
      | undefined
    return row ? (toCamel(row) as Plan) : null
  })

  ipcMain.handle('plans:create', async (_event, plan: Plan) => {
    const db = getDatabase()
    const snake = toSnake(plan)

    const stmt = db.prepare(`
      INSERT INTO membership_plans (name, description, price, duration_days)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(snake.name, snake.description || null, snake.price, snake.duration_days)
    return { id: Number(result.lastInsertRowid), ...plan }
  })

  ipcMain.handle('plans:update', async (_event, id: number, plan: Plan) => {
    const db = getDatabase()
    const snake = toSnake(plan)
    const stmt = db.prepare(`
      UPDATE membership_plans
      SET name = ?, description = ?, price = ?, duration_days = ?
      WHERE id = ?
    `)
    stmt.run(snake.name, snake.description || null, snake.price, snake.duration_days, id)
    return { id, ...plan }
  })

  ipcMain.handle('plans:delete', async (_event, id: number) => {
    const db = getDatabase()
    db.prepare('DELETE FROM membership_plans WHERE id = ?').run(id)
    return { success: true }
  })
}
