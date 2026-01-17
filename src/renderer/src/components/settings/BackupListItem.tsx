import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, RotateCcw, Trash2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Button } from '@renderer/components/ui/button'
import type { BackupFile } from '@renderer/models/settings'
import type { SupportedLanguage } from '@renderer/locales/i18n'

interface BackupListItemProps {
  backup: BackupFile
  language: SupportedLanguage
  restoringBackup: boolean
  canManageBackups: boolean
  onRestore: (backup: BackupFile) => void
  onDelete: (backup: BackupFile) => void
}

export const BackupListItem = memo(function BackupListItem({
  backup,
  language,
  restoringBackup,
  canManageBackups,
  onRestore,
  onDelete
}: BackupListItemProps) {
  const { t } = useTranslation('settings')
  const dateLocale = language === 'ar' ? ar : enUS

  return (
    <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{backup.name}</p>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(backup.created), 'PPp', { locale: dateLocale })}
          </span>
          <span className="text-xs text-gray-400">{(backup.size / 1024).toFixed(2)} KB</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={() => onRestore(backup)}
          disabled={restoringBackup || !canManageBackups}
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
          onClick={() => onDelete(backup)}
          className="gap-2 bg-red-600 hover:bg-red-700"
          disabled={!canManageBackups}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
})
