import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Membership, MembershipPayment } from '@renderer/models/membership'
import { PERMISSIONS } from '@renderer/models/account'
import {
  Phone,
  Calendar,
  User,
  Wallet,
  CreditCard,
  FileText,
  BadgeCheck,
  LucideIcon,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAuth } from '@renderer/hooks/useAuth'
import { Button } from '@renderer/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@renderer/components/ui/alert-dialog'
import PaymentModal from './PaymentModal'
import { toast } from 'sonner'

interface ViewMembershipProps {
  membership: Membership | null
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ViewMembership({
  membership,
  open,
  onClose,
  onSuccess
}: ViewMembershipProps) {
  const { t } = useTranslation('memberships')
  const { hasPermission } = useAuth()
  const { settings } = useSettings()
  const today = new Date().toISOString().split('T')[0]
  const [paymentHistory, setPaymentHistory] = useState<MembershipPayment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [completingPayment, setCompletingPayment] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)

  useEffect(() => {
    if (membership?.id && open) {
      loadPaymentHistory()
    }
  }, [membership?.id, open])

  const loadPaymentHistory = async () => {
    if (!membership?.id) return

    if (!hasPermission(PERMISSIONS.memberships.view_payments)) {
      return
    }

    setLoadingPayments(true)
    try {
      const payments = await window.electron.ipcRenderer.invoke(
        'memberships:getPayments',
        membership.id
      )
      setPaymentHistory(payments)
    } catch (error) {
      console.error('Failed to load payment history:', error)
    } finally {
      setLoadingPayments(false)
    }
  }

  const handleConfirmPayment = (paymentId: string) => {
    setSelectedPaymentId(paymentId)
    setConfirmDialogOpen(true)
  }

  const handleCompleteScheduledPayment = async () => {
    if (!membership?.id || !selectedPaymentId) return

    if (!hasPermission(PERMISSIONS.memberships.complete_payment)) {
      toast.error(t('errors.noPermission'))
      return
    }

    setCompletingPayment(true)
    try {
      await window.electron.ipcRenderer.invoke(
        'memberships:completeScheduledPayment',
        selectedPaymentId,
        membership.id
      )
      await loadPaymentHistory()
      // Notify parent to refresh the membership list
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Failed to complete scheduled payment:', error)
    } finally {
      setCompletingPayment(false)
      setConfirmDialogOpen(false)
      setSelectedPaymentId(null)
    }
  }

  if (!membership) return null

  const isActive = membership.endDate >= today
  const hasOutstandingBalance = membership.remainingBalance > 0

  const completedPayments = paymentHistory.filter((p) => p.paymentStatus === 'completed')
  const scheduledPayments = paymentHistory.filter((p) => p.paymentStatus === 'scheduled')
  const pendingPayments = paymentHistory.filter((p) => p.paymentStatus === 'pending')
  const allPendingPayments = [...pendingPayments, ...scheduledPayments]
  console.log(paymentHistory)

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'partial':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      case 'unpaid':
        return 'bg-red-500/20 text-red-400 border border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(settings?.language, {
      style: 'currency',
      currency: settings?.currency,
      minimumFractionDigits: 0
    }).format(amount)
  }

  const InfoRow = ({
    icon: Icon,
    label,
    value
  }: {
    icon: LucideIcon
    label: string
    value?: string
  }) => (
    <div className="flex items-start gap-3 bg-gray-800/40 rounded-xl p-3 hover:bg-gray-800/70 transition-colors">
      <div className="w-8 h-8 bg-gray-700/60 flex items-center justify-center rounded-lg">
        <Icon className="w-4 h-4 text-gray-300" />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-white">
          {value || <span className="text-gray-500">-</span>}
        </p>
      </div>
    </div>
  )

  return (
    <>
      <PaymentModal
        membershipId={membership.id!}
        memberName={membership.memberName!}
        remainingBalance={membership.remainingBalance}
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          loadPaymentHistory()
          // Notify parent to refresh the membership list
          if (onSuccess) onSuccess()
        }}
      />

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 border border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              <BadgeCheck className="w-6 h-6 text-blue-400" />
              {t('view.title')}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(isActive)}`}
                >
                  {isActive ? t('active') : t('expired')}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(membership.paymentStatus)}`}
                >
                  {t(`paymentStatus.${membership.paymentStatus}`)}
                </span>
              </div>

              {hasOutstandingBalance && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-yellow-500">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {t('payment.balance')}: {formatCurrency(membership.remainingBalance)}
                    </span>
                  </div>
                  {hasPermission(PERMISSIONS.memberships.add_payment) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPaymentModalOpen(true)}
                    >
                      {t('payment.addPayment')}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className={`grid w-full ${hasPermission(PERMISSIONS.memberships.view_payments) ? 'grid-cols-3' : 'grid-cols-1'} bg-gray-800`}>
                <TabsTrigger value="details">{t('view.details')}</TabsTrigger>
                {hasPermission(PERMISSIONS.memberships.view_payments) && (
                  <>
                    <TabsTrigger value="completed">
                      {t('view.completedPayments')} ({completedPayments.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      {t('view.pendingPayments')} ({allPendingPayments.length})
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="details" className="space-y-6 mt-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {t('view.memberInfo')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow icon={User} label={t('table.member')} value={membership.memberName} />
                    <InfoRow
                      icon={Phone}
                      label={t('form.phone')}
                      value={`${membership.memberCountryCode}${membership.memberPhone}`}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5" />
                    {t('view.planInfo')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow
                      icon={BadgeCheck}
                      label={t('table.plan')}
                      value={membership.planName}
                    />
                    <InfoRow
                      icon={Wallet}
                      label={t('form.price')}
                      value={formatCurrency(membership.planPrice!)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {t('view.dates')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow
                      icon={Calendar}
                      label={t('table.startDate')}
                      value={new Date(membership.startDate).toLocaleDateString()}
                    />
                    <InfoRow
                      icon={Calendar}
                      label={t('table.endDate')}
                      value={
                        membership.isPaused && !membership.pauseDurationDays
                          ? t('endDateTbd')
                          : new Date(membership.endDate).toLocaleDateString()
                      }
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    {t('view.paymentInfo')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow
                      icon={Wallet}
                      label={t('payment.totalPrice')}
                      value={formatCurrency(membership.totalPrice)}
                    />
                    <InfoRow
                      icon={Wallet}
                      label={t('table.amountPaid')}
                      value={formatCurrency(membership.amountPaid)}
                    />
                    <InfoRow
                      icon={Wallet}
                      label={t('payment.remainingBalance')}
                      value={formatCurrency(membership.remainingBalance)}
                    />
                    <InfoRow
                      icon={CreditCard}
                      label={t('payment.status')}
                      value={t(`paymentStatus.${membership.paymentStatus}`)}
                    />
                  </div>
                </div>

                {membership.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {t('form.notes')}
                    </h3>
                    <div className="space-y-3">
                      <InfoRow icon={FileText} label={t('form.notes')} value={membership.notes} />
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Completed Payments Tab */}
              {hasPermission(PERMISSIONS.memberships.view_payments) && (
                <TabsContent value="completed" className="space-y-6 mt-4">
                {loadingPayments ? (
                  <div className="text-center py-8 text-gray-400">{t('loading')}</div>
                ) : completedPayments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">{t('payment.noPayments')}</div>
                ) : (
                  <div className="space-y-3">
                    {completedPayments.map((payment, idx) => (
                      <div
                        key={payment.id}
                        className="bg-gray-800/40 rounded-xl p-4 hover:bg-gray-800/70 transition-colors border border-gray-700"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-500/20 flex items-center justify-center rounded-lg">
                              <DollarSign className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {t('payment.payment')} #{completedPayments.length - idx}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(payment.paymentDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-green-400">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {t(`paymentMethods.${payment.paymentMethod}`)}
                            </p>
                          </div>
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-gray-400 mt-2 pl-10">{payment.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                </TabsContent>
              )}

              {/* Pending Payments Tab */}
              {hasPermission(PERMISSIONS.memberships.view_payments) && (
                <TabsContent value="pending" className="space-y-6 mt-4">
                {loadingPayments ? (
                  <div className="text-center py-8 text-gray-400">{t('loading')}</div>
                ) : allPendingPayments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {t('payment.noPendingPayments')}
                  </div>
                ) : (
                  <>
                    {/* Pending Payments (No Specific Date) */}
                    {pendingPayments.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold mb-3 text-orange-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {t('payment.pendingPayments')} ({pendingPayments.length})
                        </h4>
                        <div className="space-y-3">
                          {pendingPayments.map((payment, idx) => (
                            <div
                              key={payment.id}
                              className="bg-orange-500/5 rounded-xl p-4 border border-orange-500/30 hover:bg-orange-500/10 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-orange-500/20 flex items-center justify-center rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-orange-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {t('payment.pendingPayment')} #{idx + 1}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {t('payment.noScheduledDate')}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex flex-col gap-2">
                                  <div>
                                    <p className="text-lg font-semibold text-orange-400">
                                      {formatCurrency(payment.amount)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {t(`paymentMethods.${payment.paymentMethod}`)}
                                    </p>
                                  </div>
                                  {hasPermission(PERMISSIONS.memberships.complete_payment) && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleConfirmPayment(payment.id!)}
                                      disabled={completingPayment}
                                      className="text-xs"
                                    >
                                      {t('payment.payNow')}
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {payment.notes && (
                                <p className="text-sm text-gray-400 mt-2 pl-10">{payment.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scheduled Payments (With Specific Dates) */}
                    {scheduledPayments.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold mb-3 text-yellow-400 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {t('payment.scheduledPayments')} ({scheduledPayments.length})
                        </h4>
                        <div className="space-y-3">
                          {scheduledPayments.map((payment, idx) => (
                            <div
                              key={payment.id}
                              className="bg-yellow-500/5 rounded-xl p-4 border border-yellow-500/30 hover:bg-yellow-500/10 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-yellow-500/20 flex items-center justify-center rounded-lg">
                                    <Calendar className="w-4 h-4 text-yellow-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {t('payment.scheduledPayment')} #{idx + 1}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {t('payment.dueDate')}:{' '}
                                      {new Date(payment.paymentDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex flex-col gap-2">
                                  <div>
                                    <p className="text-lg font-semibold text-yellow-400">
                                      {formatCurrency(payment.amount)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {t(`paymentMethods.${payment.paymentMethod}`)}
                                    </p>
                                  </div>
                                  {hasPermission(PERMISSIONS.memberships.complete_payment) && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleConfirmPayment(payment.id!)}
                                      disabled={completingPayment}
                                      className="text-xs"
                                    >
                                      {t('payment.markAsPaid')}
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {payment.notes && (
                                <p className="text-sm text-gray-400 mt-2 pl-10">{payment.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('payment.confirmPayment')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('payment.confirmPaymentDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completingPayment}>{t('form.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteScheduledPayment}
              disabled={completingPayment}
            >
              {completingPayment ? t('payment.processing') : t('form.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
