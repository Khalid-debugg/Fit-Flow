import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import type { Membership } from '@renderer/models/membership'
import { PAYMENT_METHODS } from '@renderer/models/membership'
import { useSettings } from '@renderer/hooks/useSettings'

interface MembershipFormProps {
  formData: Partial<Membership>
  setFormData: (data: Partial<Membership>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitLabel: string
  preSelectedMemberId?: string
}

type MemberOption = { id: string; name: string; phone: string }
type PlanOption = { id: string; name: string; price: number; durationDays: number }

export default function MembershipForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  submitLabel,
  preSelectedMemberId
}: MembershipFormProps) {
  const { t } = useTranslation('memberships')
  const { settings } = useSettings()
  const [members, setMembers] = useState<MemberOption[]>([])
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [membersData, plansData] = await Promise.all([
        window.electron.ipcRenderer.invoke('memberships:getMembers'),
        window.electron.ipcRenderer.invoke('memberships:getPlans')
      ])
      setMembers(membersData)
      setPlans(plansData)

      if (preSelectedMemberId && !formData.memberId) {
        setFormData({ ...formData, memberId: preSelectedMemberId })
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

    const startDate = formData.startDate || new Date().toISOString().split('T')[0]
    const endDate = calculateEndDate(startDate, plan.durationDays)

    setFormData({
      ...formData,
      planId,
      amountPaid: plan.price,
      startDate,
      endDate,
      paymentDate: formData.paymentDate || startDate
    })
  }

  const calculateEndDate = (startDate: string, durationDays: number) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + durationDays)
    return date.toISOString().split('T')[0]
  }

  const handleStartDateChange = (startDate: string) => {
    const plan = plans.find((p) => p.id === formData.planId)
    if (!plan) {
      setFormData({ ...formData, startDate })
      return
    }

    const endDate = calculateEndDate(startDate, plan.durationDays)
    setFormData({ ...formData, startDate, endDate })
  }

  if (loading) {
    return <div className="py-8 text-center text-gray-400">{t('loading')}</div>
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="memberId" className="text-gray-200">
            {t('form.member')} *
          </Label>
          <Select
            value={formData.memberId}
            onValueChange={(value) => setFormData({ ...formData, memberId: value })}
            disabled={!!preSelectedMemberId}
          >
            <SelectTrigger id="memberId" className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder={t('form.selectMember')} />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id} className="text-white">
                  {member.name} - {member.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="planId" className="text-gray-200">
            {t('form.plan')} *
          </Label>
          <Select value={formData.planId} onValueChange={handlePlanSelect}>
            <SelectTrigger id="planId" className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder={t('form.selectPlan')} />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id} className="text-white">
                  {plan.name} -
                  {Intl.NumberFormat(settings?.language, {
                    style: 'currency',
                    currency: settings?.currency,
                    minimumFractionDigits: 0
                  }).format(plan.price)}{' '}
                  ({plan.durationDays} {t('days')})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-gray-200">
            {t('form.startDate')} *
          </Label>
          <Input
            id="startDate"
            type="date"
            required
            className="bg-gray-800 border-gray-700 text-white"
            value={formData.startDate || ''}
            onChange={(e) => handleStartDateChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-gray-200">
            {t('form.endDate')} *
          </Label>
          <Input
            id="endDate"
            type="date"
            required
            className="bg-gray-800 border-gray-700 text-white"
            value={formData.endDate || ''}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amountPaid" className="text-gray-200">
            {t('form.amountPaid')} *
          </Label>
          <Input
            id="amountPaid"
            type="number"
            step="0.01"
            min="0"
            required
            className="bg-gray-800 border-gray-700 text-white"
            value={formData.amountPaid || ''}
            onChange={(e) => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentDate" className="text-gray-200">
            {t('form.paymentDate')} *
          </Label>
          <Input
            id="paymentDate"
            type="date"
            required
            className="bg-gray-800 border-gray-700 text-white"
            value={formData.paymentDate || ''}
            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label className="text-gray-200">{t('form.paymentMethod')} *</Label>
          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={(value) =>
              setFormData({ ...formData, paymentMethod: value as (typeof PAYMENT_METHODS)[number] })
            }
            className="flex gap-4 rtl:flex-row-reverse"
          >
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

        <div className="space-y-2 col-span-2">
          <Label htmlFor="notes" className="text-gray-200">
            {t('form.notes')}
          </Label>
          <textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white min-h-20"
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
