import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { GENDER, Member } from '@renderer/models/member'
import { toast } from 'sonner'

interface EditMemberProps {
  member: Member | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

export default function EditMember({ member, open, onClose, onSuccess }: EditMemberProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<Partial<Member>>({
    name: '',
    email: '',
    phone: '',
    gender: 'male',
    address: '',
    notes: ''
  })

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        email: member.email ?? '',
        phone: member.phone,
        gender: member.gender,
        address: member.address ?? '',
        notes: member.notes ?? ''
      })
    }
  }, [member])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!member?.id) return

    try {
      await window.electron.ipcRenderer.invoke('members:update', member.id, formData)
      onClose()
      onSuccess()
      toast.success(t('members.success.updateSuccess'))
    } catch (error) {
      if (
        (error as Error).message &&
        (error as Error).message.includes('UNIQUE constraint failed: members.phone')
      ) {
        toast.warning(t('members.errors.phoneExists'))
      } else {
        toast.error(t('members.errors.updateFailed'))
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{t('members.editMember')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-gray-200">
                {t('members.form.name')} *
              </Label>
              <Input
                id="edit-name"
                required
                className="bg-gray-800 border-gray-700 text-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="text-gray-200">
                {t('members.form.phone')} *
              </Label>
              <Input
                id="edit-phone"
                required
                className="bg-gray-800 border-gray-700 text-white"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-email" className="text-gray-200">
                {t('members.form.email')}
              </Label>
              <Input
                id="edit-email"
                type="email"
                className="bg-gray-800 border-gray-700 text-white"
                value={formData.email ?? ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label className="text-gray-200">{t('members.form.gender')} *</Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value as (typeof GENDER)[number] })
                }
                className="flex gap-4 rtl:flex-row-reverse"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="edit-male" />
                  <Label htmlFor="edit-male" className="text-gray-300 cursor-pointer">
                    {t('members.male')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="edit-female" />
                  <Label htmlFor="edit-female" className="text-gray-300 cursor-pointer">
                    {t('members.female')}
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-address" className="text-gray-200">
                {t('members.form.address')}
              </Label>
              <Input
                id="edit-address"
                className="bg-gray-800 border-gray-700 text-white"
                value={formData.address ?? ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-notes" className="text-gray-200">
                {t('members.form.notes')}
              </Label>
              <textarea
                id="edit-notes"
                value={formData.notes ?? ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white min-h-20"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="primary" onClick={onClose}>
              {t('members.form.cancel')}
            </Button>
            <Button type="submit" variant="secondary">
              {t('members.form.update')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
