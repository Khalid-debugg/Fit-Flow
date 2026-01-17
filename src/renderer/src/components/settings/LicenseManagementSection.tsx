import { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Key, AlertTriangle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@renderer/components/ui/alert-dialog'

interface LicenseManagementSectionProps {
  canManageLicense: boolean
}

interface LicenseStatus {
  isLicensed: boolean
  reason?: string
  trialDaysRemaining?: number
  licenseData?: {
    activatedAt: string
    subscriptionStatus: string
    trialEndsAt?: string
  }
}

export const LicenseManagementSection = memo(function LicenseManagementSection({
  canManageLicense
}: LicenseManagementSectionProps) {
  const { t, i18n } = useTranslation('settings')
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null)
  const [deactivatingLicense, setDeactivatingLicense] = useState(false)
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  useEffect(() => {
    loadLicenseStatus()
  }, [])

  const loadLicenseStatus = useCallback(async () => {
    try {
      const status = await window.electron.ipcRenderer.invoke('license:getStatus')
      setLicenseStatus(status)
    } catch (error) {
      console.error('Failed to load license status:', error)
    }
  }, [])

  const handleDeactivateLicense = useCallback(async () => {
    setDeactivatingLicense(true)

    try {
      const result = await window.electron.ipcRenderer.invoke('license:deactivate')

      if (result.success) {
        toast.success(t('license.deactivateSuccess'))
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast.error(t('license.deactivateFailed'), {
          description: result.message
        })
        setDeactivatingLicense(false)
      }
    } catch (error) {
      console.error('Deactivate failed:', error)
      toast.error(t('license.deactivateFailed'))
      setDeactivatingLicense(false)
    }
  }, [t])

  return (
    <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <Key className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-semibold text-white">
          {t('license.title')}
          {!canManageLicense && (
            <span className="text-xs text-yellow-400 ml-2">({t('license.viewOnly')})</span>
          )}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* License Information */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Key className="w-4 h-4" />
            {t('license.information')}
          </h3>

          {licenseStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{t('license.status')}:</span>
                <span
                  className={`font-medium ${licenseStatus.isLicensed ? 'text-green-400' : 'text-red-400'}`}
                >
                  {licenseStatus.isLicensed ? t('license.active') : t('license.notActive')}
                </span>
              </div>

              {licenseStatus.licenseData && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{t('license.activated')}:</span>
                    <span className="text-white font-medium">
                      {format(new Date(licenseStatus.licenseData.activatedAt), 'PPp', {
                        locale: dateLocale
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{t('license.subscription')}:</span>
                    <span className="text-white font-medium capitalize">
                      {licenseStatus.licenseData.subscriptionStatus}
                    </span>
                  </div>

                  {licenseStatus.licenseData.trialEndsAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{t('license.trialEnds')}:</span>
                      <span className="text-white font-medium">
                        {format(new Date(licenseStatus.licenseData.trialEndsAt), 'PPp', {
                          locale: dateLocale
                        })}
                      </span>
                    </div>
                  )}

                  {licenseStatus.trialDaysRemaining !== undefined &&
                    licenseStatus.trialDaysRemaining > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{t('license.daysRemaining')}:</span>
                        <span className="text-yellow-400 font-medium">
                          {licenseStatus.trialDaysRemaining} {t('license.days')}
                        </span>
                      </div>
                    )}
                </>
              )}

              {!licenseStatus.isLicensed && licenseStatus.reason && (
                <div className="bg-red-900/20 border border-red-700/50 rounded p-3 mt-3">
                  <p className="text-xs text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {licenseStatus.reason}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">{t('license.loading')}</div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-blue-300 mb-3">
                {t('license.information')}
              </h3>
              <p className="text-sm text-blue-300">{t('license.deactivateInfo')}</p>
            </div>

            {licenseStatus?.isLicensed && canManageLicense && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="primary"
                    disabled={deactivatingLicense}
                    className="w-full gap-2 bg-red-600 hover:bg-red-700 mt-4"
                  >
                    {deactivatingLicense ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('license.deactivating')}
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        {t('license.deactivate')}
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('license.alert.title')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('license.alert.message')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('license.alert.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeactivateLicense}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {t('license.alert.confirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
