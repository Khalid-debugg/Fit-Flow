import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_FILTERS, Membership, MembershipFilters } from '@renderer/models/membership'
import { PERMISSIONS } from '@renderer/models/account'
import { toast } from 'sonner'
import { useDebounce } from '@renderer/hooks/useDebounce'
import { useAuth } from '@renderer/hooks/useAuth'
import { LoaderCircle } from 'lucide-react'
import ViewMembership from '@renderer/components/memberships/ViewMembership'
import EditMembership from '@renderer/components/memberships/EditMembership'
import CreateMembership from '@renderer/components/memberships/CreateMembership'
import MembershipsFilter from '@renderer/components/memberships/MembershipsFilter'
import MembershipsTable from '@renderer/components/memberships/MembershipsTable'

export default function Memberships() {
  const { t } = useTranslation('memberships')
  const { hasPermission } = useAuth()
  const [searchParams] = useSearchParams()
  const preSelectedMemberId = searchParams.get('memberId')

  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<MembershipFilters>({
    ...DEFAULT_FILTERS,
    memberId: preSelectedMemberId || ''
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMembership, setViewMembership] = useState<Membership | null>(null)
  const [editMembership, setEditMembership] = useState<Membership | null>(null)

  const debouncedFilters = useDebounce(filters, 500)

  const loadMemberships = useCallback(async () => {
    if (!hasPermission(PERMISSIONS.memberships.view)) {
      toast.error(t('errors.noPermission'))
      return
    }

    setLoading(true)
    try {
      const data = await window.electron.ipcRenderer.invoke(
        'memberships:get',
        page,
        debouncedFilters
      )
      setMemberships(data.memberships)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Failed to load memberships:', error)
      toast.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedFilters, t, hasPermission])

  useEffect(() => {
    loadMemberships()
  }, [loadMemberships])

  const handleFilterChange = useCallback((newFilters: MembershipFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  const handleResetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, memberId: preSelectedMemberId || '' })
    setPage(1)
  }, [preSelectedMemberId])

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await window.electron.ipcRenderer.invoke('memberships:delete', id)
        toast.success(t('success.deleteSuccess'))
        loadMemberships()
      } catch (error) {
        console.error('Failed to delete membership:', error)
        toast.error(t('errors.deleteFailed'))
      }
    },
    [loadMemberships, t]
  )

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleViewMembership = useCallback(
    (membership: Membership) => {
      if (!hasPermission(PERMISSIONS.memberships.view_details)) {
        toast.error(t('errors.noPermission'))
        return
      }
      setViewMembership(membership)
    },
    [hasPermission, t]
  )

  return (
    <div className="space-y-6">
      <ViewMembership
        membership={viewMembership}
        open={!!viewMembership}
        onClose={() => setViewMembership(null)}
        onSuccess={loadMemberships}
      />
      <EditMembership
        membership={editMembership}
        open={!!editMembership}
        onClose={() => setEditMembership(null)}
        onSuccess={loadMemberships}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        {hasPermission(PERMISSIONS.memberships.create) && (
          <CreateMembership
            onSuccess={loadMemberships}
            preSelectedMemberId={preSelectedMemberId || undefined}
          />
        )}
      </div>

      <MembershipsFilter
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {loading ? (
        <div className="text-center mt-20 text-gray-400">
          <LoaderCircle className="mx-auto h-20 w-20 animate-spin" />
        </div>
      ) : memberships.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('noMemberships')}</div>
      ) : (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <MembershipsTable
            memberships={memberships}
            page={page}
            totalPages={totalPages}
            onRowClick={handleViewMembership}
            onEdit={setEditMembership}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}
