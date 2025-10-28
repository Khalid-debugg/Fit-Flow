import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerMemberHandlers() {
  ipcMain.handle('members:getAll', async () => {
    const db = getDatabase()
    const members = db.prepare('SELECT * FROM members ORDER BY created_at DESC').all()
    return members
  })

  ipcMain.handle('members:getById', async (_event, id: number) => {
    const db = getDatabase()
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id)
    return member
  })

  ipcMain.handle('members:create', async (_event, member) => {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO members (name, email, phone, date_of_birth, gender, address, 
                          emergency_contact, emergency_phone, join_date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      member.name,
      member.email,
      member.phone,
      member.date_of_birth,
      member.gender,
      member.address,
      member.emergency_contact,
      member.emergency_phone,
      member.join_date,
      member.status || 'active',
      member.notes
    )
    return { id: result.lastInsertRowid, ...member }
  })

  ipcMain.handle('members:update', async (_event, id: number, member) => {
    const db = getDatabase()
    const stmt = db.prepare(`
      UPDATE members 
      SET name = ?, email = ?, phone = ?, date_of_birth = ?, gender = ?, 
          address = ?, emergency_contact = ?, emergency_phone = ?, status = ?, notes = ?
      WHERE id = ?
    `)
    stmt.run(
      member.name,
      member.email,
      member.phone,
      member.date_of_birth,
      member.gender,
      member.address,
      member.emergency_contact,
      member.emergency_phone,
      member.status,
      member.notes,
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
