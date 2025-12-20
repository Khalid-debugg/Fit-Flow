import { useTranslation } from 'react-i18next'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { PAYMENT_METHODS } from '@renderer/models/membership'
import { cn } from '@renderer/lib/utils'

interface PaymentMethodSelectorProps {
  value?: string
  onChange: (value: string) => void
  className?: string
  required?: boolean
  label?: string
}

export default function PaymentMethodSelector({
  value,
  onChange,
  className,
  required = false,
  label
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation('memberships')

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-gray-200">
        {label || t('form.paymentMethod')} {required && '*'}
      </Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex gap-4">
        {PAYMENT_METHODS.map((method) => (
          <div key={method} className="flex items-center space-x-2">
            <RadioGroupItem value={method} id={`method-${method}`} />
            <Label htmlFor={`method-${method}`} className="text-gray-300 cursor-pointer">
              {t(`paymentMethods.${method}`)}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
