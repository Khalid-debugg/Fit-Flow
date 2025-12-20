import { useTranslation } from 'react-i18next'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { PERMISSIONS } from '@renderer/models/account'
import { useAuth } from '@renderer/hooks/useAuth'
import { cn } from '@renderer/lib/utils'

interface PaymentTypeSelectorProps {
  value: 'full' | 'partial'
  onChange: (value: 'full' | 'partial') => void
  disabled?: boolean
  className?: string
  required?: boolean
}

export default function PaymentTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
  required = false
}: PaymentTypeSelectorProps) {
  const { t } = useTranslation('memberships')
  const { hasPermission } = useAuth()

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-gray-200">
        {t('form.paymentType')} {required && '*'}
      </Label>
      <RadioGroup
        value={value}
        onValueChange={(value) => onChange(value as 'full' | 'partial')}
        className="flex gap-4"
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="full" id="payment-full" />
          <Label htmlFor="payment-full" className="text-gray-300 cursor-pointer">
            {t('form.fullPayment')}
          </Label>
        </div>
        {hasPermission(PERMISSIONS.memberships.add_payment) && (
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="partial" id="payment-partial" />
            <Label htmlFor="payment-partial" className="text-gray-300 cursor-pointer">
              {t('form.partialPayment')}
            </Label>
          </div>
        )}
      </RadioGroup>
    </div>
  )
}
