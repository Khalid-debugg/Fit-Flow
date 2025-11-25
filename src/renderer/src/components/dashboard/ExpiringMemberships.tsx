import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { AlertCircle, RefreshCw, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react'
import { Membership } from '@renderer/models/membership'
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
} from '../ui/alert-dialog'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

export type ExpiringMembership = Membership & { daysRemaining: number }

interface ExpiringMembershipsProps {
  data: ExpiringMembership[]
  onRenew: (memberId: string) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function ExpiringMemberships({
  data,
  onRenew,
  page,
  totalPages,
  onPageChange
}: ExpiringMembershipsProps) {
  const { t, i18n } = useTranslation('dashboard')
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  const calculateNewEndDate = (membership: ExpiringMembership) => {
    const start = new Date(membership.startDate)
    const end = new Date(membership.endDate)
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const newEndDate = new Date(end.getTime() + diffDays * 24 * 60 * 60 * 1000)
    return format(newEndDate, 'PPP', { locale: dateLocale })
  }

  const getDaysColor = (days: number) => {
    if (days <= 2) return 'text-red-400'
    if (days <= 5) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <div className="flex flex-col bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center gap-2 mb-4">
        <div className="flex gap-2 items-center">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">{t('expiringMemberships.title')}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          className="gap-2 text-blue-400 hover:text-blue-300"
        >
          {t('refresh')}
          <RefreshCcw className="w-4 h-4" />
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-400">{t('expiringMemberships.noData')}</div>
      ) : (
        <>
          <div className="space-y-3 flex-1">
            {data.map((membership) => (
              <div
                key={membership.id}
                className="bg-gray-900/50 p-3 rounded-lg border border-gray-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-white">{membership.memberName}</p>
                    <p className="text-sm text-gray-400">{membership.planName}</p>
                  </div>
                  <p className={`text-sm ${getDaysColor(membership.daysRemaining)}`}>
                    {membership.daysRemaining === 0
                      ? t('expiringMemberships.expiringToday')
                      : membership.daysRemaining === 1
                        ? t('expiringMemberships.expiringTomorrow')
                        : t('expiringMemberships.expiringInDays', {
                            days: membership.daysRemaining
                          })}
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="secondary" className="gap-2 shrink-0">
                        <RefreshCw className="w-3 h-3" />
                        {t('expiringMemberships.renew')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('alert.renewMembership')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('alert.renewMembershipMessage', {
                            memberName: membership.memberName,
                            newEndDate: calculateNewEndDate(membership)
                          })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            onRenew(membership.id!)
                            onPageChange(1)
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {t('confirm')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <p className="text-sm text-gray-400">
                {t('pagination.page')} {page} {t('pagination.of')} {totalPages}
              </p>
              <div className="flex gap-2 ltr:flex-row rtl:flex-row-reverse">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('pagination.previous')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                  {t('pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
