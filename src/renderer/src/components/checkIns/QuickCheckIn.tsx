import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { ScanBarcode } from 'lucide-react'
import { useCheckIn } from '@renderer/hooks/useCheckIn'
import { toast } from 'sonner'
import MemberCheckInCard from './MemberCheckInCard'

interface QuickCheckInProps {
  onCheckInSuccess: () => void
}

export default function QuickCheckIn({ onCheckInSuccess }: QuickCheckInProps) {
  const { t } = useTranslation('checkIns')
  const [phoneNumber, setPhoneNumber] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { lookupMemberByPhone, confirmCheckIn, cancelCheckIn, memberCard, loading } = useCheckIn()

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Re-focus after check-in card closes
  useEffect(() => {
    if (!memberCard && !loading) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [memberCard, loading])

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && phoneNumber.trim()) {
      e.preventDefault()
      await handleLookup()
    }
  }

  const handleLookup = async () => {
    const result = await lookupMemberByPhone(phoneNumber.trim())

    if (!result.success) {
      toast.error(result.error)
      setPhoneNumber('')
    }
  }

  const handleConfirm = async () => {
    const result = await confirmCheckIn()

    if (result.success) {
      toast.success(t('messages.checkInSuccess'))
      setPhoneNumber('')
      onCheckInSuccess()
    } else {
      toast.error(result.error)
    }
  }

  const handleCancel = () => {
    cancelCheckIn()
    setPhoneNumber('')
  }

  return (
    <>
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <ScanBarcode className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-200">{t('quickCheckIn')}</h2>
            <p className="text-sm text-gray-400">{t('scanPrompt')}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone-number" className="text-gray-200 text-sm">
            {t('phoneNumber')}
          </Label>
          <Input
            ref={inputRef}
            id="phone-number"
            type="tel"
            placeholder={t('enterPhoneNumber')}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="bg-gray-900 border-gray-700 text-white text-lg h-12"
            autoComplete="off"
          />
          <p className="text-xs text-gray-500">{t('pressEnter')}</p>
        </div>
      </div>

      {/* Member Check-in Card Dialog */}
      {memberCard && (
        <MemberCheckInCard
          member={memberCard}
          open={!!memberCard}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          loading={loading}
        />
      )}
    </>
  )
}
