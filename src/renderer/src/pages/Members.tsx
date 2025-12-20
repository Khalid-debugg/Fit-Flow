import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_FILTERS, Member, MemberFilters } from '@renderer/models/member'
import {
  ViewMember,
  EditMember,
  MembersFilter,
  MembersTable,
  CreateMember
} from '@renderer/components/members'
import { toast } from 'sonner'
import { useDebounce } from '@renderer/hooks/useDebounce'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'

export default function Members() {
  const { t } = useTranslation('members')
  const { hasPermission } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<MemberFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMember, setViewMember] = useState<Member | null>(null)
  const [editMember, setEditMember] = useState<Member | null>(null)

  const debouncedFilters = useDebounce(filters, 500)

  // Check if user has permission to view members
  if (!hasPermission(PERMISSIONS.members.view)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-300 mb-2">{t('errors.noPermission')}</h2>
          <p className="text-gray-400">{t('errors.noPermissionMessage')}</p>
        </div>
      </div>
    )
  }

  const loadMembers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.electron.ipcRenderer.invoke('members:get', page, debouncedFilters)
      setMembers(data.members)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Failed to load members:', error)
      toast.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedFilters, t])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const handleFilterChange = useCallback((newFilters: MemberFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await window.electron.ipcRenderer.invoke('members:delete', id)
        toast.success(t('success.deleteSuccess'))
        loadMembers()
      } catch (error) {
        console.error('Failed to delete member:', error)
        toast.error(t('errors.deleteFailed'))
      }
    },
    [loadMembers, t]
  )

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  return (
    <div className="space-y-6">
      {hasPermission(PERMISSIONS.members.view_details) && (
        <ViewMember member={viewMember} open={!!viewMember} onClose={() => setViewMember(null)} />
      )}
      {hasPermission(PERMISSIONS.members.edit) && (
        <EditMember
          member={editMember}
          open={!!editMember}
          onClose={() => setEditMember(null)}
          onSuccess={loadMembers}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        {hasPermission(PERMISSIONS.members.create) && <CreateMember onSuccess={loadMembers} />}
      </div>

      <MembersFilter filters={filters} onChange={handleFilterChange} onReset={handleResetFilters} />

      {loading ? (
        <div className="text-center mt-20 text-gray-400">
          <LoaderCircle className="mx-auto h-20 w-20 animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('noMembers')}</div>
      ) : (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <MembersTable
            members={members}
            page={page}
            totalPages={totalPages}
            onRowClick={hasPermission(PERMISSIONS.members.view_details) ? setViewMember : undefined}
            onEdit={hasPermission(PERMISSIONS.members.edit) ? setEditMember : undefined}
            onDelete={hasPermission(PERMISSIONS.members.delete) ? handleDelete : undefined}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}
