import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { NotificationResultsDialog } from './NotificationResultsDialog'
import { notificationService } from '@renderer/services/notificationService'
import type { Settings } from '@renderer/models/settings'
import type { SupportedLanguage } from '@renderer/locales/i18n'
import { DEFAULT_WHATSAPP_TEMPLATES } from '@renderer/constants/whatsappTemplates'

interface NotificationResult {
  memberName: string
  phoneNumber: string
  status: 'sent' | 'failed' | 'skipped'
  reason?: string
  daysLeft: number
}

interface WhatsAppNotificationSectionProps {
  whatsappEnabled: boolean
  whatsappAutoSend: boolean
  whatsappDaysBeforeExpiry: number
  whatsappMessageTemplate: string
  whatsappMessageLanguage: SupportedLanguage
  whatsappLastCheckDate?: string
  canManageWhatsApp: boolean
  onUpdate: (updates: Partial<Settings>) => void
}

export const WhatsAppNotificationSection = memo(function WhatsAppNotificationSection({
  whatsappEnabled,
  whatsappAutoSend,
  whatsappDaysBeforeExpiry,
  whatsappMessageTemplate,
  whatsappMessageLanguage,
  whatsappLastCheckDate,
  canManageWhatsApp,
  onUpdate
}: WhatsAppNotificationSectionProps) {
  const { t } = useTranslation('settings')
  const [checkingNotifications, setCheckingNotifications] = useState(false)
  const [showResultsDialog, setShowResultsDialog] = useState(false)
  const [notificationResults, setNotificationResults] = useState<{
    results: NotificationResult[]
    sentCount: number
    failedCount: number
    skippedCount: number
  }>({
    results: [],
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0
  })

  const handleLanguageChange = useCallback(
    (value: string) => {
      const newLanguage = value as SupportedLanguage
      onUpdate({
        whatsappMessageLanguage: newLanguage,
        whatsappMessageTemplate: DEFAULT_WHATSAPP_TEMPLATES[newLanguage]
      })
    },
    [onUpdate]
  )

  const handleShowDetails = useCallback((results: NotificationResult[], sentCount: number, failedCount: number, skippedCount: number) => {
    setNotificationResults({
      results,
      sentCount,
      failedCount,
      skippedCount
    })
    setShowResultsDialog(true)
  }, [])

  const handleCheckAndSend = useCallback(async () => {
    if (checkingNotifications) return

    setCheckingNotifications(true)

    try {
      await notificationService.handleWhatsAppCheck(true, handleShowDetails)
    } finally {
      setCheckingNotifications(false)
    }
  }, [checkingNotifications, handleShowDetails])

  return (
    <div className="bg-dark-surface rounded-lg p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-500/10 rounded-lg">
          <MessageCircle className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{t('whatsapp.title')}</h3>
          <p className="text-sm text-gray-400">{t('whatsapp.subtitle')}</p>
        </div>
      </div>

      {!canManageWhatsApp && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
          <p className="text-sm text-yellow-400">{t('whatsapp.noPermission')}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Enable WhatsApp Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-white">{t('whatsapp.enabled')}</label>
            <p className="text-sm text-gray-400">{t('whatsapp.enabledDesc')}</p>
          </div>
          <Checkbox
            checked={whatsappEnabled}
            onCheckedChange={(checked) => onUpdate({ whatsappEnabled: Boolean(checked) })}
            disabled={!canManageWhatsApp}
          />
        </div>

        {whatsappEnabled && (
          <>
            {/* Notification Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <h4 className="text-sm font-semibold text-white">
                {t('whatsapp.notificationSettings')}
              </h4>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('whatsapp.daysBeforeExpiry')}
                </label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={whatsappDaysBeforeExpiry}
                  onChange={(e) =>
                    onUpdate({ whatsappDaysBeforeExpiry: parseInt(e.target.value) || 3 })
                  }
                  disabled={!canManageWhatsApp}
                  className="w-32"
                />
                <p className="text-xs text-gray-400 mt-1">{t('whatsapp.daysBeforeExpiryDesc')}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white">
                    {t('whatsapp.messageTemplate')}
                  </label>
                  <Select
                    value={whatsappMessageLanguage}
                    onValueChange={handleLanguageChange}
                    disabled={!canManageWhatsApp}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">{t('whatsapp.languages.ar')}</SelectItem>
                      <SelectItem value="en">{t('whatsapp.languages.en')}</SelectItem>
                      <SelectItem value="es">{t('whatsapp.languages.es')}</SelectItem>
                      <SelectItem value="pt">{t('whatsapp.languages.pt')}</SelectItem>
                      <SelectItem value="fr">{t('whatsapp.languages.fr')}</SelectItem>
                      <SelectItem value="de">{t('whatsapp.languages.de')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={whatsappMessageTemplate}
                  onChange={(e) => onUpdate({ whatsappMessageTemplate: e.target.value })}
                  disabled={!canManageWhatsApp}
                  rows={4}
                  className="font-mono text-sm"
                />
                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-400 font-semibold mb-1">
                    {t('whatsapp.availableVariables')}:
                  </p>
                  <ul className="text-xs text-blue-300 space-y-1">
                    <li>
                      <code className="bg-blue-500/20 px-1 py-0.5 rounded">{'{name}'}</code> -{' '}
                      {t('whatsapp.varMemberName')}
                    </li>
                    <li>
                      <code className="bg-blue-500/20 px-1 py-0.5 rounded">{'{gym_name}'}</code> -{' '}
                      {t('whatsapp.varGymName')}
                    </li>
                    <li>
                      <code className="bg-blue-500/20 px-1 py-0.5 rounded">{'{days_left}'}</code> -{' '}
                      {t('whatsapp.varDaysLeft')}
                    </li>
                    <li>
                      <code className="bg-blue-500/20 px-1 py-0.5 rounded">{'{end_date}'}</code> -{' '}
                      {t('whatsapp.varEndDate')}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Auto Send */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">{t('whatsapp.autoSend')}</label>
                  <p className="text-sm text-gray-400">{t('whatsapp.autoSendDesc')}</p>
                </div>
                <Checkbox
                  checked={whatsappAutoSend}
                  onCheckedChange={(checked) => onUpdate({ whatsappAutoSend: Boolean(checked) })}
                  disabled={!canManageWhatsApp}
                />
              </div>

              {/* Manual Check and Send */}
              <div className="pt-4 border-t border-gray-800">
                <Button
                  onClick={handleCheckAndSend}
                  disabled={!canManageWhatsApp || checkingNotifications}
                  variant="primary"
                  className="w-full gap-2"
                >
                  {checkingNotifications ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {t('whatsapp.checkAndSend')}
                </Button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {t('whatsapp.checkAndSendDesc')}
                </p>
                {whatsappLastCheckDate && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {t('whatsapp.lastCheck')}:{' '}
                    {new Date(whatsappLastCheckDate).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Notification Results Dialog */}
      <NotificationResultsDialog
        open={showResultsDialog}
        onOpenChange={setShowResultsDialog}
        results={notificationResults.results}
        sentCount={notificationResults.sentCount}
        failedCount={notificationResults.failedCount}
        skippedCount={notificationResults.skippedCount}
      />
    </div>
  )
})
