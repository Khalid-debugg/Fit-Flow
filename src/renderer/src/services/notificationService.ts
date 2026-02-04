import { toast } from 'sonner'
import i18n from '@renderer/locales/i18n'

interface NotificationResult {
  memberName: string
  phoneNumber: string
  status: 'sent' | 'failed' | 'skipped'
  reason?: string
  daysLeft: number
}

class NotificationService {
  private lastExecutionTimes: Map<string, number> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private isExecuting: Map<string, boolean> = new Map()

  /**
   * Check if an action can be executed based on rate limiting
   */
  canExecute(key: string, interval: number): boolean {
    const lastExecution = this.lastExecutionTimes.get(key)
    if (!lastExecution) return true

    const now = Date.now()
    const timeSinceLastExecution = now - lastExecution

    return timeSinceLastExecution >= interval
  }

  /**
   * Get the remaining time until an action can be executed again
   */
  getTimeUntilNextExecution(key: string, interval: number): number {
    const lastExecution = this.lastExecutionTimes.get(key)
    if (!lastExecution) return 0

    const now = Date.now()
    const timeSinceLastExecution = now - lastExecution
    const remainingTime = interval - timeSinceLastExecution

    return Math.max(0, remainingTime)
  }

  /**
   * Mark an action as executed
   */
  markExecuted(key: string): void {
    this.lastExecutionTimes.set(key, Date.now())
  }

  /**
   * Handle WhatsApp notification check with rate limiting (24 hours)
   */
  async handleWhatsAppCheck(
    isManual: boolean,
    onShowDetails?: (results: NotificationResult[], sentCount: number, failedCount: number, skippedCount: number) => void
  ): Promise<void> {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
    const rateLimitKey = 'whatsapp-check'

    // Prevent duplicate execution (for React StrictMode)
    if (this.isExecuting.get(rateLimitKey)) {
      return
    }

    // Check rate limit for manual triggers only
    if (isManual && !this.canExecute(rateLimitKey, TWENTY_FOUR_HOURS)) {
      const remainingTime = this.getTimeUntilNextExecution(rateLimitKey, TWENTY_FOUR_HOURS)
      const hoursLeft = Math.ceil(remainingTime / (60 * 60 * 1000))

      toast.warning(i18n.t('settings:whatsapp.toasts.alreadySent'), {
        description: i18n.t('settings:whatsapp.toasts.waitHours', { hours: hoursLeft })
      })
      return
    }

    this.isExecuting.set(rateLimitKey, true)

    try {
      const result = await window.electron.ipcRenderer.invoke('whatsapp:checkAndSendNotifications')

      if (result.success) {
        const { sentCount, skippedCount, failedCount, results } = result

        // Mark as executed only if we actually sent messages successfully
        if (sentCount > 0) {
          this.markExecuted(rateLimitKey)
        }

        // Always show toast with "Show Details" button if there are results
        if (results && results.length > 0 && onShowDetails) {
          toast.success(i18n.t('settings:whatsapp.toasts.checkComplete'), {
            action: {
              label: i18n.t('settings:whatsapp.toasts.showDetails'),
              onClick: () => onShowDetails(results, sentCount, failedCount, skippedCount)
            }
          })
        }
      } else {
        toast.error(i18n.t('settings:whatsapp.toasts.sendFailed'), {
          description: result.error || i18n.t('settings:whatsapp.toasts.connectionError')
        })
      }
    } catch (error) {
      console.error('WhatsApp check failed:', error)
      toast.error(i18n.t('settings:whatsapp.toasts.connectionError'), {
        description: i18n.t('settings:whatsapp.toasts.checkConnection')
      })
    } finally {
      this.isExecuting.set(rateLimitKey, false)
    }
  }

  /**
   * Handle cloud backup upload with rate limiting (24 hours)
   */
  async handleCloudBackupUpload(isManual: boolean): Promise<void> {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
    const rateLimitKey = 'cloud-backup-upload'

    // Prevent duplicate execution (for React StrictMode)
    if (this.isExecuting.get(rateLimitKey)) {
      return
    }

    // Check rate limit for manual triggers only
    if (isManual && !this.canExecute(rateLimitKey, TWENTY_FOUR_HOURS)) {
      const remainingTime = this.getTimeUntilNextExecution(rateLimitKey, TWENTY_FOUR_HOURS)
      const hoursLeft = Math.ceil(remainingTime / (60 * 60 * 1000))

      toast.warning(i18n.t('settings:backup.toasts.alreadyUploaded'), {
        description: i18n.t('settings:backup.toasts.waitHours', { hours: hoursLeft })
      })
      return
    }

    this.isExecuting.set(rateLimitKey, true)

    try {
      const result = await window.electron.ipcRenderer.invoke('backup:uploadToCloud')

      if (result.success) {
        // Mark as executed only on successful upload
        this.markExecuted(rateLimitKey)

        toast.success(i18n.t('settings:backup.toasts.uploadSuccess'), {
          description: result.message || i18n.t('settings:backup.toasts.uploadSuccessDescription')
        })
      } else {
        toast.error(i18n.t('settings:backup.toasts.uploadFailed'), {
          description: result.error || i18n.t('settings:whatsapp.toasts.connectionError')
        })
      }
    } catch (error) {
      console.error('Cloud backup upload failed:', error)
      toast.error(i18n.t('settings:backup.toasts.backupFailed'), {
        description: i18n.t('settings:backup.toasts.checkConnection')
      })
    } finally {
      this.isExecuting.set(rateLimitKey, false)
    }
  }

  /**
   * Start periodic WhatsApp checks (every 24 hours)
   */
  startPeriodicWhatsAppCheck(
    onShowDetails?: (results: NotificationResult[], sentCount: number, failedCount: number, skippedCount: number) => void
  ): void {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
    const timerId = 'whatsapp-periodic'

    // Clear existing timer if any
    this.stopPeriodicCheck(timerId)

    // Set up periodic check
    const timer = setInterval(() => {
      this.handleWhatsAppCheck(false, onShowDetails)
    }, TWENTY_FOUR_HOURS)

    this.timers.set(timerId, timer)
  }

  /**
   * Start periodic cloud backup sync (every 24 hours)
   */
  startPeriodicCloudBackupSync(): void {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
    const timerId = 'cloud-backup-periodic'

    // Clear existing timer if any
    this.stopPeriodicCheck(timerId)

    // Set up periodic check
    const timer = setInterval(() => {
      this.handleCloudBackupUpload(false)
    }, TWENTY_FOUR_HOURS)

    this.timers.set(timerId, timer)
  }

  /**
   * Stop a specific periodic check
   */
  stopPeriodicCheck(timerId: string): void {
    const timer = this.timers.get(timerId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(timerId)
    }
  }

  /**
   * Stop all periodic checks
   */
  stopAllPeriodicChecks(): void {
    this.timers.forEach((timer) => clearInterval(timer))
    this.timers.clear()
  }

  /**
   * Initialize periodic checks only (no immediate execution)
   */
  initializePeriodicChecks(
    whatsappEnabled: boolean,
    whatsappAutoSend: boolean,
    _cloudBackupEnabled: boolean,
    onShowDetails?: (results: NotificationResult[], sentCount: number, failedCount: number, skippedCount: number) => void
  ): void {
    // Start periodic WhatsApp checks if enabled and auto-send is on
    if (whatsappEnabled && whatsappAutoSend) {
      this.startPeriodicWhatsAppCheck(onShowDetails)
    }

    // Note: Cloud backup is handled by the backend after local backup creation
    // No need for periodic frontend cloud backup sync
  }

  /**
   * Update periodic checks based on settings changes
   */
  updatePeriodicChecks(
    whatsappEnabled: boolean,
    whatsappAutoSend: boolean,
    cloudBackupEnabled: boolean,
    onShowDetails?: (results: NotificationResult[], sentCount: number, failedCount: number, skippedCount: number) => void
  ): void {
    // Handle WhatsApp periodic checks
    if (whatsappEnabled && whatsappAutoSend) {
      this.startPeriodicWhatsAppCheck(onShowDetails)
    } else {
      this.stopPeriodicCheck('whatsapp-periodic')
    }

    // Handle cloud backup periodic sync
    if (cloudBackupEnabled) {
      this.startPeriodicCloudBackupSync()
    } else {
      this.stopPeriodicCheck('cloud-backup-periodic')
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
