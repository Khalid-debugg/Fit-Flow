import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { toast } from 'sonner'
import { Plan } from '@renderer/models/plan'
import PlanForm from './PlanForm'

interface EditPlanProps {
  plan: Plan | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditPlan({ plan, open, onClose, onSuccess }: EditPlanProps) {
  const { t } = useTranslation('plans')
  const [formData, setFormData] = useState<Partial<Plan>>({})

  useEffect(() => {
    if (plan) setFormData({ ...plan })
  }, [plan])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan?.id) return
    try {
      await window.electron.ipcRenderer.invoke('plans:update', plan.id, formData)
      toast.success(t('success.updateSuccess'))
      onClose()
      onSuccess()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error(t('errors.updateFailed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{t('editPlan')}</DialogTitle>
        </DialogHeader>
        <PlanForm
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
