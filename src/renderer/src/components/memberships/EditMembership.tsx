import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { toast } from 'sonner'
import { Membership } from '@renderer/models/membership'
import { PERMISSIONS } from '@renderer/models/account'
import MembershipForm from './MembershipForm'
import { useAuth } from '@renderer/hooks/useAuth'

interface EditMembershipProps {
  membership: Membership | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditMembership({
  membership,
  open,
  onClose,
  onSuccess
}: EditMembershipProps) {
  const { t } = useTranslation('memberships')
  const { hasPermission } = useAuth()
  const [formData, setFormData] = useState<Partial<Membership>>({})

  useEffect(() => {
    if (membership) setFormData({ ...membership })
  }, [membership])

  const handleSubmit = async (e: React.FormEvent, finalData?: Partial<Membership>) => {
    e.preventDefault()
    if (!membership?.id) return

    if (!hasPermission(PERMISSIONS.memberships.edit)) {
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
      await window.electron.ipcRenderer.invoke('memberships:update', membership.id, dataToSubmit)
      toast.success(t('success.updateSuccess'))
      onClose()
      onSuccess()
    } catch (error) {
      if ((error as Error).message.includes('MEMBERSHIP_OVERLAP')) {
        toast.warning(t('errors.membershipOverlap'))
      } else {
        toast.error(t('errors.updateFailed'))
      }
      return
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('edit.title')}</DialogTitle>
        </DialogHeader>
        <MembershipForm
          formData={formData}
          setFormData={(data) => setFormData(prev => ({ ...prev, ...data }))}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel={t('form.update')}
        />
      </DialogContent>
    </Dialog>
  )
}
