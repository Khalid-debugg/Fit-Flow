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
import MemberForm from './MemberForm'

export default function CreateMember({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation('members')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Member>({
    name: '',
    email: '',
    phone: '',
    gender: 'male',
    status: 'inactive',
    address: '',
    joinDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await window.electron.ipcRenderer.invoke('members:create', formData)
      toast.success(t('success.createSuccess'))
      setDialogOpen(false)
      onSuccess()
      setFormData({
        name: '',
        email: '',
        phone: '',
        gender: 'male',
        status: 'inactive',
        address: '',
        joinDate: new Date().toISOString().split('T')[0],
        notes: ''
      })
    } catch (error) {
      if ((error as Error).message.includes('UNIQUE constraint failed: phone'))
        toast.warning(t('errors.phoneExists'))
      else toast.error(t('errors.createFailed'))
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
          <DialogTitle>{t('addNew')}</DialogTitle>
        </DialogHeader>
        <MemberForm
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
