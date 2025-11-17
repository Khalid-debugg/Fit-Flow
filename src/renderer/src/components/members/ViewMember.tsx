import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Member } from '@renderer/models/member'
import {
  Phone,
  Mail,
  Calendar,
  User,
  MapPin,
  FileText,
  BadgeCheck,
  Wallet,
  LucideIcon
} from 'lucide-react'
import MemberBarcodeCard from '../checkIns/MemberBarcodeCard'

interface ViewMemberProps {
  member: Member | null
  open: boolean
  onClose: () => void
}

export default function ViewMember({ member, open, onClose }: ViewMemberProps) {
  const { t } = useTranslation('members')

  if (!member) return null

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400 border border-green-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    }
    return colors[status] || colors.inactive
  }

  const InfoRow = ({
    icon: Icon,
    label,
    value
  }: {
    icon: LucideIcon
    label: string
    value: string | number | null
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
      <DialogContent className="bg-gray-900 border border-gray-700 text-white min-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2 mt-6">
            <User className="w-6 h-6 text-blue-400" />
            {member.name}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-8">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5" />
              {t('basicInfo')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={Phone} label={t('phone')} value={member.phone} />
              <InfoRow icon={Mail} label={t('email')} value={member.email} />
              <InfoRow
                icon={User}
                label={t('gender')}
                value={member.gender ? t(`${member.gender}`) : '-'}
              />
              <InfoRow
                icon={Calendar}
                label={t('joinDate')}
                value={new Date(member.joinDate).toLocaleDateString()}
              />
              <div className="col-span-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                    member.status
                  )}`}
                >
                  {t(`${member.status}`)}
                </span>
              </div>
            </div>
          </div>

          {/* Address / Notes */}
          {(member.address || member.notes) && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t('details')}
              </h3>
              <div className="space-y-3">
                {member.address && (
                  <InfoRow icon={MapPin} label={t('form.address')} value={member.address} />
                )}
                {member.notes && (
                  <InfoRow icon={FileText} label={t('form.notes')} value={member.notes} />
                )}
              </div>
            </div>
          )}

          {/* Membership */}
          {member.currentMembership && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                {t('currentMembership')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow
                  icon={BadgeCheck}
                  label={t('membershipPlan')}
                  value={member.currentMembership.planName}
                />
                <InfoRow
                  icon={Wallet}
                  label={t('price')}
                  value={`$${member.currentMembership.planPrice}`}
                />
                <InfoRow
                  icon={Calendar}
                  label={t('startDate')}
                  value={new Date(member.currentMembership.startDate).toLocaleDateString()}
                />
                <InfoRow
                  icon={Calendar}
                  label={t('endDate')}
                  value={new Date(member.currentMembership.endDate).toLocaleDateString()}
                />
              </div>
            </div>
          )}
        </div>
        <div>
          <MemberBarcodeCard
            memberId={member.id!.toString()}
            memberName={member.name}
            joinDate={member.joinDate}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
