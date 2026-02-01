import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, HardDrive, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Button } from '@renderer/components/ui/button'
import type { BackupInfo } from '@renderer/models/settings'
import type { SupportedLanguage } from '@renderer/locales/i18n'

interface BackupInfoCardProps {
  backupInfo: BackupInfo | null
  language: SupportedLanguage
  onOpenFolder: () => void
}

export const BackupInfoCard = memo(function BackupInfoCard({
  backupInfo,
  language,
  onOpenFolder
}: BackupInfoCardProps) {
  const { t } = useTranslation('settings')
  const dateLocale = language === 'ar' ? ar : enUS

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Database className="w-4 h-4" />
          {t('backup.info')}
        </h3>
        {backupInfo?.folderPath && (
          <Button variant="primary" onClick={onOpenFolder} className="gap-2 text-xs py-1 px-2">
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
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">{t('backup.loading')}</div>
      )}
    </div>
  )
})
