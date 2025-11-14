import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DEFAULT_FILTERS,
  CheckIn,
  CheckInFilters,
  CheckInStats as Stats
} from '@renderer/models/checkIn'

import { toast } from 'sonner'
import { useDebounce } from '@renderer/hooks/useDebounce'
import { LoaderCircle } from 'lucide-react'
import {
  CheckInHistory,
  CheckInsFilter,
  CheckInsTable,
  CheckInStats,
  QuickCheckIn
} from '@renderer/components/checkIns'

export default function CheckIns() {
  const { t } = useTranslation('checkIns')
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<CheckInFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<Stats>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    activeMembers: 0
  })
  const [historyMemberId, setHistoryMemberId] = useState<string | null>(null)
  const [historyMemberName, setHistoryMemberName] = useState('')

  const debouncedFilters = useDebounce(filters, 500)

  const loadCheckIns = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.electron.ipcRenderer.invoke('checkIns:get', page, debouncedFilters)
      setCheckIns(data.checkIns)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Failed to load check-ins:', error)
      toast.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedFilters, t])

  const loadStats = useCallback(async () => {
    try {
      const data = await window.electron.ipcRenderer.invoke('checkIns:getStats')
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }, [])

  useEffect(() => {
    loadCheckIns()
  }, [loadCheckIns])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleFilterChange = useCallback((newFilters: CheckInFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleCheckInSuccess = useCallback(() => {
    loadCheckIns()
    loadStats()
  }, [loadCheckIns, loadStats])

  const handleViewHistory = useCallback(
    (memberId: string) => {
      const checkIn = checkIns.find((ci) => ci.memberId === memberId)
      if (checkIn) {
        setHistoryMemberId(memberId)
        setHistoryMemberName(checkIn.memberName || '')
      }
    },
    [checkIns]
  )

  return (
    <div className="space-y-6">
      <CheckInHistory
        memberId={historyMemberId}
        memberName={historyMemberName}
        open={!!historyMemberId}
        onClose={() => setHistoryMemberId(null)}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>

      <CheckInStats stats={stats} />

      <QuickCheckIn onCheckInSuccess={handleCheckInSuccess} />

      <CheckInsFilter
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Table */}
      {loading ? (
        <div className="text-center mt-20 text-gray-400">
          <LoaderCircle className="mx-auto h-20 w-20 animate-spin" />
        </div>
      ) : checkIns.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('noCheckIns')}</div>
      ) : (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <CheckInsTable
            checkIns={checkIns}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onViewHistory={handleViewHistory}
          />
        </div>
      )}
    </div>
  )
}
