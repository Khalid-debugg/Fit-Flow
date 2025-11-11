import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Checkbox } from '@renderer/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { GENDER, Member } from '@renderer/models/member'
import { PAYMENT_METHODS } from '@renderer/models/membership'
import { Separator } from '@renderer/components/ui/separator'

interface SubscriptionData {
  planId: string
  startDate: string
  endDate: string
  amountPaid: number
  paymentMethod: (typeof PAYMENT_METHODS)[number]
  paymentDate: string
  notes: string
}

interface MemberFormProps {
  formData: Partial<Member>
  setFormData: (data: Partial<Member>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitLabel: string
  showSubscription?: boolean
  subscriptionData?: SubscriptionData
  onSubscriptionChange?: (data: SubscriptionData) => void
  addSubscription?: boolean
  onAddSubscriptionChange?: (value: boolean) => void
}

type PlanOption = { id: string; name: string; price: number; durationDays: number }

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
  onAddSubscriptionChange
}: MemberFormProps) {
  const { t } = useTranslation('members')
  const { t: tMemberships } = useTranslation('memberships')

  const [plans, setPlans] = useState<PlanOption[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)

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

    const startDate = subscriptionData.startDate || new Date().toISOString().split('T')[0]
    const endDate = calculateEndDate(startDate, plan.durationDays)

    onSubscriptionChange({
      ...subscriptionData,
      planId,
      amountPaid: plan.price,
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

  const handleStartDateChange = (startDate: string) => {
    if (!onSubscriptionChange || !subscriptionData) return

    const plan = plans.find((p) => p.id === subscriptionData.planId)
    if (!plan) {
      onSubscriptionChange({ ...subscriptionData, startDate })
      return
    }

    const endDate = calculateEndDate(startDate, plan.durationDays)
    onSubscriptionChange({ ...subscriptionData, startDate, endDate })
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
        <div className="grid grid-cols-2 gap-4">
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
            <Label htmlFor="phone" className="text-gray-200">
              {t('form.phone')} *
            </Label>
            <Input
              id="phone"
              required
              type="number"
              maxLength={15}
              className="bg-gray-800 border-gray-700 text-white"
              value={formData.phone ?? ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
            <Input
              id="join-date"
              type="date"
              required
              className="bg-gray-800 border-gray-700 text-white"
              value={formData.joinDate ?? ''}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
            />
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
            <textarea
              id="notes"
              value={formData.notes ?? ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white min-h-20"
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
                    <Select value={subscriptionData.planId} onValueChange={handlePlanSelect}>
                      <SelectTrigger id="planId" className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder={tMemberships('form.selectPlan')} />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id} className="text-white">
                            {plan.name} - {plan.price} EGP ({plan.durationDays}{' '}
                            {tMemberships('days')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-gray-200">
                      {tMemberships('form.startDate')} *
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={subscriptionData.startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-gray-200">
                      {tMemberships('form.endDate')} *
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={subscriptionData.endDate}
                      onChange={(e) =>
                        onSubscriptionChange?.({ ...subscriptionData, endDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amountPaid" className="text-gray-200">
                      {tMemberships('form.amountPaid')} *
                    </Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      step="0.01"
                      min="0"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={subscriptionData.amountPaid}
                      onChange={(e) =>
                        onSubscriptionChange?.({
                          ...subscriptionData,
                          amountPaid: parseFloat(e.target.value)
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentDate" className="text-gray-200">
                      {tMemberships('form.paymentDate')} *
                    </Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={subscriptionData.paymentDate}
                      onChange={(e) =>
                        onSubscriptionChange?.({ ...subscriptionData, paymentDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label className="text-gray-200">{tMemberships('form.paymentMethod')} *</Label>
                    <RadioGroup
                      value={subscriptionData.paymentMethod}
                      onValueChange={(value) =>
                        onSubscriptionChange?.({
                          ...subscriptionData,
                          paymentMethod: value as (typeof PAYMENT_METHODS)[number]
                        })
                      }
                      className="flex gap-4 rtl:flex-row-reverse"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <div key={method} className="flex items-center space-x-2">
                          <RadioGroupItem value={method} id={`sub-method-${method}`} />
                          <Label
                            htmlFor={`sub-method-${method}`}
                            className="text-gray-300 cursor-pointer"
                          >
                            {tMemberships(`paymentMethods.${method}`)}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="subscription-notes" className="text-gray-200">
                      {tMemberships('form.notes')}
                    </Label>
                    <textarea
                      id="subscription-notes"
                      value={subscriptionData.notes}
                      onChange={(e) =>
                        onSubscriptionChange?.({ ...subscriptionData, notes: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white min-h-16"
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
