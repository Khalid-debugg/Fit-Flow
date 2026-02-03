import { BrowserWindow } from 'electron'

export interface NotificationResult {
  memberName: string
  phoneNumber: string
  status: 'sent' | 'failed' | 'skipped'
  reason?: string
  daysLeft: number
}

export interface NotificationPayload {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  translationKey?: string
  translationParams?: Record<string, string | number>
  // For WhatsApp notifications with "Show Details" button
  whatsappResults?: {
    results: NotificationResult[]
    sentCount: number
    failedCount: number
    skippedCount: number
  }
}

/**
 * Send a toast notification from the main process to the renderer process
 * @param notification The notification payload to send
 */
export function sendNotificationToRenderer(notification: NotificationPayload): void {
  try {
    const allWindows = BrowserWindow.getAllWindows()

    if (allWindows.length === 0) {
      console.warn('[NotificationBridge] No windows available to send notification')
      return
    }

    const mainWindow = allWindows[0]

    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('show-notification', notification)
    } else {
      console.warn('[NotificationBridge] Main window is destroyed, cannot send notification')
    }
  } catch (error) {
    console.error('[NotificationBridge] Failed to send notification:', error)
  }
}
