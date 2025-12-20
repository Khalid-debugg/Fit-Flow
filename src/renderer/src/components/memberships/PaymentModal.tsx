import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { CalendarIcon, DollarSign } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Calendar } from '@renderer/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Textarea } from '@renderer/components/ui/textarea'
import { PAYMENT_METHODS } from '@renderer/models/membership'
import { PERMISSIONS } from '@renderer/models/account'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAuth } from '@renderer/hooks/useAuth'
import { cn } from '@renderer/lib/utils'
import { toast } from 'sonner'

interface PaymentModalProps {
  membershipId: string
  memberName: string
  remainingBalance: number
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentModal({
  membershipId,
  memberName,
  remainingBalance,
  open,
  onClose,
  onSuccess
}: PaymentModalProps) {
  const { t, i18n } = useTranslation('memberships')
  const { hasPermission } = useAuth()
  const { settings } = useSettings()
  const dateLocale = i18n.language === 'ar' ? ar : enUS
  const [loading, setLoading] = useState(false)

  const [amount, setAmount] = useState<number>(remainingBalance)
  const [paymentMethod, setPaymentMethod] = useState<string>(
    settings?.defaultPaymentMethod || 'cash'
  )
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasPermission(PERMISSIONS.memberships.add_payment)) {
      toast.error(t('errors.noPermission'))
      return
    }

    if (amount <= 0 || amount > remainingBalance) {
      toast.error(t('errors.invalidAmount'))
      return
    }

    if (!paymentMethod || !paymentDate) {
      toast.error(t('errors.requiredFields'))
      return
    }

    setLoading(true)

    try {
      await window.electron.ipcRenderer.invoke('memberships:addPayment', membershipId, {
        amount,
        paymentMethod,
        paymentDate,
        notes: notes || null
      })

      toast.success(t('success.paymentAdded'))
      onSuccess()
      onClose()

      // Reset form
      setAmount(0)
      setNotes('')
      setPaymentDate(new Date().toISOString().split('T')[0])
    } catch (error) {
      console.error('Failed to add payment:', error)
      toast.error(t('errors.paymentFailed'))
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(settings?.language, {
      style: 'currency',
      currency: settings?.currency,
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('payment.addPayment')}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">{t('payment.member')}:</span>
            <span className="font-medium">{memberName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">{t('payment.remainingBalance')}:</span>
            <span className="text-xl font-bold text-yellow-500">
              {formatCurrency(remainingBalance)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-gray-200">
              {t('payment.amount')} ({settings?.currency}) *
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max={remainingBalance}
              required
              className="bg-gray-800 border-gray-700 text-white"
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(Math.round(remainingBalance * 0.25 * 100) / 100)}
              >
                25%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(Math.round(remainingBalance * 0.5 * 100) / 100)}
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(Math.round(remainingBalance * 0.75 * 100) / 100)}
              >
                75%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(remainingBalance)}
              >
                {t('payment.payFull')}
              </Button>
            </div>
            {amount > 0 && (
              <div className="text-sm">
                <span className="text-gray-400">{t('payment.newBalance')}: </span>
                <span
                  className={cn(
                    'font-semibold',
                    remainingBalance - amount === 0 ? 'text-green-500' : 'text-yellow-500'
                  )}
                >
                  {formatCurrency(remainingBalance - amount)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate" className="text-gray-200">
              {t('payment.date')} *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="primary"
                  className={cn(
                    'w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700',
                    !paymentDate && 'text-gray-400'
                  )}
                >
                  <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                  {paymentDate
                    ? format(new Date(paymentDate), 'MM/dd/yyyy', { locale: dateLocale })
                    : t('form.pickDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate ? new Date(paymentDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setPaymentDate(format(date, 'yyyy-MM-dd'))
                    }
                  }}
                  locale={dateLocale}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">{t('payment.method')} *</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="flex gap-4 rtl:flex-row-reverse"
            >
              {PAYMENT_METHODS.map((method) => (
                <div key={method} className="flex items-center space-x-2">
                  <RadioGroupItem value={method} id={`payment-method-${method}`} />
                  <Label
                    htmlFor={`payment-method-${method}`}
                    className="text-gray-300 cursor-pointer"
                  >
                    {t(`paymentMethods.${method}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-200">
              {t('payment.notes')}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white min-h-20"
              placeholder={t('payment.notesPlaceholder')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="primary" onClick={onClose} disabled={loading}>
              {t('form.cancel')}
            </Button>
            <Button type="submit" variant="secondary" disabled={loading}>
              {loading ? t('payment.processing') : t('payment.addPayment')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
