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
import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'
import { LoaderCircle, Lock } from 'lucide-react'
import {
  CheckInHistory,
  CheckInsFilter,
  CheckInsTable,
  CheckInStats,
  QuickCheckInWidget
} from '@renderer/components/checkIns'
import MemberCheckInCard from '@renderer/components/checkIns/MemberCheckInCard'
import { Member } from '@renderer/models/member'

export default function CheckIns() {
  const { t } = useTranslation('checkIns')
  const { hasPermission } = useAuth()
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
  const [viewMemberCard, setViewMemberCard] = useState<Member | null>(null)

  const debouncedFilters = useDebounce(filters, 500)

  const canViewCheckIns = hasPermission(PERMISSIONS.checkins.view)
  const canCreateCheckIn = hasPermission(PERMISSIONS.checkins.create)

  const loadCheckIns = useCallback(async () => {
    if (!canViewCheckIns) return

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
  }, [page, debouncedFilters, t, canViewCheckIns])

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

  const handleRowClick = useCallback(
    async (memberId: string) => {
      try {
        const member = await window.electron.ipcRenderer.invoke('members:getById', memberId)
        if (member) {
          setViewMemberCard(member)
        }
      } catch (error) {
        console.error('Failed to load member:', error)
        toast.error(t('errors.loadFailed'))
      }
    },
    [t]
  )

  // Show permission denied if user cannot view check-ins
  if (!canViewCheckIns) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Lock className="w-16 h-16 text-gray-600" />
        <h2 className="text-2xl font-semibold text-gray-400">Access Denied</h2>
        <p className="text-gray-500">You don't have permission to view check-ins</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CheckInHistory
        memberId={historyMemberId}
        memberName={historyMemberName}
        open={!!historyMemberId}
        onClose={() => setHistoryMemberId(null)}
      />

      {viewMemberCard && (
        <MemberCheckInCard
          member={viewMemberCard}
          open={!!viewMemberCard}
          onCancel={() => setViewMemberCard(null)}
          viewOnly={true}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>

      <CheckInStats stats={stats} />

      {canCreateCheckIn && <QuickCheckInWidget onCheckInSuccess={handleCheckInSuccess} />}

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
            onRowClick={handleRowClick}
          />
        </div>
      )}
    </div>
  )
}
