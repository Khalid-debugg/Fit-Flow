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
import { Plan } from '@renderer/models/plan'
import PlanForm from './PlanForm'

export default function CreatePlan({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation('plans')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Plan>({
    name: '',
    description: '',
    price: 0,
    durationDays: 30,
    isOffer: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await window.electron.ipcRenderer.invoke('plans:create', formData)
      toast.success(t('success.createSuccess'))
      setDialogOpen(false)
      onSuccess()
      setFormData({
        name: '',
        description: '',
        price: 0,
        durationDays: 30,
        isOffer: false
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error(t('errors.createFailed'))
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant="secondary">
          <Plus className="h-4 w-4" /> {t('addNew')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addNew')}</DialogTitle>
        </DialogHeader>
        <PlanForm
          formData={formData}
          setFormData={(data) => setFormData({ ...formData, ...data })}
          onSubmit={handleSubmit}
          onCancel={() => setDialogOpen(false)}
          submitLabel={t('form.submit')}
        />
      </DialogContent>
    </Dialog>
  )
}
