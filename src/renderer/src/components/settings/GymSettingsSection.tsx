import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { Combobox, type ComboboxOption } from '@renderer/components/ui/combobox'
import { CURRENCIES } from '@renderer/models/settings'
import type { Settings } from '@renderer/models/settings'
import type { SupportedLanguage } from '@renderer/locales/i18n'
import { PAYMENT_METHODS } from '@renderer/models/membership'

interface GymSettingsSectionProps {
  language: SupportedLanguage
  currency: string
  allowedGenders: 'both' | 'male' | 'female'
  defaultPaymentMethod: (typeof PAYMENT_METHODS)[number]
  barcodeSize: 'keychain' | 'card'
  allowInstantCheckIn: boolean
  canEdit: boolean
  onUpdate: (updates: Partial<Settings>) => void
}

export const GymSettingsSection = memo(function GymSettingsSection({
  language,
  currency,
  allowedGenders,
  defaultPaymentMethod,
  barcodeSize,
  allowInstantCheckIn,
  canEdit,
  onUpdate
}: GymSettingsSectionProps) {
  const { t, i18n } = useTranslation('settings')

  const currencyOptions = useMemo(
    (): ComboboxOption[] =>
      CURRENCIES.map((curr) => ({
        value: curr.code,
        label: `${curr.code} - ${curr.name} (${i18n.language === 'ar' ? curr.arSymbol : curr.enSymbol})`,
        searchText: `${curr.code} ${curr.name}`
      })),
    [i18n.language]
  )

  const handleLanguageChange = useCallback(
    (value: string) => {
      onUpdate({ language: value as 'ar' | 'en' })
    },
    [onUpdate]
  )

  const handleCurrencyChange = useCallback(
    (value: string) => {
      onUpdate({ currency: value })
    },
    [onUpdate]
  )

  const handleGenderChange = useCallback(
    (value: string) => {
      onUpdate({ allowedGenders: value as Settings['allowedGenders'] })
    },
    [onUpdate]
  )

  const handlePaymentMethodChange = useCallback(
    (value: string) => {
      onUpdate({ defaultPaymentMethod: value as Settings['defaultPaymentMethod'] })
    },
    [onUpdate]
  )

  const handleBarcodeSizeChange = useCallback(
    (value: string) => {
      onUpdate({ barcodeSize: value as 'keychain' | 'card' })
    },
    [onUpdate]
  )

  const handleInstantCheckInChange = useCallback(
    (checked: boolean) => {
      onUpdate({ allowInstantCheckIn: checked })
    },
    [onUpdate]
  )

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-semibold text-white">{t('gymSettings')}</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('regional.language')}
          </label>
          <Select value={language} onValueChange={handleLanguageChange} disabled={!canEdit}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">{t('regional.arabic')}</SelectItem>
              <SelectItem value="en">{t('regional.english')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('regional.currency')}
          </label>
          <Combobox
            className="bg-gray-900 hover:bg-gray-900"
            options={currencyOptions}
            value={currency}
            onValueChange={handleCurrencyChange}
            placeholder={t('regional.currency')}
            searchPlaceholder={t('regional.searchCurrency')}
            emptyText={t('regional.noCurrencyFound')}
            disabled={!canEdit}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('members.allowedGenders')}
          </label>
          <Select value={allowedGenders} onValueChange={handleGenderChange} disabled={!canEdit}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">{t('members.both')}</SelectItem>
              <SelectItem value="male">{t('members.maleOnly')}</SelectItem>
              <SelectItem value="female">{t('members.femaleOnly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('payment.defaultMethod')}
          </label>
          <Select
            value={defaultPaymentMethod}
            onValueChange={handlePaymentMethodChange}
            disabled={!canEdit}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">{t('payment.cash')}</SelectItem>
              <SelectItem value="card">{t('payment.card')}</SelectItem>
              <SelectItem value="bank">{t('payment.transfer')}</SelectItem>
              <SelectItem value="e-wallet">{t('payment.e-wallet')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('gym.barcodeSize')}
          </label>
          <Select value={barcodeSize} onValueChange={handleBarcodeSizeChange} disabled={!canEdit}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="keychain">{t('gym.keychainSize')}</SelectItem>
              <SelectItem value="card">{t('gym.cardSize')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-300 block">
              {t('checkIns.allowInstantCheckIn')}
            </span>
            <span className="text-xs text-gray-400 mt-1 block">
              {t('checkIns.allowInstantCheckInDesc')}
            </span>
          </div>
          <Checkbox
            checked={allowInstantCheckIn}
            onCheckedChange={handleInstantCheckInChange}
            className="w-5 h-5"
            disabled={!canEdit}
          />
        </div>
      </div>
    </div>
  )
})
