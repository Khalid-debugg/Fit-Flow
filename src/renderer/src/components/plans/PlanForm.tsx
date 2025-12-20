import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { Plan, PLAN_TYPES } from '@renderer/models/plan'
import { Checkbox } from '../ui/checkbox'
import { Textarea } from '../ui/textarea'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { useSettings } from '@renderer/hooks/useSettings'

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
  const { settings } = useSettings()
  const [planType, setPlanType] = useState<string>(formData.planType || 'duration')

  const handlePlanTypeChange = (type: string) => {
    setPlanType(type)
    const updates: Partial<Plan> = {
      ...formData,
      planType: type as Plan['planType']
    }

    updates.durationDays = formData.durationDays || null
    updates.checkInLimit = type === 'checkin' ? formData.checkInLimit || 8 : null

    setFormData(updates)
  }

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
        <Textarea
          id="description"
          value={formData.description ?? ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white min-h-20"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-gray-200">{t('form.planType')} *</Label>
        <RadioGroup value={planType} onValueChange={handlePlanTypeChange} className="flex gap-4">
          {PLAN_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-2 rtl:flex-row-reverse">
              <RadioGroupItem value={type} id={`plan-type-${type}`} />
              <Label htmlFor={`plan-type-${type}`} className="text-gray-300 cursor-pointer">
                {t(`planTypes.${type}`)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price" className="text-gray-200">
            {t('form.price')} ({settings?.currency}) *
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
            onChange={(e) => {
              const value = e.target.value
              setFormData({ ...formData, price: value === '' ? undefined : parseFloat(value) })
            }}
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
            onChange={(e) => {
              const value = e.target.value
              setFormData({ ...formData, durationDays: value === '' ? undefined : parseInt(value) })
            }}
          />
        </div>

        {planType === 'checkin' && (
          <div className="space-y-2">
            <Label htmlFor="checkInLimit" className="text-gray-200">
              {t('form.checkInLimit')} *
            </Label>
            <Input
              id="checkInLimit"
              type="number"
              min="1"
              required
              placeholder="8"
              className="bg-gray-800 border-gray-700 text-white"
              value={formData.checkInLimit ?? ''}
              onChange={(e) => {
                const value = e.target.value
                setFormData({
                  ...formData,
                  checkInLimit: value === '' ? undefined : parseInt(value)
                })
              }}
            />
          </div>
        )}
        <div className="space-y-2 flex items-center self-end gap-2">
          <Label htmlFor="offer" className="text-gray-200">
            {t('filters.offer')}
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
