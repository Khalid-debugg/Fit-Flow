import { ipcMain, dialog } from 'electron'
import { getDatabase } from '../database'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export type ExportTable = 'members' | 'memberships' | 'checkins' | 'accounts' | 'plans'

// Convert database rows to CSV format with UTF-8 BOM for proper encoding
function convertToCSV(rows: any[], headers: string[]): string {
  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  const csvRows: string[] = []
  // Add header row
  csvRows.push(headers.map(escapeCsvValue).join(','))

  // Add data rows
  for (const row of rows) {
    const values = headers.map((header) => escapeCsvValue(row[header]))
    csvRows.push(values.join(','))
  }

  // Add UTF-8 BOM at the beginning for proper encoding of Arabic and other non-ASCII characters
  return '\uFEFF' + csvRows.join('\n')
}

// Export members table
function exportMembers(db: any): { data: string; filename: string } {
  const query = `
    SELECT
      m.id,
      m.name,
      m.email,
      (CASE
        WHEN m.country_code LIKE '+%' THEN m.country_code || m.phone
        ELSE '+' || m.country_code || m.phone
      END) as phone_number,
      m.gender,
      m.address,
      m.notes,
      m.join_date,
      m.created_at,
      CASE
        WHEN ms.end_date >= date('now') THEN 'Active'
        WHEN (SELECT COUNT(*) FROM memberships WHERE member_id = m.id) > 0 THEN 'Expired'
        ELSE 'Inactive'
      END as status
    FROM members m
    LEFT JOIN memberships ms ON m.id = ms.member_id
      AND ms.id = (
        SELECT id FROM memberships
        WHERE member_id = m.id
        ORDER BY end_date DESC
        LIMIT 1
      )
    ORDER BY m.created_at DESC
  `

  const rows = db.prepare(query).all()
  const headers = [
    'id',
    'name',
    'email',
    'phone_number',
    'gender',
    'address',
    'notes',
    'join_date',
    'created_at',
    'status'
  ]

  const csv = convertToCSV(rows, headers)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  return {
    data: csv,
    filename: `members_${timestamp}.csv`
  }
}

// Export memberships table
function exportMemberships(db: any): { data: string; filename: string } {
  const query = `
    SELECT
      ms.id,
      m.name as member_name,
      m.email as member_email,
      (CASE
        WHEN m.country_code LIKE '+%' THEN m.country_code || m.phone
        ELSE '+' || m.country_code || m.phone
      END) as member_phone,
      mp.name as plan_name,
      ms.start_date,
      ms.end_date,
      ms.total_price,
      ms.amount_paid,
      ms.remaining_balance,
      ms.payment_status,
      ms.payment_method,
      ms.payment_date,
      ms.remaining_check_ins,
      CASE
        WHEN ms.end_date >= date('now') THEN 'Active'
        ELSE 'Expired'
      END as status,
      ms.created_at
    FROM memberships ms
    INNER JOIN members m ON ms.member_id = m.id
    INNER JOIN membership_plans mp ON ms.plan_id = mp.id
    ORDER BY ms.created_at DESC
  `

  const rows = db.prepare(query).all()
  const headers = [
    'id',
    'member_name',
    'member_email',
    'member_phone',
    'plan_name',
    'start_date',
    'end_date',
    'total_price',
    'amount_paid',
    'remaining_balance',
    'payment_status',
    'payment_method',
    'payment_date',
    'remaining_check_ins',
    'status',
    'created_at'
  ]

  const csv = convertToCSV(rows, headers)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  return {
    data: csv,
    filename: `memberships_${timestamp}.csv`
  }
}

// Export check-ins table
function exportCheckIns(db: any): { data: string; filename: string } {
  const query = `
    SELECT
      c.id,
      m.name as member_name,
      m.email as member_email,
      (CASE
        WHEN m.country_code LIKE '+%' THEN m.country_code || m.phone
        ELSE '+' || m.country_code || m.phone
      END) as member_phone,
      c.check_in_time,
      c.created_at
    FROM check_ins c
    INNER JOIN members m ON c.member_id = m.id
    ORDER BY c.check_in_time DESC
  `

  const rows = db.prepare(query).all()
  const headers = [
    'id',
    'member_name',
    'member_email',
    'member_phone',
    'check_in_time',
    'created_at'
  ]

  const csv = convertToCSV(rows, headers)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  return {
    data: csv,
    filename: `checkins_${timestamp}.csv`
  }
}

// Export accounts table
function exportAccounts(db: any): { data: string; filename: string } {
  const query = `
    SELECT
      id,
      username,
      full_name,
      email,
      CASE WHEN is_admin = 1 THEN 'Yes' ELSE 'No' END as is_admin,
      CASE WHEN is_active = 1 THEN 'Active' ELSE 'Inactive' END as status,
      last_login,
      created_at,
      updated_at
    FROM users
    ORDER BY created_at DESC
  `

  const rows = db.prepare(query).all()
  const headers = [
    'id',
    'username',
    'full_name',
    'email',
    'is_admin',
    'status',
    'last_login',
    'created_at',
    'updated_at'
  ]

  const csv = convertToCSV(rows, headers)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  return {
    data: csv,
    filename: `user_accounts_${timestamp}.csv`
  }
}

// Export membership plans table
function exportPlans(db: any): { data: string; filename: string } {
  const query = `
    SELECT
      id,
      name,
      description,
      price,
      plan_type,
      duration_days,
      check_in_limit,
      CASE WHEN is_offer = 1 THEN 'Yes' ELSE 'No' END as is_offer,
      created_at
    FROM membership_plans
    ORDER BY created_at DESC
  `

  const rows = db.prepare(query).all()
  const headers = [
    'id',
    'name',
    'description',
    'price',
    'plan_type',
    'duration_days',
    'check_in_limit',
    'is_offer',
    'created_at'
  ]

  const csv = convertToCSV(rows, headers)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  return {
    data: csv,
    filename: `membership_plans_${timestamp}.csv`
  }
}

// Map of table names to export functions
const exportFunctions: Record<ExportTable, (db: any) => { data: string; filename: string }> = {
  members: exportMembers,
  memberships: exportMemberships,
  checkins: exportCheckIns,
  accounts: exportAccounts,
  plans: exportPlans
}

export function registerExportsHandlers() {
  // Export single table
  ipcMain.handle('exports:table', async (_event, tableName: ExportTable, savePath?: string) => {
    const db = getDatabase()

    try {
      const exportFunc = exportFunctions[tableName]
      if (!exportFunc) {
        throw new Error(`Unknown table: ${tableName}`)
      }

      const { data, filename } = exportFunc(db)

      // If no save path provided, show save dialog
      let finalPath = savePath
      if (!finalPath) {
        const result = await dialog.showSaveDialog({
          title: 'Export CSV',
          defaultPath: filename,
          filters: [{ name: 'CSV Files', extensions: ['csv'] }]
        })

        if (result.canceled || !result.filePath) {
          return { success: false, canceled: true }
        }

        finalPath = result.filePath
      }

      // Write file
      await writeFile(finalPath, data, 'utf-8')

      return {
        success: true,
        path: finalPath,
        filename
      }
    } catch (error) {
      console.error('Export error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Export multiple tables
  ipcMain.handle('exports:multiple', async (_event, tables: ExportTable[], basePath?: string) => {
    const db = getDatabase()

    try {
      let exportPath = basePath
      if (!exportPath) {
        const result = await dialog.showOpenDialog({
          title: 'Select Export Directory',
          properties: ['openDirectory', 'createDirectory']
        })

        if (result.canceled || result.filePaths.length === 0) {
          return { success: false, canceled: true }
        }

        exportPath = result.filePaths[0]
      }

      const results: Array<{ table: ExportTable; filename: string; path: string }> = []

      for (const tableName of tables) {
        const exportFunc = exportFunctions[tableName]
        if (!exportFunc) {
          console.warn(`Skipping unknown table: ${tableName}`)
          continue
        }

        const { data, filename } = exportFunc(db)
        const filePath = join(exportPath, filename)

        await writeFile(filePath, data, 'utf-8')

        results.push({
          table: tableName,
          filename,
          path: filePath
        })
      }

      return {
        success: true,
        files: results,
        directory: exportPath
      }
    } catch (error) {
      console.error('Multiple export error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}
