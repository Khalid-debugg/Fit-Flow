import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Membership } from '@renderer/models/membership'
import {
  Phone,
  Calendar,
  User,
  Wallet,
  CreditCard,
  FileText,
  BadgeCheck,
  LucideIcon
} from 'lucide-react'
import { useSettings } from '@renderer/hooks/useSettings'

interface ViewMembershipProps {
  membership: Membership | null
  open: boolean
  onClose: () => void
}

export default function ViewMembership({ membership, open, onClose }: ViewMembershipProps) {
  const { t } = useTranslation('memberships')
  const { settings } = useSettings()
  const today = new Date().toISOString().split('T')[0]

  if (!membership) return null

  const isActive = membership.endDate >= today

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2 mt-6">
            <BadgeCheck className="w-6 h-6 text-blue-400" />
            {t('view.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-8">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(isActive)}`}
            >
              {isActive ? t('active') : t('expired')}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('view.memberInfo')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={User} label={t('table.member')} value={membership.memberName} />
              <InfoRow icon={Phone} label={t('form.phone')} value={membership.memberPhone} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5" />
              {t('view.planInfo')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={BadgeCheck} label={t('table.plan')} value={membership.planName} />
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
                value={new Date(membership.endDate).toLocaleDateString()}
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
                label={t('table.amountPaid')}
                value={formatCurrency(membership.amountPaid)}
              />
              <InfoRow
                icon={CreditCard}
                label={t('table.paymentMethod')}
                value={t(`paymentMethods.${membership.paymentMethod}`)}
              />
              <InfoRow
                icon={Calendar}
                label={t('form.paymentDate')}
                value={new Date(membership.paymentDate).toLocaleDateString()}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
