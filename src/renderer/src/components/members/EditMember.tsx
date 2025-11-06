import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { toast } from 'sonner'
import { Member } from '@renderer/models/member'
import MemberForm from './MemberForm'

interface EditMemberProps {
  member: Member | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditMember({ member, open, onClose, onSuccess }: EditMemberProps) {
  const { t } = useTranslation('members')
  const [formData, setFormData] = useState<Partial<Member>>({})

  useEffect(() => {
    if (member) setFormData({ ...member })
  }, [member])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!member?.id) return
    try {
      await window.electron.ipcRenderer.invoke('members:update', member.id, formData)
      toast.success(t('success.updateSuccess'))
      onClose()
      onSuccess()
    } catch (error) {
      if ((error as Error).message.includes('UNIQUE constraint failed: phone'))
        toast.warning(t('errors.phoneExists'))
      else toast.error(t('errors.updateFailed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editMember')}</DialogTitle>
        </DialogHeader>
        <MemberForm
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
