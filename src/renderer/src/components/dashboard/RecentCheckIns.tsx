import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Clock, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

interface CheckIn {
  id: string
  memberId: string
  checkInTime: string
  memberName: string
  memberPhone: string
  membershipStatus: 'active' | 'expired' | 'none'
}

interface RecentCheckInsProps {
  data: CheckIn[]
  onViewMember: (memberId: string) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function RecentCheckIns({
  data,
  onViewMember,
  page,
  totalPages,
  onPageChange
}: RecentCheckInsProps) {
  const { t, i18n } = useTranslation('dashboard')
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      expired: 'bg-yellow-500/20 text-yellow-400',
      none: 'bg-red-500/20 text-red-400'
    }
    return colors[status] || colors.none
  }

  const getTimeAgo = (dateTime: string) => {
    try {
      return formatDistanceToNow(new Date(dateTime), { addSuffix: true, locale: dateLocale })
    } catch {
      return new Date(dateTime).toLocaleTimeString()
    }
  }

  return (
    <div className="flex flex-col bg-gray-800 p-6 min-h-140 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{t('recentCheckIns.title')}</h3>
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
        <div className="text-center py-8 text-gray-400">{t('recentCheckIns.noData')}</div>
      ) : (
        <>
          <div className="space-y-3 flex-1">
            {data.map((checkIn) => (
              <div
                key={checkIn.id}
                onClick={() => onViewMember(checkIn.memberId)}
                className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-white">{checkIn.memberName}</p>
                    <p className="text-sm text-gray-400">{checkIn.memberPhone}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{getTimeAgo(checkIn.checkInTime)}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(checkIn.membershipStatus)}`}
                    >
                      {t(`status.${checkIn.membershipStatus}`)}
                    </span>
                  </div>
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
