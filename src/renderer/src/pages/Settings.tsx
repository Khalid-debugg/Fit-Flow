import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@renderer/hooks/useSettings'
import { Settings as SettingsType, CURRENCIES, BackupInfo, BackupFile } from '@renderer/models/settings'
import { Button } from '@renderer/components/ui/button'
import {
  Globe,
  DollarSign,
  Users,
  Shield,
  Save,
  Loader2,
  HardDrive,
  Database,
  Clock,
  FolderOpen,
  RotateCcw,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

export default function Settings() {
  const { t, i18n } = useTranslation('settings')
  const { settings: contextSettings, updateSettings, loading: contextLoading } = useSettings()
  const [formData, setFormData] = useState<SettingsType | null>(null)
  const [saving, setSaving] = useState(false)
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  useEffect(() => {
    if (contextSettings) {
      setFormData(contextSettings)
    }
  }, [contextSettings])

  useEffect(() => {
    loadBackupInfo()
  }, [])

  const loadBackupInfo = async () => {
    try {
      const info = await window.electron.ipcRenderer.invoke('backup:getInfo')
      setBackupInfo(info)
    } catch (error) {
      console.error('Failed to load backup info:', error)
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

  const handleSelectBackupFolder = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('backup:selectFolder')

      if (!result.canceled && result.folderPath) {
        const updatedSettings = { ...formData!, backupFolderPath: result.folderPath }
        setFormData(updatedSettings)
        await updateSettings(updatedSettings)
        await loadBackupInfo()
        toast.success(t('backup.selectFolder'))
      }
    } catch (error) {
      console.error('Failed to select folder:', error)
      toast.error(t('messages.error'))
    }
  }

  const handleCreateBackup = async () => {
    setCreatingBackup(true)

    try {
      const result = await window.electron.ipcRenderer.invoke('backup:create')

      if (result.success) {
        await window.electron.ipcRenderer.invoke('backup:cleanOld')
        await loadBackupInfo()
        toast.success(t('backup.success'), {
          description: `${t('backup.size')}: ${(result.size / 1024).toFixed(2)} KB`
        })
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

  const handleRestoreBackup = async (backup: BackupFile) => {
    const confirmed = window.confirm(t('backup.restoreWarning'))
    if (!confirmed) return

    setRestoringBackup(true)

    try {
      const result = await window.electron.ipcRenderer.invoke('backup:restore', backup.path)

      if (result.success) {
        toast.success(t('backup.restoreSuccess'))
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast.error(t('backup.restoreFailed'), {
          description: result.error
        })
      }
    } catch (error) {
      console.error('Restore failed:', error)
      toast.error(t('backup.restoreFailed'))
    } finally {
      setRestoringBackup(false)
    }
  }

  const handleDeleteBackup = async (backup: BackupFile) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('backup:delete', backup.path)

      if (result.success) {
        toast.success('Backup deleted')
        await loadBackupInfo()
      } else {
        toast.error('Failed to delete backup')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete backup')
    }
  }

  const handleOpenFolder = async () => {
    if (!backupInfo?.folderPath) return

    try {
      await window.electron.ipcRenderer.invoke('backup:openFolder', backupInfo.folderPath)
    } catch (error) {
      console.error('Failed to open folder:', error)
      toast.error('Failed to open folder')
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
          </div>
        </div>

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

        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-semibold text-white">{t('backup.title')}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('backup.backupFolder')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.backupFolderPath || ''}
                    readOnly
                    placeholder={t('backup.noFolderSelected')}
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    variant="primary"
                    onClick={handleSelectBackupFolder}
                    className="gap-2"
                  >
                    <FolderOpen className="w-4 h-4" />
                    {t('backup.selectFolder')}
                  </Button>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="w-full gap-2"
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

            <div className="space-y-4">
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    {t('backup.info')}
                  </h3>
                  {backupInfo?.folderPath && (
                    <Button
                      variant="primary"
                      onClick={handleOpenFolder}
                      className="gap-2 text-xs py-1 px-2"
                    >
                      <HardDrive className="w-3 h-3" />
                      {t('backup.openFolder')}
                    </Button>
                  )}
                </div>

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

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{t('backup.totalBackups')}:</span>
                      <span className="text-white font-medium">{backupInfo.backupCount}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{t('backup.totalSize')}:</span>
                      <span className="text-white font-medium">
                        {(backupInfo.totalSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    {t('backup.loading')}
                  </div>
                )}
              </div>

              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <p className="text-xs text-blue-300">{t('backup.tip')}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">{t('backup.availableBackups')}</h3>
            {backupInfo && backupInfo.backups.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {backupInfo.backups.map((backup) => (
                  <div
                    key={backup.path}
                    className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{backup.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(backup.created), 'PPp', { locale: dateLocale })}
                        </span>
                        <span className="text-xs text-gray-400">
                          {(backup.size / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        onClick={() => handleRestoreBackup(backup)}
                        disabled={restoringBackup}
                        className="gap-2"
                      >
                        {restoringBackup ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('backup.restoring')}
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            {t('backup.restore')}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleDeleteBackup(backup)}
                        className="gap-2 bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('backup.noBackups')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
