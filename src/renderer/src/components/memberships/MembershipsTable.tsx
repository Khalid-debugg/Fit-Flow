import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'

import { Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react'
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
} from '@renderer/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useSettings } from '@renderer/hooks/useSettings'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
interface MembershipsTableProps {
  memberships: Membership[]
  page: number
  totalPages: number
  onRowClick: (membership: Membership) => void
  onEdit: (membership: Membership) => void
  onDelete: (id: string) => void
  onPageChange: (page: number) => void
}

export default function MembershipsTable({
  memberships,
  page,
  totalPages,
  onRowClick,
  onEdit,
  onDelete,
  onPageChange
}: MembershipsTableProps) {
  const { t, i18n } = useTranslation('memberships')
  const { settings } = useSettings()
  const today = new Date().toISOString().split('T')[0]
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  const calculateNewEndDate = (membership: Membership) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endDate = new Date(membership.endDate)
    endDate.setHours(0, 0, 0, 0)

    // Calculate membership duration in days
    const start = new Date(membership.startDate)
    const end = new Date(membership.endDate)
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    // Determine new start date
    let newStartDate: Date
    if (endDate < today) {
      // If membership has expired, start from today
      newStartDate = new Date(today)
    } else {
      // If membership is still active, start from day after end date
      newStartDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000)
    }

    // Calculate new end date by adding duration to new start date
    const newEndDate = new Date(newStartDate.getTime() + durationDays * 24 * 60 * 60 * 1000)

    return format(newEndDate, 'PPP', { locale: dateLocale })
  }

  const handleRenewMembership = async (membershipId: string) => {
    try {
      await window.electron.ipcRenderer.invoke('memberships:extend', membershipId)
      toast.success(t('success.extendSuccess'))
    } catch (error) {
      toast.warning(t('error.extendFail'))
      console.error('Failed to load member:', error)
    }
  }
  const getStatusBadge = (endDate: string) => {
    const isActive = endDate >= today
    return isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(settings?.language, {
      style: 'currency',
      currency: settings?.currency,
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t('table.index')}</TableHead>
              <TableHead className="text-start">{t('table.member')}</TableHead>
              <TableHead className="text-start">{t('table.plan')}</TableHead>
              <TableHead className="text-start">{t('table.startDate')}</TableHead>
              <TableHead className="text-start">{t('table.endDate')}</TableHead>
              <TableHead className="text-start">{t('table.amountPaid')}</TableHead>
              <TableHead className="text-start">{t('table.paymentMethod')}</TableHead>
              <TableHead className="text-start">{t('table.status')}</TableHead>
              <TableHead className="text-end">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships.map((membership, idx) => {
              const isActive = membership.endDate >= today
              return (
                <TableRow
                  key={membership.id}
                  className="cursor-pointer hover:bg-gray-700/50"
                  onClick={() => onRowClick(membership)}
                >
                  <TableCell className="font-medium">
                    {memberships.length === 1 ? '-' : idx + 1 + (page - 1) * 10}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{membership.memberName}</div>
                      <div className="text-sm text-gray-400">{membership.memberPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400">{membership.planName}</TableCell>
                  <TableCell className="text-gray-400">{membership.startDate}</TableCell>
                  <TableCell className="text-gray-400">{membership.endDate}</TableCell>
                  <TableCell className="text-gray-400">
                    {formatCurrency(membership.amountPaid)}
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {t(`paymentMethods.${membership.paymentMethod}`)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(membership.endDate)}`}
                    >
                      {isActive ? t('active') : t('expired')}
                    </span>
                  </TableCell>
                  <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="gap-2 shrink-0">
                            <RefreshCcw className="w-3 h-3" />
                            {t('renew')}
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
                            <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                handleRenewMembership(membership.id!)
                                onPageChange(1)
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {t('form.confirm')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(membership)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('delete.description')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(membership.id!)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {t('form.confirm')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
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
