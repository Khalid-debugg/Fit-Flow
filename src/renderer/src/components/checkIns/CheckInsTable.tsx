import { useTranslation } from 'react-i18next'
import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'
import { Button } from '@renderer/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { History, ChevronLeft, ChevronRight } from 'lucide-react'
import { CheckIn } from '@renderer/models/checkIn'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

interface CheckInsTableProps {
  checkIns: CheckIn[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onViewHistory: (memberId: string) => void
}

export default function CheckInsTable({
  checkIns,
  page,
  totalPages,
  onPageChange,
  onViewHistory
}: CheckInsTableProps) {
  const { t, i18n } = useTranslation('checkIns')
  const { hasPermission } = useAuth()
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  const canViewCheckIns = hasPermission(PERMISSIONS.checkins.view)

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      expired: 'bg-yellow-500/20 text-yellow-400',
      none: 'bg-red-500/20 text-red-400'
    }
    return colors[status] || colors.none
  }

  const formatTime = (dateTime: string) => {
    return format(new Date(dateTime), 'p', { locale: dateLocale })
  }

  const formatDate = (dateTime: string) => {
    return format(new Date(dateTime), 'PPP', { locale: dateLocale })
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t('table.index')}</TableHead>
              <TableHead className="text-start">{t('table.member')}</TableHead>
              <TableHead className="text-start">{t('table.phone')}</TableHead>
              <TableHead className="text-start">{t('table.date')}</TableHead>
              <TableHead className="text-start">{t('table.time')}</TableHead>
              <TableHead className="text-start">{t('table.status')}</TableHead>
              <TableHead className="text-end">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checkIns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  {t('noCheckIns')}
                </TableCell>
              </TableRow>
            ) : (
              checkIns.map((checkIn, idx) => (
                <TableRow key={checkIn.id} className="hover:bg-gray-700/50">
                  <TableCell className="font-medium">
                    {checkIns.length === 1 ? '-' : idx + 1 + (page - 1) * 10}
                  </TableCell>
                  <TableCell className="font-medium">{checkIn.memberName}</TableCell>
                  <TableCell className="text-gray-400">
                    <span dir="ltr">{`${checkIn.memberCountryCode}${checkIn.memberPhone}`}</span>
                  </TableCell>
                  <TableCell className="text-gray-400">{formatDate(checkIn.checkInTime)}</TableCell>
                  <TableCell className="text-gray-400">{formatTime(checkIn.checkInTime)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(checkIn.membershipStatus!)}`}
                    >
                      {t(`status.${checkIn.membershipStatus}`)}
                    </span>
                  </TableCell>
                  <TableCell className="text-end min-h-[40px] h-[40px]">
                    {canViewCheckIns && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewHistory(checkIn.memberId)}
                        title={t('viewHistory')}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
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
    </div>
  )
}
