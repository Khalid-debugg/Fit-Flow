import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Label } from './label'
import { Input } from './input'
import { Combobox, type ComboboxOption } from './combobox'
import { COUNTRY_CODES, validatePhoneNumber } from '@renderer/utils/countryCodes'
import { cn } from '@renderer/lib/utils'

interface PhoneInputProps {
  countryCode: string
  phoneNumber: string
  onCountryCodeChange: (code: string) => void
  onPhoneNumberChange: (number: string) => void
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function PhoneInput({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  label,
  required = false,
  disabled = false,
  className
}: PhoneInputProps) {
  const { i18n } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  // Validate phone number when it changes
  useEffect(() => {
    if (phoneNumber && phoneNumber.length > 0) {
      const isValid = validatePhoneNumber(countryCode, phoneNumber)
      if (!isValid) {
        const country = COUNTRY_CODES.find((c) => c.code === countryCode)
        if (country) {
          const lengthText =
            country.minLength === country.maxLength
              ? `${country.minLength} ${i18n.language === 'ar' ? 'أرقام' : 'digits'}`
              : `${country.minLength}-${country.maxLength} ${i18n.language === 'ar' ? 'أرقام' : 'digits'}`

          setError(
            i18n.language === 'ar'
              ? `رقم الهاتف يجب أن يكون ${lengthText}`
              : `Phone number must be ${lengthText}`
          )
        }
      } else {
        setError(null)
      }
    } else {
      setError(null)
    }
  }, [phoneNumber, countryCode, i18n.language])

  const countryOptions: ComboboxOption[] = COUNTRY_CODES.map((country) => ({
    value: country.code,
    label: `${country.code} (${i18n.language === 'ar' ? country.countryAr : country.country})`,
    searchText: `${country.code} ${country.country} ${country.countryAr} ${country.iso}`
  }))

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-gray-200">
          {label} {required && <span className="text-red-400">*</span>}
        </Label>
      )}
      <div className="grid grid-cols-3 gap-2" dir="ltr">
        <div className="col-span-1">
          <Combobox
            options={countryOptions}
            value={countryCode}
            onValueChange={onCountryCodeChange}
            placeholder={i18n.language === 'ar' ? 'كود الدولة' : 'Country code'}
            searchPlaceholder={i18n.language === 'ar' ? 'ابحث عن دولة...' : 'Search country...'}
            emptyText={i18n.language === 'ar' ? 'لا توجد نتائج' : 'No results'}
            disabled={disabled}
          />
        </div>
        <div className="col-span-2">
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e) => {
              // Only allow digits
              let value = e.target.value.replace(/\D/g, '')

              // Get current country info
              const country = COUNTRY_CODES.find((c) => c.code === countryCode)
              if (country) {
                // Remove the '+' from country code to get the prefix
                const countryPrefix = countryCode.replace('+', '')

                // If value exceeds max length, check if the leading excess digits
                // match the trailing digits of the country code
                if (value.length > country.maxLength) {
                  const excessDigits = value.length - country.maxLength
                  const leadingDigits = value.slice(0, excessDigits)
                  const trailingCountryDigits = countryPrefix.slice(-excessDigits)

                  // Only trim if they match
                  // Example: +20 with "01155366432" → "0" matches last digit of "20" → trim
                  // Example: +20 with "201155366432" → "20" matches "20" → trim
                  // Example: +22 with "01155366432" → "0" doesn't match "2" → don't trim
                  if (leadingDigits === trailingCountryDigits) {
                    value = value.slice(excessDigits)
                  }
                }
              }

              onPhoneNumberChange(value)
            }}
            placeholder={i18n.language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
            required={required}
            disabled={disabled}
            className={cn(
              'bg-gray-800 border-gray-700 text-white',
              error && 'border-red-500 focus:border-red-500'
            )}
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
