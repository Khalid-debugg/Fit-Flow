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
import MembershipForm from './MembershipForm'
import { useSearchParams } from 'react-router-dom'

interface CreateMembershipProps {
  onSuccess: () => void
  preSelectedMemberId?: string
}

export default function CreateMembership({
  onSuccess,
  preSelectedMemberId
}: CreateMembershipProps) {
  const { t } = useTranslation('memberships')
  const [searchParams] = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(searchParams.get('action') === 'create')
  const [formData, setFormData] = useState<Partial<Membership>>({
    paymentMethod: 'cash',
    startDate: new Date().toISOString().split('T')[0],
    paymentDate: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      await window.electron.ipcRenderer.invoke('memberships:create', formData)
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
      <DialogTrigger asChild>
        <Button className="gap-2" variant="secondary">
          <Plus className="h-4 w-4" /> {t('addNew')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('create.title')}</DialogTitle>
        </DialogHeader>
        <MembershipForm
          formData={formData}
          setFormData={(data) => setFormData({ ...formData, ...data })}
          onSubmit={handleSubmit}
          onCancel={() => setDialogOpen(false)}
          submitLabel={t('form.submit')}
          preSelectedMemberId={preSelectedMemberId}
        />
      </DialogContent>
    </Dialog>
  )
}
