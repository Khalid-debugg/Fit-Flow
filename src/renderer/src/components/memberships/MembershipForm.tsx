import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { Textarea } from '@renderer/components/ui/textarea'
import { Combobox, type ComboboxOption } from '@renderer/components/ui/combobox'
import type { Membership, ScheduledPayment, PAYMENT_METHODS } from '@renderer/models/membership'
import { type PriceModifierType } from '@renderer/models/membership'
import { PERMISSIONS } from '@renderer/models/account'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAuth } from '@renderer/hooks/useAuth'
import DatePickerField from './DatePickerField'
import PaymentMethodSelector from './PaymentMethodSelector'
import PaymentTypeSelector from './PaymentTypeSelector'
import PriceAdjustmentSection from './PriceAdjustmentSection'
import PaymentSummarySection from './PaymentSummarySection'

interface MembershipFormProps {
  formData: Partial<Membership>
  setFormData: (data: Partial<Membership>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitLabel: string
  preSelectedMemberId?: string
}

type MemberOption = { id: string; name: string; phone: string; countryCode: string }
type PlanOption = {
  id: string
  name: string
  price: number
  durationDays: number | null
  planType: string
  checkInLimit: number | null
}

export default function MembershipForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  submitLabel,
  preSelectedMemberId
}: MembershipFormProps) {
  const { t } = useTranslation('memberships')
  const { hasPermission } = useAuth()
  const { settings } = useSettings()
  const [members, setMembers] = useState<MemberOption[]>([])
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full')
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null)
  const [usePlanPrice, setUsePlanPrice] = useState(true)
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [membersData, plansData] = await Promise.all([
        window.electron.ipcRenderer.invoke('memberships:getMembers'),
        window.electron.ipcRenderer.invoke('memberships:getPlans')
      ])

      // Filter out members with null/undefined IDs
      const validMembers = membersData.filter((member: MemberOption) => {
        if (!member.id) {
          console.error('WARNING: Member with null ID found:', member.name, member)
          return false
        }
        return true
      })

      if (validMembers.length < membersData.length) {
        console.warn(`Filtered out ${membersData.length - validMembers.length} member(s) with invalid IDs`)
      }

      setMembers(validMembers)
      setPlans(plansData)

      if (preSelectedMemberId && !formData.memberId) {
        setFormData({ memberId: preSelectedMemberId })
      }
    } catch (error) {
      console.error('Failed to load members/plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlanSelect = (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return

    setSelectedPlan(plan)

    const startDate = formData.startDate || new Date().toISOString().split('T')[0]
    let endDate = startDate

    // Calculate end date for duration-based plans
    if (plan.planType === 'duration' && plan.durationDays) {
      endDate = calculateEndDate(startDate, plan.durationDays)
    } else if (plan.planType === 'checkin' && plan.durationDays) {
      endDate = calculateEndDate(startDate, plan.durationDays)
    }

    const finalPrice = usePlanPrice
      ? plan.price
      : calculatePrice(plan.price, formData.priceModifierType, formData.priceModifierValue)

    const updates: Partial<Membership> = {
      ...formData,
      planId,
      totalPrice: finalPrice,
      amountPaid: paymentType === 'full' ? finalPrice : 0,
      remainingBalance: paymentType === 'full' ? 0 : finalPrice,
      paymentStatus: paymentType === 'full' ? 'paid' : 'unpaid',
      isCustom: false,
      startDate,
      endDate,
      paymentDate: formData.paymentDate || startDate,
      paymentMethod: formData.paymentMethod || 'cash'
    }

    // Add check-in limit for check-in based plans
    if (plan.planType === 'checkin' && plan.checkInLimit) {
      updates.remainingCheckIns = plan.checkInLimit
    }

    setFormData(updates)
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
      formData.priceModifierType,
      formData.priceModifierValue
    )
  }

  const handleStartDateChange = (startDate: string) => {
    const plan = plans.find((p) => p.id === formData.planId)
    if (!plan) {
      setFormData({ startDate })
      return
    }

    let endDate = startDate
    if (plan.durationDays) {
      endDate = calculateEndDate(startDate, plan.durationDays)
    }
    setFormData({ startDate, endDate })
  }

  const handlePaymentTypeChange = (type: 'full' | 'partial') => {
    setPaymentType(type)

    if (!selectedPlan) return

    const finalPrice = getFinalPrice()
    const updates: Partial<Membership> = { ...formData }

    if (type === 'full') {
      updates.amountPaid = finalPrice
      updates.remainingBalance = 0
      updates.paymentStatus = 'paid'
    } else {
      updates.amountPaid = 0
      updates.remainingBalance = finalPrice
      updates.paymentStatus = 'unpaid'
    }

    setFormData(updates)
  }

  const handleAmountPaidChange = (amount: number) => {
    if (!selectedPlan) return

    const finalPrice = getFinalPrice()
    const remainingBalance = finalPrice - amount
    let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'

    if (amount >= finalPrice) {
      paymentStatus = 'paid'
    } else if (amount > 0) {
      paymentStatus = 'partial'
    }

    setFormData({
      ...formData,
      amountPaid: amount,
      remainingBalance,
      paymentStatus
    })
  }

  const handlePriceAdjustmentChange = (usePlan: boolean) => {
    setUsePlanPrice(usePlan)

    if (usePlan) {
      // Reset price modifiers
      setFormData({
        ...formData,
        priceModifierType: null,
        priceModifierValue: null,
        customPriceName: null,
        totalPrice: selectedPlan?.price || 0,
        amountPaid: paymentType === 'full' ? selectedPlan?.price || 0 : formData.amountPaid,
        remainingBalance:
          paymentType === 'full' ? 0 : (selectedPlan?.price || 0) - (formData.amountPaid || 0)
      })
    }
  }

  const handlePriceModifierChange = (type: PriceModifierType, value?: number) => {
    if (!selectedPlan) return

    const updates: Partial<Membership> = {
      ...formData,
      priceModifierType: type,
      priceModifierValue: value || formData.priceModifierValue
    }

    const finalPrice = calculatePrice(
      selectedPlan.price,
      type,
      value || formData.priceModifierValue
    )
    updates.totalPrice = finalPrice
    updates.remainingBalance = finalPrice - (formData.amountPaid || 0)

    if (paymentType === 'full') {
      updates.amountPaid = finalPrice
      updates.remainingBalance = 0
      updates.paymentStatus = 'paid'
    } else {
      const amountPaid = formData.amountPaid || 0
      if (amountPaid >= finalPrice) {
        updates.paymentStatus = 'paid'
        updates.remainingBalance = 0
      } else if (amountPaid > 0) {
        updates.paymentStatus = 'partial'
      } else {
        updates.paymentStatus = 'unpaid'
      }
    }

    setFormData(updates)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Build the final form data with scheduled payments
    const finalFormData = {
      ...formData,
      scheduledPayments: scheduledPayments.length > 0 ? scheduledPayments : undefined,
      hasScheduledPayments: scheduledPayments.length > 0
    }
    // Update parent state
    setFormData(finalFormData)
    // Pass the final data directly to onSubmit to avoid state timing issues
    // @ts-ignore - onSubmit can accept finalData as second parameter
    onSubmit(e, finalFormData)
  }

  if (loading) {
    return <div className="py-8 text-center text-gray-400">{t('loading')}</div>
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="memberId" className="text-gray-200">
            {t('form.member')} *
          </Label>
          <Combobox
            options={members.map(
              (member): ComboboxOption => ({
                value: member.id,
                label: `${member.name} (\u2066${member.countryCode}${member.phone}\u2069)`,
                searchText: `${member.name} \u2066${member.countryCode}${member.phone}\u2069`
              })
            )}
            value={formData.memberId}
            onValueChange={(value) => {
              if (value === null || value === undefined || value === '') {
                return
              }
              setFormData({ memberId: value })
            }}
            placeholder={t('form.selectMember')}
            searchPlaceholder={t('form.searchMember')}
            emptyText={t('form.noMembersFound')}
            disabled={!!preSelectedMemberId}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="planId" className="text-gray-200">
            {t('form.plan')} *
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
                    ? `(${plan.checkInLimit} ${t('checkIns')})`
                    : plan.durationDays
                      ? `(${plan.durationDays} ${t('days')})`
                      : ''
                }`,
                searchText: plan.name
              })
            )}
            value={formData.planId}
            onValueChange={handlePlanSelect}
            placeholder={t('form.selectPlan')}
            searchPlaceholder={t('form.searchPlan')}
            emptyText={t('form.noPlansFound')}
          />
        </div>

        {/* Price Adjustment Section */}
        {selectedPlan && hasPermission(PERMISSIONS.memberships.modify_price) && (
          <PriceAdjustmentSection
            usePlanPrice={usePlanPrice}
            onUsePlanPriceChange={handlePriceAdjustmentChange}
            priceModifierType={formData.priceModifierType}
            priceModifierValue={formData.priceModifierValue}
            customPriceName={formData.customPriceName}
            onPriceModifierChange={handlePriceModifierChange}
            onCustomPriceNameChange={(name) => setFormData({ customPriceName: name })}
            basePrice={selectedPlan.price}
            finalPrice={getFinalPrice()}
          />
        )}

        <DatePickerField
          label={t('form.startDate')}
          value={formData.startDate}
          onChange={handleStartDateChange}
          disableFuture={true}
          required
        />

        <DatePickerField label={t('form.endDate')} value={formData.endDate} disabled required />

        <PaymentTypeSelector
          value={paymentType}
          onChange={handlePaymentTypeChange}
          disabled={!formData.planId}
          className="col-span-2"
          required
        />

        {selectedPlan && (
          <PaymentSummarySection
            paymentType={paymentType}
            totalPrice={getFinalPrice()}
            amountPaid={formData.amountPaid || 0}
            remainingBalance={formData.remainingBalance || 0}
            onAmountPaidChange={handleAmountPaidChange}
            scheduledPayments={scheduledPayments}
            onScheduledPaymentsChange={setScheduledPayments}
            defaultPaymentMethod={formData.paymentMethod || 'cash'}
          />
        )}

        <DatePickerField
          label={t('form.paymentDate')}
          value={formData.paymentDate}
          onChange={(date) => setFormData({ paymentDate: date })}
          required
        />

        <PaymentMethodSelector
          value={formData.paymentMethod}
          onChange={(value) =>
            setFormData({ paymentMethod: value as (typeof PAYMENT_METHODS)[number] })
          }
          className="col-span-2"
          required
        />

        <div className="space-y-2 col-span-2">
          <Label htmlFor="notes" className="text-gray-200">
            {t('form.notes')}
          </Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ notes: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white min-h-20"
            placeholder={t('form.notesPlaceholder')}
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
