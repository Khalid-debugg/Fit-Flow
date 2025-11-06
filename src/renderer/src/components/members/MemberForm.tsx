import { useTranslation } from 'react-i18next'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Button } from '@renderer/components/ui/button'
import { GENDER, Member } from '@renderer/models/member'

interface MemberFormProps {
  formData: Partial<Member>
  setFormData: (data: Partial<Member>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitLabel: string
}

export default function MemberForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  submitLabel
}: MemberFormProps) {
  const { t } = useTranslation('members')

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-200">
            {t('form.name')} *
          </Label>
          <Input
            id="name"
            required
            maxLength={30}
            className="bg-gray-800 border-gray-700 text-white"
            value={formData.name ?? ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-gray-200">
            {t('form.phone')} *
          </Label>
          <Input
            id="phone"
            required
            type="number"
            maxLength={15}
            className="bg-gray-800 border-gray-700 text-white"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="email" className="text-gray-200">
            {t('form.email')}
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
          <Label htmlFor="join-date" className="text-gray-200">
            {t('joinDate')} *
          </Label>
          <Input
            id="join-date"
            type="date"
            required
            className="bg-gray-800 border-gray-700 text-white"
            value={formData.joinDate ?? ''}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label className="text-gray-200">{t('form.gender')} *</Label>
          <RadioGroup
            value={formData.gender}
            onValueChange={(value) =>
              setFormData({ ...formData, gender: value as (typeof GENDER)[number] })
            }
            className="flex gap-4 rtl:flex-row-reverse"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="text-gray-300 cursor-pointer">
                {t('male')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="text-gray-300 cursor-pointer">
                {t('female')}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="address" className="text-gray-200">
            {t('form.address')}
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
            {t('form.notes')}
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
        <Button type="button" variant="primary" onClick={onCancel}>
          {t('form.cancel')}
        </Button>
        <Button type="submit" variant="secondary">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
