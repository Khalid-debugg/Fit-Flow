import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { toast } from 'sonner'
import { Member } from '@renderer/models/member'
import { PAYMENT_METHODS } from '@renderer/models/membership'
import MemberForm from './MemberForm'

interface EditMemberProps {
  member: Member | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditMember({ member, open, onClose, onSuccess }: EditMemberProps) {
  const { t } = useTranslation('members')
  const { t: tMemberships } = useTranslation('memberships')
  const [formData, setFormData] = useState<Partial<Member>>({})
  const [subscriptionData, setSubscriptionData] = useState({
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    amountPaid: 0,
    paymentMethod: 'cash' as (typeof PAYMENT_METHODS)[number],
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [addSubscription, setAddSubscription] = useState(false)

  useEffect(() => {
    if (member) {
      setFormData({ ...member })

      if (member.currentMembership) {
        const today = new Date().toISOString().split('T')[0]
        const isActive = member.currentMembership.endDate >= today

        const startDate = isActive
          ? new Date(new Date(member.currentMembership.endDate).getTime() + 86400000)
              .toISOString()
              .split('T')[0]
          : new Date().toISOString().split('T')[0]

        setSubscriptionData({
          planId: '',
          startDate,
          endDate: '',
          amountPaid: 0,
          paymentMethod: 'cash',
          paymentDate: new Date().toISOString().split('T')[0],
          notes: ''
        })
      }

      setAddSubscription(false)
    }
  }, [member])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!member?.id) return

    try {
      await window.electron.ipcRenderer.invoke('members:update', member.id, formData)

      if (addSubscription && subscriptionData.planId) {
        if (
          !subscriptionData.startDate ||
          !subscriptionData.endDate ||
          !subscriptionData.amountPaid ||
          !subscriptionData.paymentMethod ||
          !subscriptionData.paymentDate
        ) {
          toast.error(tMemberships('errors.requiredFields'))
          return
        }

        const membershipPayload = {
          memberId: member.id.toString(),
          planId: subscriptionData.planId,
          startDate: subscriptionData.startDate,
          endDate: subscriptionData.endDate,
          amountPaid: subscriptionData.amountPaid,
          paymentMethod: subscriptionData.paymentMethod,
          paymentDate: subscriptionData.paymentDate,
          notes: subscriptionData.notes || null
        }

        await window.electron.ipcRenderer.invoke('memberships:create', membershipPayload)
        toast.success(t('success.updateSuccessWithSubscription'))
      } else {
        toast.success(t('success.updateSuccess'))
      }

      onClose()
      onSuccess()
    } catch (error) {
      if ((error as Error).message.includes('UNIQUE constraint failed: members.phone'))
        toast.warning(t('errors.phoneExists'))
      else if ((error as Error).message === 'MEMBERSHIP_OVERLAP') {
        toast.warning(tMemberships('errors.membershipOverlap'))
      } else {
        toast.error(t('errors.updateFailed'))
      }
      return
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editMember')}</DialogTitle>
        </DialogHeader>
        <MemberForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel={t('form.update')}
          showSubscription={true}
          subscriptionData={subscriptionData}
          onSubscriptionChange={setSubscriptionData}
          addSubscription={addSubscription}
          onAddSubscriptionChange={setAddSubscription}
        />
      </DialogContent>
    </Dialog>
  )
}
