import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { SettingsDbRow } from '@renderer/models/settings'
import { randomUUID } from 'crypto'

let whatsappSchedulerInterval: NodeJS.Timeout | null = null

interface WhatsAppNotificationLog {
  membershipId: string
  memberId: string
  phoneNumber: string
  message: string
  daysBeforeExpiry: number
  expiryDate: string
  status: 'sent' | 'failed'
  errorMessage?: string
}

async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  token: string,
  instanceId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const formattedPhone = phoneNumber.replace(/[\+@]/g, '')
    const apiUrl = `https://wawp.net/wp-json/awp/v1/send?instance_id=${encodeURIComponent(instanceId)}&access_token=${encodeURIComponent(token)}&chatId=${encodeURIComponent(formattedPhone)}&message=${encodeURIComponent(message)}`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    // Wawp API returns object with _data or id field on success
    if (response.ok && (data._data || data.id)) {
      return {
        success: true,
        message: 'Message sent successfully'
      }
    } else {
      return {
        success: false,
        message: data.message || data.data?.details?.[0] || 'Failed to send message'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

function logNotification(notificationData: WhatsAppNotificationLog): void {
  const db = getDatabase()

  db.prepare(
    `INSERT INTO whatsapp_notifications (id, membership_id, member_id, phone_number, message, sent_date, days_before_expiry, expiry_date, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    notificationData.membershipId,
    notificationData.memberId,
    notificationData.phoneNumber,
    notificationData.message,
    new Date().toISOString(),
    notificationData.daysBeforeExpiry,
    notificationData.expiryDate,
    notificationData.status,
    notificationData.errorMessage || null
  )
}

// Spam protection: checks if ANY notification was sent in the last 24 hours
function wasNotificationSent(membershipId: string): boolean {
  const db = getDatabase()

  const result = db
    .prepare(
      `SELECT COUNT(*) as count FROM whatsapp_notifications
       WHERE membership_id = ?
       AND status = 'sent'
       AND datetime(sent_date) >= datetime('now', '-24 hours')`
    )
    .get(membershipId) as { count: number }

  return result.count > 0
}

interface ExpiringMembership {
  membershipId: string
  memberId: string
  memberName: string
  phoneNumber: string
  countryCode: string
  endDate: string
  daysLeft: number
}

function getExpiringMemberships(daysBeforeExpiry: number): ExpiringMembership[] {
  const db = getDatabase()

  const query = `
    SELECT
      m.id as membershipId,
      mem.id as memberId,
      mem.name as memberName,
      mem.phone as phoneNumber,
      mem.country_code as countryCode,
      m.end_date as endDate,
      CAST((julianday(m.end_date) - julianday('now')) AS INTEGER) as daysLeft
    FROM memberships m
    INNER JOIN members mem ON m.member_id = mem.id
    WHERE
      m.payment_status = 'paid' AND
      julianday(m.end_date) - julianday('now') <= ? AND
      julianday(m.end_date) - julianday('now') >= 0
  `

  const results = db.prepare(query).all(daysBeforeExpiry) as ExpiringMembership[]
  return results
}

function replaceTemplateVariables(
  template: string,
  data: {
    name: string
    gymName: string
    daysLeft: number
    endDate: string
  }
): string {
  return template
    .replace(/{name}/g, data.name)
    .replace(/{gym_name}/g, data.gymName)
    .replace(/{days_left}/g, data.daysLeft.toString())
    .replace(/{end_date}/g, data.endDate)
}

function shouldRunDailyCheck(): boolean {
  const db = getDatabase()
  const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as
    | SettingsDbRow
    | undefined

  if (!settings || !settings.whatsapp_enabled || !settings.whatsapp_auto_send) {
    return false
  }

  if (!settings.whatsapp_last_check_date) {
    return true
  }

  const lastCheck = new Date(settings.whatsapp_last_check_date)
  const now = new Date()
  const hoursDiff = (now.getTime() - lastCheck.getTime()) / (1000 * 3600)

  return hoursDiff >= 24
}

async function performAutoWhatsAppCheck(): Promise<void> {
  try {
    if (!shouldRunDailyCheck()) {
      return
    }

    console.log('Running automatic WhatsApp notification check...')

    const db = getDatabase()
    const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as
      | SettingsDbRow
      | undefined

    if (!settings) {
      return
    }

    const token = process.env.WHATSAPP_API_TOKEN
    const instanceId = process.env.WHATSAPP_INSTANCE_ID

    if (!token || !instanceId) {
      console.error('WhatsApp credentials not configured')
      return
    }

    const expiringMemberships = getExpiringMemberships(settings.whatsapp_days_before_expiry)

    let sentCount = 0
    let failedCount = 0

    for (const membership of expiringMemberships) {
      if (wasNotificationSent(membership.membershipId)) {
        continue
      }

      const message = replaceTemplateVariables(settings.whatsapp_message_template, {
        name: membership.memberName,
        gymName: settings.gym_name,
        daysLeft: membership.daysLeft,
        endDate: membership.endDate
      })

      const fullPhoneNumber = membership.countryCode + membership.phoneNumber
      const result = await sendWhatsAppMessage(fullPhoneNumber, message, token, instanceId)

      logNotification({
        membershipId: membership.membershipId,
        memberId: membership.memberId,
        phoneNumber: fullPhoneNumber,
        message: message,
        daysBeforeExpiry: membership.daysLeft,
        expiryDate: membership.endDate,
        status: result.success ? 'sent' : 'failed',
        errorMessage: result.success ? undefined : result.message
      })

      if (result.success) {
        sentCount++
      } else {
        failedCount++
      }

      // Rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    db.prepare('UPDATE settings SET whatsapp_last_check_date = ? WHERE id = ?').run(
      new Date().toISOString(),
      '1'
    )

    console.log(
      `WhatsApp auto-check completed: ${sentCount} sent, ${failedCount} failed, ${expiringMemberships.length} total`
    )
  } catch (error) {
    console.error('Auto WhatsApp check failed:', error)
  }
}

export { performAutoWhatsAppCheck }

function startWhatsAppScheduler(): void {
  if (whatsappSchedulerInterval) {
    clearInterval(whatsappSchedulerInterval)
  }

  performAutoWhatsAppCheck()

  // Runs every hour, sends only if 24 hours passed since last check
  whatsappSchedulerInterval = setInterval(() => {
    performAutoWhatsAppCheck()
  }, 60 * 60 * 1000)

  console.log('WhatsApp notification scheduler started')
}

export function stopWhatsAppScheduler(): void {
  if (whatsappSchedulerInterval) {
    clearInterval(whatsappSchedulerInterval)
    whatsappSchedulerInterval = null
    console.log('WhatsApp notification scheduler stopped')
  }
}

export function registerWhatsAppHandlers() {
  startWhatsAppScheduler()

  ipcMain.handle('whatsapp:checkAndSendNotifications', async () => {
    try {
      const db = getDatabase()
      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as
        | SettingsDbRow
        | undefined

      if (!settings || !settings.whatsapp_enabled) {
        return {
          success: false,
          error: 'WhatsApp notifications are not enabled'
        }
      }

      const token = process.env.WHATSAPP_API_TOKEN
      const instanceId = process.env.WHATSAPP_INSTANCE_ID

      if (!token || !instanceId) {
        return {
          success: false,
          error: 'Please configure your WhatsApp credentials'
        }
      }

      const expiringMemberships = getExpiringMemberships(settings.whatsapp_days_before_expiry)

      let sentCount = 0
      let skippedCount = 0
      let failedCount = 0

      for (const membership of expiringMemberships) {
        if (wasNotificationSent(membership.membershipId)) {
          skippedCount++
          continue
        }

        const message = replaceTemplateVariables(settings.whatsapp_message_template, {
          name: membership.memberName,
          gymName: settings.gym_name,
          daysLeft: membership.daysLeft,
          endDate: membership.endDate
        })

        const fullPhoneNumber = membership.countryCode + membership.phoneNumber
        const result = await sendWhatsAppMessage(fullPhoneNumber, message, token, instanceId)

        logNotification({
          membershipId: membership.membershipId,
          memberId: membership.memberId,
          phoneNumber: fullPhoneNumber,
          message: message,
          daysBeforeExpiry: membership.daysLeft,
          expiryDate: membership.endDate,
          status: result.success ? 'sent' : 'failed',
          errorMessage: result.success ? undefined : result.message
        })

        if (result.success) {
          sentCount++
        } else {
          failedCount++
        }

        // Rate limiting delay
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      db.prepare('UPDATE settings SET whatsapp_last_check_date = ? WHERE id = ?').run(
        new Date().toISOString(),
        '1'
      )

      return {
        success: true,
        sentCount,
        skippedCount,
        failedCount,
        totalChecked: expiringMemberships.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  ipcMain.handle('whatsapp:getNotificationHistory', async (_event, limit: number = 50) => {
    try {
      const db = getDatabase()

      const notifications = db
        .prepare(
          `SELECT
            wn.*,
            mem.name as member_name
          FROM whatsapp_notifications wn
          INNER JOIN members mem ON wn.member_id = mem.id
          ORDER BY wn.sent_date DESC
          LIMIT ?`
        )
        .all(limit)

      return {
        success: true,
        notifications
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}
