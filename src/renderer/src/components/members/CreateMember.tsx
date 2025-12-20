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
import MemberForm, { type SubscriptionData } from './MemberForm'
import { useSearchParams } from 'react-router-dom'
import { useSettings } from '@renderer/hooks/useSettings'

interface CreateMemberProps {
  onSuccess: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function CreateMember({ onSuccess, open, onOpenChange }: CreateMemberProps) {
  const { t } = useTranslation('members')
  const { t: tMemberships } = useTranslation('memberships')
  const { settings } = useSettings()
  const [searchParams] = useSearchParams()
  const [internalOpen, setInternalOpen] = useState(searchParams.get('action') === 'create')

  // Use external control if provided, otherwise use internal state
  const dialogOpen = open !== undefined ? open : internalOpen
  const setDialogOpen = onOpenChange || setInternalOpen
  const [formData, setFormData] = useState<Partial<Member>>({
    name: '',
    email: null,
    countryCode: '+20',
    phone: '',
    gender: settings?.allowedGenders === 'female' ? 'female' : 'male',
    address: null,
    joinDate: new Date().toISOString().split('T')[0],
    notes: null
  })

  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    totalPrice: 0,
    amountPaid: 0,
    remainingBalance: 0,
    paymentStatus: 'unpaid' as 'unpaid' | 'partial' | 'paid',
    paymentMethod: 'cash' as (typeof PAYMENT_METHODS)[number],
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    priceModifierType: null,
    priceModifierValue: null,
    customPriceName: null,
    scheduledPayments: undefined
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
          totalPrice: subscriptionData.totalPrice || 0,
          amountPaid: subscriptionData.amountPaid,
          remainingBalance: subscriptionData.remainingBalance || 0,
          paymentStatus: subscriptionData.paymentStatus,
          paymentMethod: subscriptionData.paymentMethod,
          paymentDate: subscriptionData.paymentDate,
          notes: subscriptionData.notes || null,
          priceModifierType: subscriptionData.priceModifierType,
          priceModifierValue: subscriptionData.priceModifierValue,
          customPriceName: subscriptionData.customPriceName,
          scheduledPayments: subscriptionData.scheduledPayments
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
        countryCode: '+20',
        phone: '',
        gender: settings?.allowedGenders === 'female' ? 'female' : 'male',
        address: null,
        joinDate: new Date().toISOString().split('T')[0],
        notes: null
      })
      setSubscriptionData({
        planId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        totalPrice: 0,
        amountPaid: 0,
        remainingBalance: 0,
        paymentStatus: 'unpaid',
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
        priceModifierType: null,
        priceModifierValue: null,
        customPriceName: null,
        scheduledPayments: undefined
      })
      setAddSubscription(false)
    } catch (error) {
      if ((error as Error).message.includes('UNIQUE constraint failed: members.phone'))
        toast.warning(t('errors.phoneExists'))
      else if ((error as Error).message.includes('MEMBERSHIP_OVERLAP')) {
        toast.warning(tMemberships('errors.membershipOverlap'))
      } else if ((error as Error).message.includes('ID_ALREADY_EXISTS')) {
        toast.error(t('errors.idExists'))
      } else {
        toast.error(t('errors.createFailed'))
      }
      return
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {open === undefined && (
        <DialogTrigger asChild>
          <Button className="gap-2" variant="secondary">
            <Plus className="h-4 w-4" /> {t('addNew')}
          </Button>
        </DialogTrigger>
      )}
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
          onSubscriptionChange={(data) => setSubscriptionData({ ...subscriptionData, ...data })}
          addSubscription={addSubscription}
          onAddSubscriptionChange={setAddSubscription}
          isCreateMode={true}
        />
      </DialogContent>
    </Dialog>
  )
}
