import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Member } from '@renderer/models/member'
import { User, Phone, Calendar, AlertCircle, CheckCircle } from 'lucide-react'

interface MemberCheckInCardProps {
  member: Member
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

export default function MemberCheckInCard({
  member,
  open,
  onConfirm,
  onCancel,
  loading
}: MemberCheckInCardProps) {
  const { t } = useTranslation('checkIns')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'expired':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-red-500/20 text-red-400 border-red-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const getDaysInfo = () => {
    if (!member.currentMembership) return null

    const today = new Date().toISOString().split('T')[0]
    const endDate = new Date(member.currentMembership.endDate)
    const todayDate = new Date(today)
    const diffTime = endDate.getTime() - todayDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (member.status === 'active') {
      return `${diffDays} ${t('messages.daysRemaining')}`
    } else if (member.status === 'expired') {
      return `${t('messages.expired')} ${Math.abs(diffDays)} ${t('messages.daysAgo')}`
    }

    return null
  }

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('confirm')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-700/60 flex items-center justify-center rounded-lg">
                <User className="w-5 h-5 text-gray-300" />
              </div>
              <div>
                <p className="text-sm text-gray-400">{t('memberName')}</p>
                <p className="text-lg font-semibold text-white">{member.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-700/60 flex items-center justify-center rounded-lg">
                <Phone className="w-5 h-5 text-gray-300" />
              </div>
              <div>
                <p className="text-sm text-gray-400">{t('phone')}</p>
                <p className="text-lg font-medium text-white">{member.phone}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{t('membershipStatus')}</span>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(member.status)}`}
              >
                {getStatusIcon(member.status)}
                {t(`status.${member.status}`)}
              </div>
            </div>

            {member.currentMembership && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-400">
                  <span>{t('plan')}:</span>
                  <span className="text-white font-medium">
                    {member.currentMembership.planName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>{t('endDate')}:</span>
                  <span className="text-white font-medium">
                    {new Date(member.currentMembership.endDate).toLocaleDateString()}
                  </span>
                </div>
                {getDaysInfo() && (
                  <div className="flex items-center gap-2 pt-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{getDaysInfo()}</span>
                  </div>
                )}
              </div>
            )}

            {member.status === 'inactive' && (
              <p className="text-sm text-red-400 mt-2">{t('messages.noMembership')}</p>
            )}
          </div>

          {(member.status === 'expired' || member.status === 'inactive' || member.alreadyCheckedIn) && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-200">
                {member.alreadyCheckedIn
                  ? t('messages.alreadyCheckedInWarning', { time: member.checkInTime })
                  : member.status === 'expired'
                    ? t('messages.expiredWarning')
                    : t('messages.noMembershipWarning')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="primary" onClick={onCancel} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button variant="secondary" onClick={onConfirm} disabled={loading}>
            {loading ? t('processing') : t('confirmCheckIn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
