import { useEffect, useState, useCallback } from 'react'
import { LoaderCircle } from 'lucide-react'
import {
  WelcomeHeader,
  RevenueChart,
  RecentCheckIns,
  ExpiringMemberships,
  QuickActions
} from '@renderer/components/dashboard'
import { ViewMember } from '@renderer/components/members'
import { Member } from '@renderer/models/member'
import { QuickCheckInWidget } from '@renderer/components/checkIns'
import { Membership } from '@renderer/models/membership'
import EditMembership from '@renderer/components/memberships/EditMembership'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface RevenueData {
  dailyRevenue: { date: string; revenue: number }[]
  summary: {
    totalThisMonth: number
    totalLastMonth: number
    percentageChange: number
    averageDaily: number
    highestDay: { date: string; revenue: number }
  }
}

interface CheckIn {
  id: string
  memberId: string
  checkInTime: string
  memberName: string
  memberPhone: string
  membershipStatus: 'active' | 'expired' | 'none'
}

export type ExpiringMembership = Membership & { daysRemaining: number }

export default function Dashboard() {
  const { t } = useTranslation('dashboard')
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState<RevenueData>({
    dailyRevenue: [],
    summary: {
      totalThisMonth: 0,
      totalLastMonth: 0,
      percentageChange: 0,
      averageDaily: 0,
      highestDay: { date: '', revenue: 0 }
    }
  })

  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([])
  const [checkInsPage, setCheckInsPage] = useState(1)
  const [checkInsTotalPages, setCheckInsTotalPages] = useState(1)

  const [expiringMemberships, setExpiringMemberships] = useState<ExpiringMembership[]>([])
  const [expiringPage, setExpiringPage] = useState(1)
  const [expiringTotalPages, setExpiringTotalPages] = useState(1)

  // Dialog states
  const [viewMember, setViewMember] = useState<Member | null>(null)
  const [editMembershipId, setEditMembershipId] = useState<string | null>(null)
  const [editMembership, setEditMembership] = useState<Membership | null>(null)

  const loadCheckIns = useCallback(async (page: number) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('dashboard:getRecentCheckIns', page)
      setRecentCheckIns(result.data)
      setCheckInsPage(result.page)
      setCheckInsTotalPages(result.totalPages)
    } catch (error) {
      console.error('Failed to load check-ins:', error)
    }
  }, [])

  const loadExpiringMemberships = useCallback(async (page: number) => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'dashboard:getExpiringMemberships',
        page
      )
      setExpiringMemberships(result.data)
      setExpiringPage(result.page)
      setExpiringTotalPages(result.totalPages)
    } catch (error) {
      console.error('Failed to load expiring memberships:', error)
    }
  }, [])

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [revenue] = await Promise.all([
        window.electron.ipcRenderer.invoke('dashboard:getRevenueData'),
        loadCheckIns(1),
        loadExpiringMemberships(1)
      ])

      setRevenueData(revenue)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [loadCheckIns, loadExpiringMemberships])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleViewMember = async (memberId: string) => {
    try {
      const member = await window.electron.ipcRenderer.invoke('members:getById', memberId)
      setViewMember(member)
    } catch (error) {
      console.error('Failed to load member:', error)
    }
  }

  const handleRenewMembership = async (membershipId: string) => {
    try {
      await window.electron.ipcRenderer.invoke('memberships:extend', membershipId)
      toast.success(t('success.extendSuccess'))
    } catch (error) {
      toast.warning(t('error.extendFail'))
      console.error('Failed to load member:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoaderCircle className="w-20 h-20 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ViewMember member={viewMember} open={!!viewMember} onClose={() => setViewMember(null)} />
      <EditMembership
        membership={editMembership}
        open={!!editMembershipId}
        onClose={() => {
          setEditMembershipId(null)
          setEditMembership(null)
        }}
        onSuccess={loadDashboardData}
      />

      <WelcomeHeader />

      <QuickCheckInWidget onCheckInSuccess={loadDashboardData} />

      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentCheckIns
          data={recentCheckIns}
          onViewMember={handleViewMember}
          page={checkInsPage}
          totalPages={checkInsTotalPages}
          onPageChange={loadCheckIns}
        />

        <ExpiringMemberships
          data={expiringMemberships}
          onRenew={handleRenewMembership}
          page={expiringPage}
          totalPages={expiringTotalPages}
          onPageChange={loadExpiringMemberships}
        />
      </div>
      <RevenueChart data={revenueData} />
    </div>
  )
}
