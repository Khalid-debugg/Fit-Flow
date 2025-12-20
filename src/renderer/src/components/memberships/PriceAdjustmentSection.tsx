import { useTranslation } from 'react-i18next'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { PRICE_MODIFIER_TYPES, type PriceModifierType } from '@renderer/models/membership'
import { useSettings } from '@renderer/hooks/useSettings'

interface PriceAdjustmentSectionProps {
  usePlanPrice: boolean
  onUsePlanPriceChange: (usePlan: boolean) => void
  priceModifierType?: PriceModifierType | null
  priceModifierValue?: number | null
  customPriceName?: string | null
  onPriceModifierChange: (type: PriceModifierType, value?: number) => void
  onCustomPriceNameChange: (name: string) => void
  basePrice: number
  finalPrice: number
}

export default function PriceAdjustmentSection({
  usePlanPrice,
  onUsePlanPriceChange,
  priceModifierType,
  priceModifierValue,
  customPriceName,
  onPriceModifierChange,
  onCustomPriceNameChange,
  basePrice,
  finalPrice
}: PriceAdjustmentSectionProps) {
  const { t } = useTranslation('memberships')
  const { settings } = useSettings()

  return (
    <div className="space-y-4 col-span-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <Label className="text-gray-200">{t('form.priceModifierType')}</Label>
      <RadioGroup
        value={usePlanPrice ? 'plan' : 'adjust'}
        onValueChange={(value) => onUsePlanPriceChange(value === 'plan')}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="plan" id="price-plan" />
          <Label htmlFor="price-plan" className="text-gray-300 cursor-pointer">
            {t('form.usePlanPrice')}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="adjust" id="price-adjust" />
          <Label htmlFor="price-adjust" className="text-gray-300 cursor-pointer">
            {t('form.adjustPrice')}
          </Label>
        </div>
      </RadioGroup>

      {!usePlanPrice && (
        <div className="space-y-4 mt-4 pl-4 border-l-2 border-gray-600">
          <div className="space-y-2">
            <Label className="text-gray-200">{t('form.priceModifierType')} *</Label>
            <Select
              value={priceModifierType || ''}
              onValueChange={(value) => onPriceModifierChange(value as PriceModifierType)}
            >
              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                <SelectValue placeholder={t('form.selectPlan')} />
              </SelectTrigger>
              <SelectContent>
                {PRICE_MODIFIER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`priceModifierTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {priceModifierType && (
            <>
              {priceModifierType === 'multiplier' && (
                <div className="space-y-2">
                  <Label htmlFor="multiplierValue" className="text-gray-200">
                    {t('form.multiplierValue')} *
                  </Label>
                  <Input
                    id="multiplierValue"
                    type="number"
                    step="0.01"
                    min="0"
                    className="bg-gray-900 border-gray-600 text-white"
                    value={priceModifierValue || ''}
                    onChange={(e) =>
                      onPriceModifierChange(priceModifierType, parseFloat(e.target.value) || 0)
                    }
                    placeholder="1.5"
                  />
                  <p className="text-xs text-gray-400">{t('form.multiplierHint')}</p>
                </div>
              )}

              {priceModifierType === 'discount' && (
                <div className="space-y-2">
                  <Label htmlFor="discountPercentage" className="text-gray-200">
                    {t('form.discountPercentage')} *
                  </Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    className="bg-gray-900 border-gray-600 text-white"
                    value={priceModifierValue || ''}
                    onChange={(e) =>
                      onPriceModifierChange(priceModifierType, parseFloat(e.target.value) || 0)
                    }
                    placeholder="20"
                  />
                  <p className="text-xs text-gray-400">{t('form.discountHint')}</p>
                </div>
              )}

              {priceModifierType === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customPrice" className="text-gray-200">
                    {t('form.customPrice')} * ({settings?.currency})
                  </Label>
                  <Input
                    id="customPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    className="bg-gray-900 border-gray-600 text-white"
                    value={priceModifierValue || ''}
                    onChange={(e) =>
                      onPriceModifierChange(priceModifierType, parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="customPriceName" className="text-gray-200">
                  {t('form.customPriceName')}
                </Label>
                <Input
                  id="customPriceName"
                  type="text"
                  className="bg-gray-900 border-gray-600 text-white"
                  value={customPriceName || ''}
                  onChange={(e) => onCustomPriceNameChange(e.target.value)}
                  placeholder="e.g., Student Discount, VIP Package"
                />
              </div>

              <div className="p-3 bg-gray-900 rounded border border-gray-600">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-400">{t('form.basePrice')}:</span>
                  <span className="text-white">
                    {Intl.NumberFormat(settings?.language, {
                      style: 'currency',
                      currency: settings?.currency,
                      minimumFractionDigits: 0
                    }).format(basePrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                  <span className="text-sm font-semibold text-gray-300">
                    {t('form.calculatedPrice')}:
                  </span>
                  <span className="text-lg font-bold text-green-500">
                    {Intl.NumberFormat(settings?.language, {
                      style: 'currency',
                      currency: settings?.currency,
                      minimumFractionDigits: 0
                    }).format(finalPrice)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
