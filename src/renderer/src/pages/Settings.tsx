import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@renderer/hooks/useSettings'
import { Settings as SettingsType, CURRENCIES, BackupInfo } from '@renderer/models/settings'
import { Button } from '@renderer/components/ui/button'
import {
  Globe,
  DollarSign,
  Users,
  Shield,
  Save,
  Loader2,
  Cloud,
  CloudOff,
  HardDrive,
  Database,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

export default function Settings() {
  const { t, i18n } = useTranslation('settings')
  const { settings: contextSettings, updateSettings, loading: contextLoading } = useSettings()
  const [formData, setFormData] = useState<SettingsType | null>(null)
  const [saving, setSaving] = useState(false)
  const [backupInfo, setBackupInfo] = useState<BackupInfo>()
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  useEffect(() => {
    if (contextSettings) {
      setFormData(contextSettings)
    }
  }, [contextSettings])

  useEffect(() => {
    loadBackupInfo()
    checkConnection()
  }, [])

  const loadBackupInfo = async () => {
    try {
      const info = await window.electron.ipcRenderer.invoke('backup:getInfo')
      setBackupInfo(info)
    } catch (error) {
      console.error('Failed to load backup info:', error)
    }
  }

  const checkConnection = async () => {
    try {
      const online = await window.electron.ipcRenderer.invoke('network:checkConnection')
      setIsOnline(online)
    } catch {
      setIsOnline(false)
    }
  }

  const handleSave = async () => {
    if (!formData) return

    setSaving(true)
    try {
      await updateSettings(formData)
      toast.success(t('messages.saved'))
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error(t('messages.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleCreateBackup = async () => {
    setCreatingBackup(true)

    try {
      // Check connection if cloud backup is selected
      if (formData?.backupLocation !== 'local') {
        const online = await window.electron.ipcRenderer.invoke('network:checkConnection')

        if (!online) {
          toast.error(t('backup.noConnection'), {
            description: t('backup.noConnectionDesc'),
            duration: 5000
          })
          setCreatingBackup(false)
          return
        }
      }

      const result = await window.electron.ipcRenderer.invoke('backup:create')

      if (result.success) {
        toast.success(t('backup.success'), {
          description: `${t('backup.size')}: ${(result.size / 1024).toFixed(2)} KB`
        })
        await loadBackupInfo()

        // Clean old backups
        await window.electron.ipcRenderer.invoke('backup:cleanOld')
      } else {
        toast.error(t('backup.failed'), {
          description: result.error
        })
      }
    } catch (error) {
      console.error('Backup failed:', error)
      toast.error(t('backup.failed'))
    } finally {
      setCreatingBackup(false)
    }
  }

  if (contextLoading || !formData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-20 h-20 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-gray-400">{t('subtitle')}</p>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('saving')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t('save')}
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Settings */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-semibold text-white">{t('regional.title')}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('regional.language')}
              </label>
              <select
                value={formData.language}
                onChange={(e) =>
                  setFormData({ ...formData, language: e.target.value as 'ar' | 'en' })
                }
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ar">{t('regional.arabic')}</option>
                <option value="en">{t('regional.english')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('regional.currency')}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name} (
                    {i18n.language === 'ar' ? currency.arSymbol : currency.enSymbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('regional.dateFormat')}
              </label>
              <select
                value={formData.dateFormat}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dateFormat: e.target.value as SettingsType['dateFormat']
                  })
                }
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Member & Payment Settings */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">{t('members.title')}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('members.allowedGenders')}
              </label>
              <select
                value={formData.allowedGenders}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    allowedGenders: e.target.value as SettingsType['allowedGenders']
                  })
                }
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="both">{t('members.both')}</option>
                <option value="male">{t('members.maleOnly')}</option>
                <option value="female">{t('members.femaleOnly')}</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">{t('payment.title')}</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('payment.defaultMethod')}
                </label>
                <select
                  value={formData.defaultPaymentMethod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultPaymentMethod: e.target.value as SettingsType['defaultPaymentMethod']
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">{t('payment.cash')}</option>
                  <option value="card">{t('payment.card')}</option>
                  <option value="bank">{t('payment.bank')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Backup Settings - Full Width */}
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-semibold text-white">{t('backup.title')}</h2>
            {!isOnline && (
              <div className="flex items-center gap-2 ml-auto">
                <CloudOff className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{t('backup.offline')}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Backup Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                <span className="text-sm font-medium text-gray-300">{t('backup.autoBackup')}</span>
                <input
                  type="checkbox"
                  checked={formData.autoBackup}
                  onChange={(e) => setFormData({ ...formData, autoBackup: e.target.checked })}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </div>

              {formData.autoBackup && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('backup.frequency')}
                    </label>
                    <select
                      value={formData.backupFrequency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          backupFrequency: e.target.value as SettingsType['backupFrequency']
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">{t('backup.daily')}</option>
                      <option value="weekly">{t('backup.weekly')}</option>
                      <option value="monthly">{t('backup.monthly')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('backup.location')}
                    </label>
                    <select
                      value={formData.backupLocation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          backupLocation: e.target.value as SettingsType['backupLocation']
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="local">
                        <HardDrive className="inline w-4 h-4 mr-2" />
                        {t('backup.local')}
                      </option>
                      <option value="google_drive" disabled>
                        {t('backup.googleDrive')} (Coming Soon)
                      </option>
                      <option value="dropbox" disabled>
                        {t('backup.dropbox')} (Coming Soon)
                      </option>
                    </select>
                  </div>
                </>
              )}

              <Button
                variant="primary"
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="w-full gap-2 mt-4"
              >
                {creatingBackup ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('backup.creating')}
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    {t('backup.createNow')}
                  </>
                )}
              </Button>
            </div>

            {/* Backup Info */}
            <div className="space-y-4">
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  {t('backup.info')}
                </h3>

                {backupInfo ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{t('backup.lastBackup')}:</span>
                      <span className="text-white font-medium flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {backupInfo.lastBackup
                          ? format(new Date(backupInfo.lastBackup), 'PPp', { locale: dateLocale })
                          : t('backup.never')}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-800">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {formData.backupLocation === 'local' ? (
                          <>
                            <HardDrive className="w-3 h-3" />
                            <span>{t('backup.localStorage')}</span>
                          </>
                        ) : (
                          <>
                            <Cloud className="w-3 h-3" />
                            <span>{t('backup.cloudStorage')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    {t('backup.loading')}
                  </div>
                )}
              </div>

              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <p className="text-xs text-blue-300">💡 {t('backup.tip')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
