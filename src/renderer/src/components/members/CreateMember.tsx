import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Member } from '@renderer/models/member'
import { PAYMENT_METHODS } from '@renderer/models/membership'
import MemberForm from './MemberForm'
import { useSearchParams } from 'react-router-dom'

export default function CreateMember({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation('members')
  const { t: tMemberships } = useTranslation('memberships')
  const [searchParams] = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(searchParams.get('action') === 'create')
  const [formData, setFormData] = useState<Partial<Member>>({
    name: '',
    email: null,
    phone: '',
    gender: 'male',
    address: null,
    joinDate: new Date().toISOString().split('T')[0],
    notes: null
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const createdMember = await window.electron.ipcRenderer.invoke('members:create', formData)

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
          memberId: createdMember.id,
          planId: subscriptionData.planId,
          startDate: subscriptionData.startDate,
          endDate: subscriptionData.endDate,
          amountPaid: subscriptionData.amountPaid,
          paymentMethod: subscriptionData.paymentMethod,
          paymentDate: subscriptionData.paymentDate,
          notes: subscriptionData.notes || null
        }

        await window.electron.ipcRenderer.invoke('memberships:create', membershipPayload)
        toast.success(t('success.createSuccessWithSubscription'))
      } else {
        toast.success(t('success.createSuccess'))
      }

      setDialogOpen(false)
      onSuccess()

      setFormData({
        name: '',
        email: null,
        phone: '',
        gender: 'male',
        address: null,
        joinDate: new Date().toISOString().split('T')[0],
        notes: null
      })
      setSubscriptionData({
        planId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        amountPaid: 0,
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setAddSubscription(false)
    } catch (error) {
      if ((error as Error).message.includes('UNIQUE constraint failed: members.phone'))
        toast.warning(t('errors.phoneExists'))
      else if ((error as Error).message.includes('MEMBERSHIP_OVERLAP')) {
        toast.warning(tMemberships('errors.membershipOverlap'))
      } else {
        toast.error(t('errors.createFailed'))
      }
      return
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant="secondary">
          <Plus className="h-4 w-4" /> {t('addNew')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addNew')}</DialogTitle>
        </DialogHeader>
        <MemberForm
          formData={formData}
          setFormData={(data) => setFormData({ ...formData, ...data })}
          onSubmit={handleSubmit}
          onCancel={() => setDialogOpen(false)}
          submitLabel={t('form.submit')}
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
