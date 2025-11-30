import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Calendar } from '@renderer/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Textarea } from '@renderer/components/ui/textarea'
import { Combobox, type ComboboxOption } from '@renderer/components/ui/combobox'
import type { Membership } from '@renderer/models/membership'
import { PAYMENT_METHODS } from '@renderer/models/membership'
import { useSettings } from '@renderer/hooks/useSettings'
import { cn } from '@renderer/lib/utils'

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
  const { t, i18n } = useTranslation('memberships')
  const { settings } = useSettings()
  const [members, setMembers] = useState<MemberOption[]>([])
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [loading, setLoading] = useState(true)
  const dateLocale = i18n.language === 'ar' ? ar : enUS

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
          <Combobox
            options={members.map(
              (member): ComboboxOption => ({
                value: member.id,
                label: `${member.name} - ${member.phone}`,
                searchText: `${member.name} ${member.phone}`
              })
            )}
            value={formData.memberId}
            onValueChange={(value) => setFormData({ ...formData, memberId: value })}
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
                }).format(plan.price)} (${plan.durationDays} ${t('days')})`,
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

        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-gray-200">
            {t('form.startDate')} *
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="primary"
                className={cn(
                  'w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700',
                  !formData.startDate && 'text-gray-400'
                )}
              >
                <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {formData.startDate
                  ? format(new Date(formData.startDate), 'MM/dd/yyyy', { locale: dateLocale })
                  : t('form.pickDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
              <Calendar
                mode="single"
                selected={formData.startDate ? new Date(formData.startDate) : undefined}
                onSelect={(date) => {
                  if (date) {
                    handleStartDateChange(format(date, 'yyyy-MM-dd'))
                  }
                }}
                disabled={(date) => date > new Date()}
                locale={dateLocale}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-gray-200">
            {t('form.endDate')} *
          </Label>
          <div
            className={cn(
              'flex h-10 w-full items-center rounded-lg border border-gray-700 bg-gray-700 px-3 py-2 text-sm text-gray-400 cursor-not-allowed'
            )}
          >
            <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {formData.endDate
              ? format(new Date(formData.endDate), 'MM/dd/yyyy', { locale: dateLocale })
              : t('form.pickDate')}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amountPaid" className="text-gray-200">
            {t('form.amountPaid')} ({settings?.currency}) *
          </Label>
          <Input
            id="amountPaid"
            type="number"
            step="0.01"
            min="0"
            required
            disabled
            readOnly
            className="bg-gray-800 border-gray-700 text-white"
            value={formData.amountPaid || ''}
            onChange={(e) => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentDate" className="text-gray-200">
            {t('form.paymentDate')} *
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="primary"
                className={cn(
                  'w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700',
                  !formData.paymentDate && 'text-gray-400'
                )}
              >
                <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {formData.paymentDate
                  ? format(new Date(formData.paymentDate), 'MM/dd/yyyy', { locale: dateLocale })
                  : t('form.pickDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
              <Calendar
                mode="single"
                selected={formData.paymentDate ? new Date(formData.paymentDate) : undefined}
                onSelect={(date) => {
                  if (date) {
                    setFormData({ ...formData, paymentDate: format(date, 'yyyy-MM-dd') })
                  }
                }}
                locale={dateLocale}
              />
            </PopoverContent>
          </Popover>
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
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
