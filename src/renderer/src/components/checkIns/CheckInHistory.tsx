import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { CheckIn } from '@renderer/models/checkIn'
import { Calendar, Clock } from 'lucide-react'

interface CheckInHistoryProps {
  memberId: string | null
  memberName: string
  open: boolean
  onClose: () => void
}

export default function CheckInHistory({
  memberId,
  memberName,
  open,
  onClose
}: CheckInHistoryProps) {
  const { t } = useTranslation('checkIns')
  const [history, setHistory] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && memberId) {
      loadHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, memberId])

  const loadHistory = async () => {
    if (!memberId) return

    setLoading(true)
    try {
      const data = await window.electron.ipcRenderer.invoke('checkIns:getByMemberId', memberId)
      setHistory(data)
    } catch (error) {
      console.error('Failed to load check-in history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t('history.title')} - {memberName}
          </DialogTitle>
          <p className="text-sm text-gray-400">{t('history.subtitle')}</p>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-400">{t('loading')}</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-gray-400">{t('history.noHistory')}</div>
        ) : (
          <div className="space-y-3 py-4">
            {history.map((checkIn, index) => {
              const { date, time } = formatDateTime(checkIn.checkInTime)
              return (
                <div
                  key={checkIn.id}
                  className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {date}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                          <Clock className="w-3 h-3" />
                          {time}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="text-center text-xs text-gray-500 pt-2">
          {t('history.showing')} {history.length} {t('history.records')}
        </div>
      </DialogContent>
    </Dialog>
  )
}
