import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { CalendarIcon, X } from 'lucide-react'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Calendar } from '@renderer/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import type { ScheduledPayment } from '@renderer/models/membership'
import { PAYMENT_METHODS } from '@renderer/models/membership'

interface ScheduledPaymentItemProps {
  payment: ScheduledPayment
  index: number
  maxAmount: number
  onUpdate: (field: keyof ScheduledPayment, value: any) => void
  onRemove: () => void
}

export default function ScheduledPaymentItem({
  payment,
  index,
  maxAmount,
  onUpdate,
  onRemove
}: ScheduledPaymentItemProps) {
  const { t, i18n } = useTranslation('memberships')
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  return (
    <div className="p-3 bg-gray-900 rounded border border-gray-600 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-300">Payment {index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 hover:bg-red-900/20"
        >
          <X className="h-4 w-4 text-red-400" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-gray-400">{t('form.scheduledPaymentAmount')}</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max={maxAmount}
            className="bg-gray-800 border-gray-600 text-white h-8 text-sm"
            value={payment.amount || ''}
            onChange={(e) => onUpdate('amount', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-gray-400">{t('form.scheduledPaymentDate')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="primary"
                className="w-full justify-start text-left font-normal bg-gray-800 border-gray-600 text-white hover:bg-gray-700 h-8 text-sm"
              >
                <CalendarIcon className="ltr:mr-1 rtl:ml-1 h-3 w-3" />
                {payment.payment_date
                  ? format(new Date(payment.payment_date), 'MM/dd/yyyy', {
                      locale: dateLocale
                    })
                  : t('form.pickDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
              <Calendar
                mode="single"
                selected={payment.payment_date ? new Date(payment.payment_date) : undefined}
                onSelect={(date) => {
                  if (date) {
                    onUpdate('payment_date', format(date, 'yyyy-MM-dd'))
                  }
                }}
                locale={dateLocale}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-gray-400">{t('form.scheduledPaymentMethod')}</Label>
        <RadioGroup
          value={payment.payment_method}
          onValueChange={(value) => onUpdate('payment_method', value)}
          className="flex gap-2"
        >
          {PAYMENT_METHODS.map((method) => (
            <div key={method} className="flex items-center space-x-1">
              <RadioGroupItem
                value={method}
                id={`scheduled-${index}-${method}`}
                className="h-3 w-3"
              />
              <Label
                htmlFor={`scheduled-${index}-${method}`}
                className="text-xs text-gray-300 cursor-pointer"
              >
                {t(`paymentMethods.${method}`)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-gray-400">{t('form.scheduledPaymentNotes')}</Label>
        <Input
          type="text"
          className="bg-gray-800 border-gray-600 text-white h-8 text-sm"
          value={payment.notes || ''}
          onChange={(e) => onUpdate('notes', e.target.value)}
        />
      </div>
    </div>
  )
}
