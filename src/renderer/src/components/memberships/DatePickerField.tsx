import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { Calendar } from '@renderer/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { cn } from '@renderer/lib/utils'

interface DatePickerFieldProps {
  label: string
  value?: string
  onChange?: (date: string) => void
  disabled?: boolean
  disableFuture?: boolean
  className?: string
  required?: boolean
}

export default function DatePickerField({
  label,
  value,
  onChange,
  disabled = false,
  disableFuture = false,
  className,
  required = false
}: DatePickerFieldProps) {
  const { t, i18n } = useTranslation('memberships')
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  if (disabled) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label className="text-gray-200">
          {label} {required && '*'}
        </Label>
        <div
          className={cn(
            'flex h-10 w-full items-center rounded-lg border border-gray-700 bg-gray-700 px-3 py-2 text-sm text-gray-400 cursor-not-allowed'
          )}
        >
          <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
          {value ? format(new Date(value), 'MM/dd/yyyy', { locale: dateLocale }) : t('form.pickDate')}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-gray-200">
        {label} {required && '*'}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="primary"
            className={cn(
              'w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700',
              !value && 'text-gray-400'
            )}
          >
            <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {value ? format(new Date(value), 'MM/dd/yyyy', { locale: dateLocale }) : t('form.pickDate')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => {
              if (date && onChange) {
                onChange(format(date, 'yyyy-MM-dd'))
              }
            }}
            disabled={disableFuture ? (date) => date > new Date() : undefined}
            locale={dateLocale}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
