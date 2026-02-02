import React from 'react'
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

import { Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCcw, PauseCircle, PlayCircle } from 'lucide-react'
import { Membership } from '@renderer/models/membership'
import { PERMISSIONS } from '@renderer/models/account'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { toast } from 'sonner'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAuth } from '@renderer/hooks/useAuth'
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
  const { hasPermission } = useAuth()
  const { settings } = useSettings()
  const today = new Date().toISOString().split('T')[0]
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  const [pauseDialogOpen, setPauseDialogOpen] = React.useState(false)
  const [resumeDialogOpen, setResumeDialogOpen] = React.useState(false)
  const [selectedMembershipId, setSelectedMembershipId] = React.useState<string | null>(null)
  const [pauseDays, setPauseDays] = React.useState('')
  const [pauseTax, setPauseTax] = React.useState('')

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
    if (!hasPermission(PERMISSIONS.memberships.extend)) {
      toast.error(t('errors.noPermission'))
      return
    }

    try {
      await window.electron.ipcRenderer.invoke('memberships:extend', membershipId)
      toast.success(t('success.extendSuccess'))
    } catch (error) {
      toast.warning(t('error.extendFail'))
      console.error('Failed to load member:', error)
    }
  }

  const handlePauseMembership = async () => {
    if (!hasPermission(PERMISSIONS.memberships.extend)) {
      toast.error(t('errors.noPermission'))
      return
    }

    try {
      await window.electron.ipcRenderer.invoke('memberships:pause', selectedMembershipId, {
        pauseDays: pauseDays ? parseInt(pauseDays) : null,
        additionalTax: pauseTax ? parseFloat(pauseTax) : 0
      })
      toast.success(t('success.pauseSuccess'))
      setPauseDialogOpen(false)
      setPauseDays('')
      setPauseTax('')
      setSelectedMembershipId(null)
      onPageChange(page)
    } catch (error) {
      toast.error(t('errors.pauseFailed'))
      console.error('Failed to pause membership:', error)
    }
  }

  const handleResumeMembership = async () => {
    if (!hasPermission(PERMISSIONS.memberships.extend)) {
      toast.error(t('errors.noPermission'))
      return
    }

    try {
      await window.electron.ipcRenderer.invoke('memberships:resume', selectedMembershipId)
      toast.success(t('success.resumeSuccess'))
      setResumeDialogOpen(false)
      setSelectedMembershipId(null)
      onPageChange(page)
    } catch (error) {
      toast.error(t('errors.resumeFailed'))
      console.error('Failed to resume membership:', error)
    }
  }
  const getStatusBadge = (endDate: string, isPaused?: boolean) => {
    if (isPaused) {
      return 'bg-yellow-500/20 text-yellow-400'
    }
    const isActive = endDate >= today
    return isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
  }

  const getStatusText = (endDate: string, isPaused?: boolean) => {
    if (isPaused) {
      return t('paused')
    }
    const isActive = endDate >= today
    return isActive ? t('active') : t('expired')
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400'
      case 'partial':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'unpaid':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getPlanTypeBadge = (planType?: string) => {
    switch (planType) {
      case 'duration':
        return '⏱️'
      case 'checkin':
        return '✓'
      case 'derived':
        return '🎯'
      default:
        return ''
    }
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
                      <span dir="ltr">{`${membership.memberCountryCode}${membership.memberPhone}`}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{membership.planName}</span>
                      <span>{getPlanTypeBadge(membership.planType)}</span>
                      {membership.planType === 'checkin' &&
                        membership.remainingCheckIns !== undefined && (
                          <span className="text-xs text-gray-500">
                            ({membership.remainingCheckIns} left)
                          </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400">{membership.startDate}</TableCell>
                  <TableCell className="text-gray-400">
                    {membership.isPaused && !membership.pauseDurationDays ? t('endDateTbd') : membership.endDate}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">
                          {formatCurrency(membership.amountPaid)}
                        </span>
                        {membership.paymentStatus !== 'paid' && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusBadge(membership.paymentStatus)}`}
                          >
                            {t(`paymentStatus.${membership.paymentStatus}`)}
                          </span>
                        )}
                      </div>
                      {membership.remainingBalance > 0 && (
                        <div className="text-xs text-yellow-500">
                          {t('table.remaining')}: {formatCurrency(membership.remainingBalance)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(membership.endDate, membership.isPaused)}`}
                    >
                      {getStatusText(membership.endDate, membership.isPaused)}
                    </span>
                  </TableCell>
                  <TableCell className="text-end min-h-[40px] h-[40px]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2 min-h-[40px] items-center">
                      {hasPermission(PERMISSIONS.memberships.extend) && (
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
                      )}
                      {hasPermission(PERMISSIONS.memberships.extend) && !membership.isPaused && (
                        <Dialog
                          open={pauseDialogOpen && selectedMembershipId === membership.id}
                          onOpenChange={(open) => {
                            setPauseDialogOpen(open)
                            if (!open) {
                              setPauseDays('')
                              setPauseTax('')
                              setSelectedMembershipId(null)
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedMembershipId(membership.id!)}
                              disabled={!isActive}
                            >
                              <PauseCircle className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#101727] border border-white">
                            <DialogHeader>
                              <DialogTitle>{t('pause.title')}</DialogTitle>
                              <DialogDescription className="text-white/70">
                                {t('pause.description', { memberName: membership.memberName })}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="pauseDays" className="text-white/90">{t('pause.pauseDays')}</Label>
                                <Input
                                  id="pauseDays"
                                  type="number"
                                  min="1"
                                  placeholder={t('pause.pauseDaysPlaceholder')}
                                  value={pauseDays}
                                  onChange={(e) => setPauseDays(e.target.value)}
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                                <p className="text-xs text-gray-400">{t('pause.pauseDaysHint')}</p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="pauseTax" className="text-white/90">
                                  {t('pause.additionalTax')} ({settings?.currency})
                                </Label>
                                <Input
                                  id="pauseTax"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder={t('pause.additionalTaxPlaceholder')}
                                  value={pauseTax}
                                  onChange={(e) => setPauseTax(e.target.value)}
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="primary"
                                onClick={() => {
                                  setPauseDialogOpen(false)
                                  setPauseDays('')
                                  setPauseTax('')
                                  setSelectedMembershipId(null)
                                }}
                              >
                                {t('form.cancel')}
                              </Button>
                              <Button
                                onClick={handlePauseMembership}
                                variant="secondary"
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                {t('form.confirm')}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      {hasPermission(PERMISSIONS.memberships.extend) && membership.isPaused && (
                        <AlertDialog
                          open={resumeDialogOpen && selectedMembershipId === membership.id}
                          onOpenChange={(open) => {
                            setResumeDialogOpen(open)
                            if (!open) {
                              setSelectedMembershipId(null)
                            }
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedMembershipId(membership.id!)}
                            >
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('resume.title')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('resume.description', { memberName: membership.memberName })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleResumeMembership}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {t('form.confirm')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {hasPermission(PERMISSIONS.memberships.edit) && (
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
                      )}
                      {hasPermission(PERMISSIONS.memberships.delete) && (
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
                      )}
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
