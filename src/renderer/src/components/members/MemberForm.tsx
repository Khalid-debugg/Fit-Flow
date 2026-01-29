import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Calendar } from '@renderer/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Textarea } from '@renderer/components/ui/textarea'
import { PhoneInput } from '@renderer/components/ui/phone-input'
import { Combobox, type ComboboxOption } from '@renderer/components/ui/combobox'
import { GENDER, Member } from '@renderer/models/member'
import {
  PAYMENT_METHODS,
  type ScheduledPayment,
  type PriceModifierType
} from '@renderer/models/membership'
import { Separator } from '@renderer/components/ui/separator'
import { useSettings } from '@renderer/hooks/useSettings'
import { cn } from '@renderer/lib/utils'
import DatePickerField from '@renderer/components/memberships/DatePickerField'
import PaymentMethodSelector from '@renderer/components/memberships/PaymentMethodSelector'
import PaymentTypeSelector from '@renderer/components/memberships/PaymentTypeSelector'
import PriceAdjustmentSection from '@renderer/components/memberships/PriceAdjustmentSection'
import PaymentSummarySection from '@renderer/components/memberships/PaymentSummarySection'

export interface SubscriptionData {
  planId: string
  startDate: string
  endDate: string
  totalPrice?: number
  amountPaid: number
  remainingBalance?: number
  paymentStatus?: 'unpaid' | 'partial' | 'paid'
  paymentMethod: (typeof PAYMENT_METHODS)[number]
  paymentDate: string
  notes: string
  priceModifierType?: PriceModifierType | null
  priceModifierValue?: number | null
  customPriceName?: string | null
  scheduledPayments?: ScheduledPayment[]
}

interface MemberFormProps {
  formData: Partial<Member>
  setFormData: (data: Partial<Member>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitLabel: string
  showSubscription?: boolean
  subscriptionData?: SubscriptionData
  onSubscriptionChange?: (data: Partial<SubscriptionData>) => void
  addSubscription?: boolean
  onAddSubscriptionChange?: (value: boolean) => void
  isCreateMode?: boolean
}

type PlanOption = {
  id: string
  name: string
  price: number
  durationDays: number | null
  planType: string
  checkInLimit: number | null
}

export default function MemberForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  submitLabel,
  showSubscription = true,
  subscriptionData,
  onSubscriptionChange,
  addSubscription = false,
  onAddSubscriptionChange,
  isCreateMode = false
}: MemberFormProps) {
  const { t, i18n } = useTranslation('members')
  const { t: tMemberships } = useTranslation('memberships')
  const { settings } = useSettings()
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const dateLocale = i18n.language === 'ar' ? ar : enUS
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full')
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null)
  const [usePlanPrice, setUsePlanPrice] = useState(true)
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([])

  useEffect(() => {
    if (showSubscription && addSubscription) {
      loadPlans()
    }
  }, [showSubscription, addSubscription])

  const loadPlans = async () => {
    setLoadingPlans(true)
    try {
      const plansData = await window.electron.ipcRenderer.invoke('memberships:getPlans')
      setPlans(plansData)
    } catch (error) {
      console.error('Failed to load plans:', error)
    } finally {
      setLoadingPlans(false)
    }
  }

  const handlePlanSelect = (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan || !onSubscriptionChange || !subscriptionData) return

    setSelectedPlan(plan)

    const startDate = subscriptionData.startDate || new Date().toISOString().split('T')[0]
    let endDate = startDate

    // Calculate end date for duration-based plans
    if (plan.planType === 'duration' && plan.durationDays) {
      endDate = calculateEndDate(startDate, plan.durationDays)
    } else if (plan.planType === 'checkin' && plan.durationDays) {
      endDate = calculateEndDate(startDate, plan.durationDays)
    }

    const finalPrice = usePlanPrice
      ? plan.price
      : calculatePrice(
          plan.price,
          subscriptionData.priceModifierType,
          subscriptionData.priceModifierValue
        )

    onSubscriptionChange({
      ...subscriptionData,
      planId,
      totalPrice: finalPrice,
      amountPaid: paymentType === 'full' ? finalPrice : 0,
      remainingBalance: paymentType === 'full' ? 0 : finalPrice,
      paymentStatus: paymentType === 'full' ? 'paid' : 'unpaid',
      startDate,
      endDate,
      paymentDate: subscriptionData.paymentDate || startDate
    })
  }

  const calculateEndDate = (startDate: string, durationDays: number) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + durationDays)
    return date.toISOString().split('T')[0]
  }

  const calculatePrice = (
    basePrice: number,
    modifierType?: PriceModifierType | null,
    modifierValue?: number | null
  ) => {
    if (!modifierType || !modifierValue) return basePrice

    if (modifierType === 'multiplier') {
      return basePrice * modifierValue
    } else if (modifierType === 'discount') {
      return basePrice - (basePrice * modifierValue) / 100
    } else if (modifierType === 'custom') {
      return modifierValue
    }
    return basePrice
  }

  const getFinalPrice = () => {
    if (!selectedPlan) return 0
    if (usePlanPrice) return selectedPlan.price
    return calculatePrice(
      selectedPlan.price,
      subscriptionData?.priceModifierType,
      subscriptionData?.priceModifierValue
    )
  }

  const handleStartDateChange = (startDate: string) => {
    if (!onSubscriptionChange || !subscriptionData) return

    const plan = plans.find((p) => p.id === subscriptionData.planId)
    if (!plan) {
      onSubscriptionChange({ ...subscriptionData, startDate })
      return
    }

    let endDate = startDate
    if (plan.durationDays) {
      endDate = calculateEndDate(startDate, plan.durationDays)
    }
    onSubscriptionChange({ ...subscriptionData, startDate, endDate })
  }

  const handlePaymentTypeChange = (type: 'full' | 'partial') => {
    if (!onSubscriptionChange || !subscriptionData || !selectedPlan) return

    setPaymentType(type)

    const finalPrice = getFinalPrice()

    if (type === 'full') {
      onSubscriptionChange({
        ...subscriptionData,
        amountPaid: finalPrice,
        remainingBalance: 0,
        paymentStatus: 'paid'
      })
    } else {
      onSubscriptionChange({
        ...subscriptionData,
        amountPaid: 0,
        remainingBalance: finalPrice,
        paymentStatus: 'unpaid'
      })
    }
  }

  const handleAmountPaidChange = (amount: number) => {
    if (!onSubscriptionChange || !subscriptionData || !selectedPlan) return

    const finalPrice = getFinalPrice()
    const remainingBalance = finalPrice - amount
    let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'

    if (amount >= finalPrice) {
      paymentStatus = 'paid'
    } else if (amount > 0) {
      paymentStatus = 'partial'
    }

    onSubscriptionChange({
      ...subscriptionData,
      amountPaid: amount,
      remainingBalance,
      paymentStatus
    })
  }

  const handlePriceAdjustmentChange = (usePlan: boolean) => {
    if (!onSubscriptionChange || !subscriptionData || !selectedPlan) return

    setUsePlanPrice(usePlan)

    if (usePlan) {
      // Reset price modifiers
      onSubscriptionChange({
        ...subscriptionData,
        priceModifierType: null,
        priceModifierValue: null,
        customPriceName: null,
        totalPrice: selectedPlan.price,
        amountPaid: paymentType === 'full' ? selectedPlan.price : subscriptionData.amountPaid,
        remainingBalance:
          paymentType === 'full' ? 0 : selectedPlan.price - (subscriptionData.amountPaid || 0)
      })
    }
  }

  const handlePriceModifierChange = (type: PriceModifierType, value?: number) => {
    if (!onSubscriptionChange || !subscriptionData || !selectedPlan) return

    const finalPrice = calculatePrice(
      selectedPlan.price,
      type,
      value || subscriptionData.priceModifierValue
    )

    const updates: Partial<SubscriptionData> = {
      ...subscriptionData,
      priceModifierType: type,
      priceModifierValue: value || subscriptionData.priceModifierValue,
      totalPrice: finalPrice,
      remainingBalance: finalPrice - (subscriptionData.amountPaid || 0)
    }

    if (paymentType === 'full') {
      updates.amountPaid = finalPrice
      updates.remainingBalance = 0
      updates.paymentStatus = 'paid'
    } else {
      const amountPaid = subscriptionData.amountPaid || 0
      if (amountPaid >= finalPrice) {
        updates.paymentStatus = 'paid'
        updates.remainingBalance = 0
      } else if (amountPaid > 0) {
        updates.paymentStatus = 'partial'
      } else {
        updates.paymentStatus = 'unpaid'
      }
    }

    onSubscriptionChange(updates as SubscriptionData)
  }

  const handleScheduledPaymentsChange = (payments: ScheduledPayment[]) => {
    if (!onSubscriptionChange || !subscriptionData) return
    setScheduledPayments(payments)
    onSubscriptionChange({
      ...subscriptionData,
      scheduledPayments: payments.length > 0 ? payments : undefined
    })
  }

  const getSubscriptionLabel = () => {
    if (!formData.currentMembership) {
      return tMemberships('addNew')
    }

    const today = new Date().toISOString().split('T')[0]
    const isActive = formData.currentMembership.endDate >= today

    return isActive ? t('filters.extendMembership') : t('filters.renewMembership')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-200">{t('basicInfo')}</h3>
        <div className="flex flex-col gap-4">
          {settings?.allowCustomMemberId && (
            <div className="space-y-2">
              <Label htmlFor="id" className="text-gray-200">
                {t('form.id')} *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="id"
                  type="number"
                  min="1"
                  required
                  className="bg-gray-800 border-gray-700 text-white flex-1"
                  value={formData.id ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      id: e.target.value
                    })
                  }
                  placeholder={isCreateMode ? t('form.id') : ''}
                />
                {isCreateMode && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      const nextId = await window.electron.ipcRenderer.invoke('members:getNextId')
                      setFormData({ ...formData, id: nextId })
                    }}
                    className="whitespace-nowrap"
                  >
                    {t('form.autoGenerate')}
                  </Button>
                )}
              </div>
            </div>
          )}
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
            <PhoneInput
              countryCode={formData.countryCode || '+20'}
              phoneNumber={formData.phone || ''}
              onCountryCodeChange={(code) => setFormData({ ...formData, countryCode: code })}
              onPhoneNumberChange={(number) => setFormData({ ...formData, phone: number })}
              label={t('form.phone')}
              required={true}
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="primary"
                  className={cn(
                    'w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700',
                    !formData.joinDate && 'text-gray-400'
                  )}
                >
                  <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                  {formData.joinDate
                    ? format(new Date(formData.joinDate), 'MM/dd/yyyy', { locale: dateLocale })
                    : t('form.pickDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
                <Calendar
                  mode="single"
                  selected={formData.joinDate ? new Date(formData.joinDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setFormData({ ...formData, joinDate: format(date, 'yyyy-MM-dd') })
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  locale={dateLocale}
                />
              </PopoverContent>
            </Popover>
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
            <Textarea
              id="notes"
              value={formData.notes ?? ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white min-h-20"
            />
          </div>
        </div>
      </div>

      {showSubscription && (
        <>
          <Separator className="bg-gray-700" />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="add-subscription"
              checked={addSubscription}
              onCheckedChange={(checked) => onAddSubscriptionChange?.(checked as boolean)}
            />
            <Label
              htmlFor="add-subscription"
              className="text-gray-200 cursor-pointer font-semibold"
            >
              {getSubscriptionLabel()}
            </Label>
          </div>

          {addSubscription && subscriptionData && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-200">{getSubscriptionLabel()}</h3>

              {loadingPlans ? (
                <div className="py-4 text-center text-gray-400">{tMemberships('loading')}</div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="planId" className="text-gray-200">
                      {tMemberships('form.plan')} *
                    </Label>
                    <Combobox
                      options={plans.map(
                        (plan): ComboboxOption => ({
                          value: plan.id,
                          label: `${plan.name} - ${Intl.NumberFormat(settings?.language, {
                            style: 'currency',
                            currency: settings?.currency,
                            minimumFractionDigits: 0
                          }).format(plan.price)} ${
                            plan.planType === 'checkin'
                              ? `(${plan.checkInLimit} ${tMemberships('checkIns')})`
                              : plan.durationDays
                                ? `(${plan.durationDays} ${tMemberships('days')})`
                                : ''
                          }`,
                          searchText: plan.name
                        })
                      )}
                      value={subscriptionData.planId}
                      onValueChange={handlePlanSelect}
                      placeholder={tMemberships('form.selectPlan')}
                      searchPlaceholder={tMemberships('form.searchPlan')}
                      emptyText={tMemberships('form.noPlansFound')}
                    />
                  </div>

                  {/* Price Adjustment Section */}
                  {selectedPlan && (
                    <PriceAdjustmentSection
                      usePlanPrice={usePlanPrice}
                      onUsePlanPriceChange={handlePriceAdjustmentChange}
                      priceModifierType={subscriptionData.priceModifierType}
                      priceModifierValue={subscriptionData.priceModifierValue}
                      customPriceName={subscriptionData.customPriceName}
                      onPriceModifierChange={handlePriceModifierChange}
                      onCustomPriceNameChange={(name) =>
                        onSubscriptionChange?.({ ...subscriptionData, customPriceName: name })
                      }
                      basePrice={selectedPlan.price}
                      finalPrice={getFinalPrice()}
                    />
                  )}

                  <DatePickerField
                    label={tMemberships('form.startDate')}
                    value={subscriptionData.startDate}
                    onChange={handleStartDateChange}
                    disableFuture={true}
                    required
                  />

                  <DatePickerField
                    label={tMemberships('form.endDate')}
                    value={subscriptionData.endDate}
                    disabled
                    required
                  />

                  <PaymentTypeSelector
                    value={paymentType}
                    onChange={handlePaymentTypeChange}
                    disabled={!subscriptionData.planId}
                    className="col-span-2"
                    required
                  />

                  {selectedPlan && (
                    <PaymentSummarySection
                      paymentType={paymentType}
                      totalPrice={getFinalPrice()}
                      amountPaid={subscriptionData.amountPaid || 0}
                      remainingBalance={subscriptionData.remainingBalance || 0}
                      onAmountPaidChange={handleAmountPaidChange}
                      scheduledPayments={scheduledPayments}
                      onScheduledPaymentsChange={handleScheduledPaymentsChange}
                      defaultPaymentMethod={subscriptionData.paymentMethod || 'cash'}
                    />
                  )}

                  <DatePickerField
                    label={tMemberships('form.paymentDate')}
                    value={subscriptionData.paymentDate}
                    onChange={(date) =>
                      onSubscriptionChange?.({ ...subscriptionData, paymentDate: date })
                    }
                    required
                  />

                  <PaymentMethodSelector
                    value={subscriptionData.paymentMethod}
                    onChange={(value) =>
                      onSubscriptionChange?.({
                        ...subscriptionData,
                        paymentMethod: value as (typeof PAYMENT_METHODS)[number]
                      })
                    }
                    className="col-span-2"
                    required
                  />

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="subscription-notes" className="text-gray-200">
                      {tMemberships('form.notes')}
                    </Label>
                    <Textarea
                      id="subscription-notes"
                      value={subscriptionData.notes}
                      onChange={(e) =>
                        onSubscriptionChange?.({ ...subscriptionData, notes: e.target.value })
                      }
                      className="bg-gray-800 border-gray-700 text-white min-h-20"
                      placeholder={tMemberships('form.notesPlaceholder')}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

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
