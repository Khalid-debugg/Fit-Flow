import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import { Plus } from 'lucide-react'
import { GENDER, Member } from '@renderer/models/member'
import { toast } from 'sonner'

interface CreateMemberProps {
  onSuccess: () => void
}

export default function CreateMember({ onSuccess }: CreateMemberProps) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Member>({
    name: '',
    email: '',
    phone: '',
    gender: 'male',
    status: 'inactive',
    address: '',
    join_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await window.electron.ipcRenderer.invoke('members:create', formData)
      setDialogOpen(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        gender: 'male',
        status: 'inactive',
        address: '',
        join_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      onSuccess()
      toast.success(t('members.success.createSuccess'))
    } catch (error) {
      if (
        (error as Error).message &&
        (error as Error).message.includes('UNIQUE constraint failed: members.phone')
      ) {
        toast.warning(t('members.errors.phoneExists'))
      } else {
        toast.error(t('members.errors.createFailed'))
      }
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant={'secondary'}>
          <Plus className="h-4 w-4" />
          {t('members.addNew')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{t('members.addNew')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-200">
                {t('members.form.name')} *
              </Label>
              <Input
                id="name"
                required
                maxLength={30}
                className="bg-gray-800 border-gray-700 text-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-200">
                {t('members.form.phone')} *
              </Label>
              <Input
                id="phone"
                required
                maxLength={15}
                className="bg-gray-800 border-gray-700 text-white"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="email" className="text-gray-200">
                {t('members.form.email')}
              </Label>
              <Input
                id="email"
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
                  <RadioGroupItem value="male" id="create-male" />
                  <Label htmlFor="create-male" className="text-gray-300 cursor-pointer">
                    {t('members.male')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="create-female" />
                  <Label htmlFor="create-female" className="text-gray-300 cursor-pointer">
                    {t('members.female')}
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address" className="text-gray-200">
                {t('members.form.address')}
              </Label>
              <Input
                id="address"
                className="bg-gray-800 border-gray-700 text-white"
                value={formData.address ?? ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes" className="text-gray-200">
                {t('members.form.notes')}
              </Label>
              <textarea
                id="notes"
                value={formData.notes ?? ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white min-h-20"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="primary" onClick={() => setDialogOpen(false)}>
              {t('members.form.cancel')}
            </Button>
            <Button type="submit" variant={'secondary'}>
              {t('members.form.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
