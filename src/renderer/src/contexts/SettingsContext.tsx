import { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { Settings } from '@renderer/models/settings'
import { useTranslation } from 'react-i18next'
import { notificationService } from '@renderer/services/notificationService'

export interface SettingsContextType {
  settings: Settings | null
  loading: boolean
  error: Error | null
  updateSettings: (newSettings: Settings) => Promise<void>
  refreshSettings: () => Promise<void>
  initializeNotifications: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { i18n } = useTranslation()
  const notificationsInitialized = useRef(false)

  const loadSettings = useCallback(async () => {
    try {
      setError(null)
      const loadedSettings = await window.electron.ipcRenderer.invoke('settings:get')
      setSettings(loadedSettings)

      if (loadedSettings.language !== i18n.language) {
        await i18n.changeLanguage(loadedSettings.language)
      }

      document.documentElement.dir = loadedSettings.language === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = loadedSettings.language
    } catch (error) {
      console.error('Failed to load settings:', error)
      setError(error instanceof Error ? error : new Error('Failed to load settings'))
    } finally {
      setLoading(false)
    }
  }, [i18n])

  const updateSettings = useCallback(async (newSettings: Settings) => {
    try {
      await window.electron.ipcRenderer.invoke('settings:update', newSettings)

      // Only update periodic checks if WhatsApp or backup settings actually changed
      if (settings) {
        const whatsappChanged =
          newSettings.whatsappEnabled !== settings.whatsappEnabled ||
          newSettings.whatsappAutoSend !== settings.whatsappAutoSend
        const backupChanged = newSettings.cloudBackupEnabled !== settings.cloudBackupEnabled

        if (whatsappChanged || backupChanged) {
          console.log('WhatsApp/Backup settings changed, updating periodic checks...')
          notificationService.updatePeriodicChecks(
            newSettings.whatsappEnabled || false,
            newSettings.whatsappAutoSend || false,
            newSettings.cloudBackupEnabled || false
          )
        }
      }

      setSettings(newSettings)

      if (newSettings.language !== i18n.language) {
        await i18n.changeLanguage(newSettings.language)
      }

      document.documentElement.dir = newSettings.language === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = newSettings.language
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }
  }, [i18n])

  const refreshSettings = useCallback(async () => {
    await loadSettings()
  }, [loadSettings])

  const initializeNotifications = useCallback(() => {
    // Only initialize once to prevent multiple timers
    if (notificationsInitialized.current) {
      console.log('Notifications already initialized, skipping...')
      return
    }

    if (settings) {
      console.log('Initializing periodic notifications...')
      notificationService.initializePeriodicChecks(
        settings.whatsappEnabled || false,
        settings.whatsappAutoSend || false,
        settings.cloudBackupEnabled || false
      )
      notificationsInitialized.current = true
    }
  }, [settings])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Cleanup periodic checks on unmount
  useEffect(() => {
    return () => {
      console.log('SettingsProvider unmounting, stopping all periodic checks...')
      notificationService.stopAllPeriodicChecks()
      notificationsInitialized.current = false
    }
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loading, error, updateSettings, refreshSettings, initializeNotifications }}>
      {children}
    </SettingsContext.Provider>
  )
}
