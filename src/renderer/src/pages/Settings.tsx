import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@renderer/hooks/useSettings'
import {
  Settings as SettingsType,
  CURRENCIES,
  BackupInfo,
  BackupFile
} from '@renderer/models/settings'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Checkbox } from '@renderer/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import {
  Globe,
  Shield,
  Save,
  Loader2,
  HardDrive,
  Database,
  Clock,
  FolderOpen,
  RotateCcw,
  Trash2,
  Building2,
  Upload,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import DeveloperTools from '@renderer/components/settings/DeveloperTools'

export default function Settings() {
  const { t, i18n } = useTranslation('settings')
  const { settings: contextSettings, updateSettings, loading: contextLoading } = useSettings()
  const [formData, setFormData] = useState<SettingsType | null>(null)
  const [saving, setSaving] = useState(false)
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  useEffect(() => {
    if (contextSettings) {
      setFormData(contextSettings)
      if (contextSettings.gymLogoPath) {
        loadLogoPreview(contextSettings.gymLogoPath)
      }
    }
  }, [contextSettings])

  const loadLogoPreview = async (logoPath: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('gym:getLogoPreview', logoPath)
      if (result.success && result.previewUrl) {
        setLogoPreview(result.previewUrl)
      } else {
        console.error('Failed to load logo preview:', result.error)
        setLogoPreview(null)
      }
    } catch (error) {
      console.error('Failed to load logo preview:', error)
      setLogoPreview(null)
    }
  }

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

  const handleSelectLogo = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('gym:selectLogo')

      if (!result.canceled && result.logoPath) {
        setFormData({ ...formData!, gymLogoPath: result.logoPath })
        if (result.previewUrl) {
          setLogoPreview(result.previewUrl)
        }
        toast.success('Logo selected successfully')
      } else if (result.error) {
        toast.error('Failed to select logo: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to select logo:', error)
      toast.error('Failed to select logo')
    }
  }

  const handleSelectBackupFolder = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('backup:selectFolder')

      if (!result.canceled && result.folderPath) {
        setFormData({ ...formData!, backupFolderPath: result.folderPath })
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
        toast.success(t('backup.success'), {
          description: `${t('backup.size')}: ${(result.size / 1024).toFixed(2)} KB`
        })
        await loadBackupInfo()
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
        {/* Gym Information */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">{t('gym.title')}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('gym.name')} <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={formData.gymName}
                onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                placeholder={t('gym.namePlaceholder')}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('gym.address')}
              </label>
              <Input
                type="text"
                value={formData.gymAddress || ''}
                onChange={(e) => setFormData({ ...formData, gymAddress: e.target.value })}
                placeholder={t('gym.addressPlaceholder')}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('gym.phone')}
              </label>
              <Input
                type="text"
                value={formData.gymPhone || ''}
                onChange={(e) => setFormData({ ...formData, gymPhone: e.target.value })}
                placeholder={t('gym.phonePlaceholder')}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('gym.logo')}
              </label>
              <div className="space-y-3">
                {logoPreview && (
                  <div className="relative w-32 h-32 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center p-3">
                    <img
                      src={logoPreview}
                      alt="Gym Logo"
                      className="max-w-full max-h-full w-auto h-auto object-contain"
                      onError={(e) => {
                        console.error('Failed to load image preview')
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        toast.error('Failed to display logo preview')
                      }}
                    />
                  </div>
                )}
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSelectLogo}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {logoPreview ? t('gym.changeLogo') : t('gym.selectLogo')}
                </Button>
                {!logoPreview && (
                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" />
                    {t('gym.defaultLogo')}
                  </p>
                )}
                <p className="text-xs text-blue-300 bg-blue-900/20 border border-blue-700/50 rounded p-2">
                  {t('gym.logoTip')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gym Settings */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-semibold text-white">{t('gymSettings')}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('regional.language')}
              </label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  setFormData({ ...formData, language: value as 'ar' | 'en' })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">{t('regional.arabic')}</SelectItem>
                  <SelectItem value="en">{t('regional.english')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('regional.currency')}
              </label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} (
                      {i18n.language === 'ar' ? currency.arSymbol : currency.enSymbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('members.allowedGenders')}
              </label>
              <Select
                value={formData.allowedGenders}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    allowedGenders: value as SettingsType['allowedGenders']
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">{t('members.both')}</SelectItem>
                  <SelectItem value="male">{t('members.maleOnly')}</SelectItem>
                  <SelectItem value="female">{t('members.femaleOnly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('payment.defaultMethod')}
              </label>
              <Select
                value={formData.defaultPaymentMethod}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    defaultPaymentMethod: value as SettingsType['defaultPaymentMethod']
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('payment.cash')}</SelectItem>
                  <SelectItem value="card">{t('payment.card')}</SelectItem>
                  <SelectItem value="bank">{t('payment.bank')}</SelectItem>
                  <SelectItem value="e-wallet">{t('payment.e-wallet')}</SelectItem>
                </SelectContent>
              </Select>
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
                <Checkbox
                  checked={formData.autoBackup}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, autoBackup: checked as boolean })
                  }
                  className="w-5 h-5"
                />
              </div>

              {formData.autoBackup && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('backup.frequency')}
                  </label>
                  <Select
                    value={formData.backupFrequency}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        backupFrequency: value as SettingsType['backupFrequency']
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t('backup.daily')}</SelectItem>
                      <SelectItem value="weekly">{t('backup.weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('backup.monthly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('backup.backupFolder')}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={formData.backupFolderPath || ''}
                    readOnly
                    placeholder={t('backup.noFolderSelected')}
                    className="flex-1 bg-gray-900 border-gray-700 text-white"
                  />
                  <Button variant="primary" onClick={handleSelectBackupFolder} className="gap-2">
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
            <h3 className="text-lg font-semibold text-white mb-4">
              {t('backup.availableBackups')}
            </h3>
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

        {/* Developer Tools - Only visible in development mode */}
        {import.meta.env.DEV && <DeveloperTools />}
      </div>
    </div>
  )
}
