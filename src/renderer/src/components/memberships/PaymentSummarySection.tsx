import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import type { ScheduledPayment } from '@renderer/models/membership'
import { PERMISSIONS } from '@renderer/models/account'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAuth } from '@renderer/hooks/useAuth'
import { cn } from '@renderer/lib/utils'
import ScheduledPaymentItem from './ScheduledPaymentItem'

interface PaymentSummarySectionProps {
  paymentType: 'full' | 'partial'
  totalPrice: number
  amountPaid: number
  remainingBalance: number
  onAmountPaidChange: (amount: number) => void
  scheduledPayments: ScheduledPayment[]
  onScheduledPaymentsChange: (payments: ScheduledPayment[]) => void
  defaultPaymentMethod: string
}

export default function PaymentSummarySection({
  paymentType,
  totalPrice,
  amountPaid,
  remainingBalance,
  onAmountPaidChange,
  scheduledPayments,
  onScheduledPaymentsChange,
  defaultPaymentMethod
}: PaymentSummarySectionProps) {
  const { t } = useTranslation('memberships')
  const { hasPermission } = useAuth()
  const { settings } = useSettings()
  const [hasScheduledPayments, setHasScheduledPayments] = useState(scheduledPayments.length > 0)

  const addScheduledPayment = () => {
    const newPayment: ScheduledPayment = {
      amount: 0,
      payment_method: defaultPaymentMethod || 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      notes: null
    }
    onScheduledPaymentsChange([...scheduledPayments, newPayment])
  }

  const removeScheduledPayment = (index: number) => {
    onScheduledPaymentsChange(scheduledPayments.filter((_, i) => i !== index))
  }

  const updateScheduledPayment = (index: number, field: keyof ScheduledPayment, value: any) => {
    const updated = [...scheduledPayments]
    updated[index] = { ...updated[index], [field]: value }
    onScheduledPaymentsChange(updated)
  }

  const getTotalScheduled = () => {
    return scheduledPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
  }

  const getRemainingAfterScheduled = () => {
    const totalScheduled = getTotalScheduled()
    return totalPrice - amountPaid - totalScheduled
  }

  return (
    <div className="space-y-2 col-span-2 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400">{t('form.totalPrice')}:</span>
        <span className="text-lg font-semibold text-white">
          {Intl.NumberFormat(settings?.language, {
            style: 'currency',
            currency: settings?.currency,
            minimumFractionDigits: 0
          }).format(totalPrice)}
        </span>
      </div>

      {paymentType === 'partial' && (
        <div className="space-y-3">
          <Label htmlFor="amountPaid" className="text-gray-200">
            {t('form.initialPayment')} ({settings?.currency})
          </Label>
          <Input
            id="amountPaid"
            type="number"
            step="0.01"
            min="0"
            max={totalPrice}
            className="bg-gray-900 border-gray-600 text-white"
            value={amountPaid || ''}
            onChange={(e) => onAmountPaidChange(parseFloat(e.target.value) || 0)}
          />

          {/* Payment Schedule Quick Suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400">{t('form.paymentScheduleSuggestions')}:</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAmountPaidChange(Math.round(totalPrice * 0.25 * 100) / 100)}
              >
                25% (
                {Intl.NumberFormat(settings?.language, {
                  style: 'currency',
                  currency: settings?.currency,
                  minimumFractionDigits: 0
                }).format(Math.round(totalPrice * 0.25 * 100) / 100)}
                )
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAmountPaidChange(Math.round(totalPrice * 0.5 * 100) / 100)}
              >
                50% (
                {Intl.NumberFormat(settings?.language, {
                  style: 'currency',
                  currency: settings?.currency,
                  minimumFractionDigits: 0
                }).format(Math.round(totalPrice * 0.5 * 100) / 100)}
                )
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAmountPaidChange(Math.round(totalPrice * 0.75 * 100) / 100)}
              >
                75% (
                {Intl.NumberFormat(settings?.language, {
                  style: 'currency',
                  currency: settings?.currency,
                  minimumFractionDigits: 0
                }).format(Math.round(totalPrice * 0.75 * 100) / 100)}
                )
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm mt-2 p-2 bg-gray-900 rounded">
            <span className="text-gray-400">{t('form.remainingBalance')}:</span>
            <span
              className={cn(
                'font-semibold',
                remainingBalance === 0 ? 'text-green-500' : 'text-yellow-500'
              )}
            >
              {Intl.NumberFormat(settings?.language, {
                style: 'currency',
                currency: settings?.currency,
                minimumFractionDigits: 0
              }).format(remainingBalance || 0)}
            </span>
          </div>

          {remainingBalance && remainingBalance > 0 && (
            <>
              <p className="text-xs text-gray-400 italic">{t('form.partialPaymentNote')}</p>

              {/* Schedule Payment Toggle */}
              {hasPermission(PERMISSIONS.memberships.add_payment) && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasScheduledPayments"
                      checked={hasScheduledPayments}
                      onCheckedChange={(checked) => {
                        setHasScheduledPayments(checked as boolean)
                        if (!checked) {
                          onScheduledPaymentsChange([])
                        }
                      }}
                    />
                    <Label
                      htmlFor="hasScheduledPayments"
                      className="text-gray-300 cursor-pointer text-sm font-medium"
                    >
                      {t('form.schedulePaymentDates')}
                    </Label>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-6">
                    {t('form.schedulePaymentDatesHint')}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Scheduled Payments Section */}
          {hasPermission(PERMISSIONS.memberships.add_payment) &&
            hasScheduledPayments &&
            remainingBalance &&
            remainingBalance > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-gray-200">{t('form.schedulePayments')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addScheduledPayment}
                  disabled={getRemainingAfterScheduled() <= 0}
                >
                  + {t('form.addScheduledPayment')}
                </Button>
              </div>

              {scheduledPayments.length > 0 && (
                <div className="space-y-3">
                  {scheduledPayments.map((payment, index) => (
                    <ScheduledPaymentItem
                      key={index}
                      payment={payment}
                      index={index}
                      maxAmount={getRemainingAfterScheduled() + (payment.amount || 0)}
                      onUpdate={(field, value) => updateScheduledPayment(index, field, value)}
                      onRemove={() => removeScheduledPayment(index)}
                    />
                  ))}

                  <div className="p-3 bg-gray-900 rounded border border-gray-600">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-400">{t('form.totalScheduled')}:</span>
                      <span className="text-white font-medium">
                        {Intl.NumberFormat(settings?.language, {
                          style: 'currency',
                          currency: settings?.currency,
                          minimumFractionDigits: 0
                        }).format(getTotalScheduled())}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                      <span className="text-sm font-semibold text-gray-300">
                        {t('form.remainingBalance')}:
                      </span>
                      <span
                        className={cn(
                          'text-lg font-bold',
                          getRemainingAfterScheduled() === 0 ? 'text-green-500' : 'text-yellow-500'
                        )}
                      >
                        {Intl.NumberFormat(settings?.language, {
                          style: 'currency',
                          currency: settings?.currency,
                          minimumFractionDigits: 0
                        }).format(getRemainingAfterScheduled())}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {paymentType === 'full' && (
        <div className="flex justify-between items-center">
          <span className="text-gray-400">{t('form.amountPaid')}:</span>
          <span className="text-lg font-semibold text-green-500">
            {Intl.NumberFormat(settings?.language, {
              style: 'currency',
              currency: settings?.currency,
              minimumFractionDigits: 0
            }).format(amountPaid || 0)}
          </span>
        </div>
      )}
    </div>
  )
}
