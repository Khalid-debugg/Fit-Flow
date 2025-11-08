import { useTranslation } from 'react-i18next'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { Plan } from '@renderer/models/plan'
import { Checkbox } from '../ui/checkbox'

interface PlanFormProps {
  formData: Partial<Plan>
  setFormData: (data: Partial<Plan>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitLabel: string
}

export default function PlanForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  submitLabel
}: PlanFormProps) {
  const { t } = useTranslation('plans')

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-200">
          {t('form.name')} *
        </Label>
        <Input
          id="name"
          required
          maxLength={50}
          className="bg-gray-800 border-gray-700 text-white"
          value={formData.name ?? ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-200">
          {t('form.description')}
        </Label>
        <textarea
          id="description"
          value={formData.description ?? ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white min-h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price" className="text-gray-200">
            {t('form.price')} *
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="50.00"
            className="bg-gray-800 border-gray-700 text-white"
            value={formData.price ?? ''}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration" className="text-gray-200">
            {t('form.duration')} *
          </Label>
          <Input
            id="duration"
            type="number"
            min="1"
            required
            placeholder="30"
            className="bg-gray-800 border-gray-700 text-white"
            value={formData.durationDays ?? ''}
            onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) })}
          />
        </div>
        <div className="space-y-2 flex gap-2">
          <Label htmlFor="duration" className="text-gray-200">
            {t('filters.offer')} *
          </Label>
          <Checkbox
            id="offer"
            checked={formData.isOffer}
            onCheckedChange={(e) => {
              setFormData({ ...formData, isOffer: e.valueOf() as boolean })
            }}
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
