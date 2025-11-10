import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { toast } from 'sonner'
import { Membership } from '@renderer/models/membership'
import MembershipForm from './MembershipForm'

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
  const [formData, setFormData] = useState<Partial<Membership>>({})

  useEffect(() => {
    if (membership) setFormData({ ...membership })
  }, [membership])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!membership?.id) return

    if (
      !formData.memberId ||
      !formData.planId ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.amountPaid ||
      !formData.paymentMethod ||
      !formData.paymentDate
    ) {
      toast.error(t('errors.requiredFields'))
      return
    }

    try {
      await window.electron.ipcRenderer.invoke('memberships:update', membership.id, formData)
      toast.success(t('success.updateSuccess'))
      onClose()
      onSuccess()
    } catch (error) {
      console.error('Failed to update membership:', error)
      toast.error(t('errors.updateFailed'))
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
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel={t('form.update')}
        />
      </DialogContent>
    </Dialog>
  )
}
