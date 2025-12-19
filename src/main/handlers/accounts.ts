import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import type {
  User,
  UserDbRow,
  UserFilters,
  UserPermissions
} from '../../renderer/src/models/account'
import crypto from 'crypto'

function generateEncryptedId() {
  return crypto.randomBytes(8).toString('hex')
}

// Simple password hashing using crypto (for demo purposes)
// In production, use bcrypt or argon2
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export function registerAccountHandlers() {
  // Get all users with filters
  ipcMain.handle('accounts:get', async (_event, page: number = 1, filters: UserFilters) => {
    const db = getDatabase()
    const limit = 10
    const offset = (page - 1) * limit

    const whereConditions: string[] = []
    const params: (string | number)[] = []

    if (filters.query?.trim()) {
      const search = `%${filters.query.trim()}%`
      whereConditions.push('(username LIKE ? OR full_name LIKE ? OR email LIKE ?)')
      params.push(search, search, search)
    }

    if (filters.role === 'admin') {
      whereConditions.push('is_admin = 1')
    } else if (filters.role === 'receptionist') {
      whereConditions.push('is_admin = 0')
    }

    if (filters.status === 'active') {
      whereConditions.push('is_active = 1')
    } else if (filters.status === 'inactive') {
      whereConditions.push('is_active = 0')
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`
    const totalResult = db.prepare(countQuery).get(...params) as { total: number }

    const query = `
      SELECT id, username, full_name, email, is_admin, is_active,
             permissions, last_login, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `

    const rows = db.prepare(query).all(...params, limit, offset) as Omit<
      UserDbRow,
      'password_hash'
    >[]

    const users = rows.map((row) => ({
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      email: row.email,
      isAdmin: Boolean(row.is_admin),
      isActive: Boolean(row.is_active),
      permissions: JSON.parse(row.permissions) as UserPermissions,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))

    return {
      users,
      total: totalResult.total,
      page,
      totalPages: Math.ceil(totalResult.total / limit)
    }
  })

  // Get user by ID
  ipcMain.handle('accounts:getById', async (_event, id: string) => {
    const db = getDatabase()
    const row = db
      .prepare(
        `
      SELECT id, username, full_name, email, is_admin, is_active,
             permissions, last_login, created_at, updated_at
      FROM users
      WHERE id = ?
    `
      )
      .get(id) as Omit<UserDbRow, 'password_hash'> | undefined

    if (!row) return null

    return {
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      email: row.email,
      isAdmin: Boolean(row.is_admin),
      isActive: Boolean(row.is_active),
      permissions: JSON.parse(row.permissions) as UserPermissions,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  })

  // Create user
  ipcMain.handle('accounts:create', async (_event, user: User & { password: string }) => {
    const db = getDatabase()

    // Check if username already exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(user.username)

    if (existing) {
      throw new Error('USERNAME_EXISTS')
    }

    const id = generateEncryptedId()
    const passwordHash = hashPassword(user.password)
    const permissionsJson = JSON.stringify(user.permissions)

    const stmt = db.prepare(`
        INSERT INTO users (
          id, username, password_hash, full_name, email,
          is_admin, is_active, permissions
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

    stmt.run(
      id,
      user.username,
      passwordHash,
      user.fullName,
      user.email || null,
      user.isAdmin ? 1 : 0,
      user.isActive ? 1 : 0,
      permissionsJson
    )

    return {
      id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      permissions: user.permissions
    }
  })

  // Update user
  ipcMain.handle(
    'accounts:update',
    async (_event, id: string, user: Partial<User> & { password?: string }) => {
      const db = getDatabase()

      // Check if username is being changed and if it already exists
      if (user.username) {
        const existing = db
          .prepare('SELECT id FROM users WHERE username = ? AND id != ?')
          .get(user.username, id)

        if (existing) {
          throw new Error('USERNAME_EXISTS')
        }
      }

      const updates: string[] = []
      const params: unknown[] = []

      if (user.username !== undefined) {
        updates.push('username = ?')
        params.push(user.username)
      }

      if (user.fullName !== undefined) {
        updates.push('full_name = ?')
        params.push(user.fullName)
      }

      if (user.email !== undefined) {
        updates.push('email = ?')
        params.push(user.email || null)
      }

      if (user.isAdmin !== undefined) {
        updates.push('is_admin = ?')
        params.push(user.isAdmin ? 1 : 0)
      }

      if (user.isActive !== undefined) {
        updates.push('is_active = ?')
        params.push(user.isActive ? 1 : 0)
      }

      if (user.permissions !== undefined) {
        updates.push('permissions = ?')
        params.push(JSON.stringify(user.permissions))
      }

      // Handle password update
      if (user.password !== undefined && user.password !== '') {
        updates.push('password_hash = ?')
        params.push(hashPassword(user.password))
      }

      if (updates.length === 0) {
        return { success: true }
      }

      params.push(id)

      const stmt = db.prepare(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ?
    `)

      stmt.run(...params)

      return { success: true, id }
    }
  )

  // Delete user
  ipcMain.handle('accounts:delete', async (_event, id: string) => {
    const db = getDatabase()

    // Prevent deleting the last admin
    const adminCount = db
      .prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1')
      .get() as { count: number }

    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(id) as
      | { is_admin: number }
      | undefined

    if (user?.is_admin && adminCount.count <= 1) {
      throw new Error('CANNOT_DELETE_LAST_ADMIN')
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id)
    return { success: true }
  })

  // Change password
  ipcMain.handle(
    'accounts:changePassword',
    async (_event, id: string, currentPassword: string, newPassword: string) => {
      const db = getDatabase()

      const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(id) as
        | { password_hash: string }
        | undefined

      if (!user) {
        throw new Error('USER_NOT_FOUND')
      }

      if (!verifyPassword(currentPassword, user.password_hash)) {
        throw new Error('INVALID_PASSWORD')
      }

      const newHash = hashPassword(newPassword)
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, id)

      return { success: true }
    }
  )

  // Reset password (admin only)
  ipcMain.handle('accounts:resetPassword', async (_event, id: string, newPassword: string) => {
    const db = getDatabase()

    const newHash = hashPassword(newPassword)
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, id)

    return { success: true }
  })

  // Login / Authenticate
  ipcMain.handle('accounts:login', async (_event, username: string, password: string) => {
    const db = getDatabase()

    const user = db
      .prepare(
        `
      SELECT id, username, password_hash, full_name, email,
             is_admin, is_active, permissions
      FROM users
      WHERE username = ?
    `
      )
      .get(username) as UserDbRow | undefined

    if (!user) {
      throw new Error('INVALID_CREDENTIALS')
    }

    if (!user.is_active) {
      throw new Error('ACCOUNT_INACTIVE')
    }

    if (!verifyPassword(password, user.password_hash)) {
      throw new Error('INVALID_CREDENTIALS')
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(
      new Date().toISOString(),
      user.id
    )

    return {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      isAdmin: Boolean(user.is_admin),
      isActive: Boolean(user.is_active),
      permissions: JSON.parse(user.permissions) as UserPermissions
    }
  })

  // Check if user has permission
  ipcMain.handle('accounts:hasPermission', async (_event, userId: string, permission: string) => {
    const db = getDatabase()

    const user = db.prepare('SELECT is_admin, permissions FROM users WHERE id = ?').get(userId) as
      | { is_admin: number; permissions: string }
      | undefined

    if (!user) {
      return false
    }

    // Admins have all permissions
    if (user.is_admin) {
      return true
    }

    const permissions = JSON.parse(user.permissions) as UserPermissions
    return permissions[permission] === true
  })
}
