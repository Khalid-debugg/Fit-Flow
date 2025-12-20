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
import { Membership } from '@renderer/models/membership'
import { PERMISSIONS } from '@renderer/models/account'
import MembershipForm from './MembershipForm'
import { useSearchParams } from 'react-router-dom'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAuth } from '@renderer/hooks/useAuth'

interface CreateMembershipProps {
  onSuccess: () => void
  preSelectedMemberId?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function CreateMembership({
  onSuccess,
  preSelectedMemberId,
  open,
  onOpenChange
}: CreateMembershipProps) {
  const { t } = useTranslation('memberships')
  const { hasPermission } = useAuth()
  const [searchParams] = useSearchParams()
  const { settings } = useSettings()
  const [internalOpen, setInternalOpen] = useState(searchParams.get('action') === 'create')

  // Use external control if provided, otherwise use internal state
  const dialogOpen = open !== undefined ? open : internalOpen
  const setDialogOpen = onOpenChange || setInternalOpen
  const [formData, setFormData] = useState<Partial<Membership>>({
    paymentMethod: settings?.defaultPaymentMethod || 'cash',
    startDate: new Date().toISOString().split('T')[0],
    paymentDate: new Date().toISOString().split('T')[0],
    isCustom: false,
    remainingBalance: 0,
    paymentStatus: 'paid'
  })

  const handleSubmit = async (e: React.FormEvent, finalData?: Partial<Membership>) => {
    e.preventDefault()

    if (!hasPermission(PERMISSIONS.memberships.create)) {
      toast.error(t('errors.noPermission'))
      return
    }

    // Use finalData if provided (from form), otherwise use formData
    const dataToSubmit = finalData || formData

    if (
      !dataToSubmit.memberId ||
      !dataToSubmit.planId ||
      !dataToSubmit.startDate ||
      !dataToSubmit.endDate ||
      dataToSubmit.totalPrice === undefined ||
      dataToSubmit.amountPaid === undefined ||
      !dataToSubmit.paymentMethod ||
      !dataToSubmit.paymentDate
    ) {
      toast.error(t('errors.requiredFields'))
      return
    }

    try {
      await window.electron.ipcRenderer.invoke('memberships:create', dataToSubmit)
      toast.success(t('success.createSuccess'))
      setDialogOpen(false)
      onSuccess()
      setFormData({
        paymentMethod: 'cash',
        startDate: new Date().toISOString().split('T')[0],
        paymentDate: new Date().toISOString().split('T')[0]
      })
    } catch (error) {
      if ((error as Error).message.includes('MEMBERSHIP_OVERLAP')) {
        toast.warning(t('errors.membershipOverlap'))
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
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('create.title')}</DialogTitle>
        </DialogHeader>
        <MembershipForm
          formData={formData}
          setFormData={(data) => setFormData(prev => ({ ...prev, ...data }))}
          onSubmit={handleSubmit}
          onCancel={() => setDialogOpen(false)}
          submitLabel={t('form.submit')}
          preSelectedMemberId={preSelectedMemberId}
        />
      </DialogContent>
    </Dialog>
  )
}
