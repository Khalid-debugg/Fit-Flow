import { createContext, useState, useEffect, ReactNode } from 'react'
import { Settings } from '@renderer/models/settings'
import { useTranslation } from 'react-i18next'

export interface SettingsContextType {
  settings: Settings | null
  loading: boolean
  updateSettings: (newSettings: Settings) => Promise<void>
  refreshSettings: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const { i18n } = useTranslation()

  const loadSettings = async () => {
    try {
      const loadedSettings = await window.electron.ipcRenderer.invoke('settings:get')
      setSettings(loadedSettings)

      if (loadedSettings.language !== i18n.language) {
        await i18n.changeLanguage(loadedSettings.language)
      }

      document.documentElement.dir = loadedSettings.language === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = loadedSettings.language
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Settings) => {
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
  }

  const refreshSettings = async () => {
    await loadSettings()
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}
