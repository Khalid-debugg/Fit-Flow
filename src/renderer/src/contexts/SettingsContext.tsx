import { createContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Settings } from '@renderer/models/settings'
import { useTranslation } from 'react-i18next'

export interface SettingsContextType {
  settings: Settings | null
  loading: boolean
  error: Error | null
  updateSettings: (newSettings: Settings) => Promise<void>
  refreshSettings: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { i18n } = useTranslation()

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

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return (
    <SettingsContext.Provider value={{ settings, loading, error, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}
