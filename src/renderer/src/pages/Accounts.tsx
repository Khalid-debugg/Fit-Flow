import { useEffect, useState, useCallback } from 'react'
import { DEFAULT_FILTERS, User, UserFilters, PERMISSIONS } from '@renderer/models/account'
import {
  ViewAccount,
  EditAccount,
  AccountsFilter,
  AccountsTable,
  CreateAccount
} from '@renderer/components/accounts'
import { toast } from 'sonner'
import { useDebounce } from '@renderer/hooks/useDebounce'
import { useAuth } from '@renderer/hooks/useAuth'
import { LoaderCircle, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Accounts() {
  const { t } = useTranslation('accounts')
  const { hasPermission } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewUser, setViewUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)

  const debouncedFilters = useDebounce(filters, 500)

  // Check permissions
  const canView = hasPermission(PERMISSIONS.accounts.view)
  const canCreate = hasPermission(PERMISSIONS.accounts.create)
  const canEdit = hasPermission(PERMISSIONS.accounts.edit)
  const canDelete = hasPermission(PERMISSIONS.accounts.delete)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.electron.ipcRenderer.invoke('accounts:get', page, debouncedFilters)
      setUsers(data.users)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Failed to load accounts:', error)
      toast.error('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedFilters])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleFilterChange = useCallback((newFilters: UserFilters) => {
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
        await window.electron.ipcRenderer.invoke('accounts:delete', id)
        toast.success('Account deleted successfully')
        loadUsers()
      } catch (error) {
        if ((error as Error).message === 'CANNOT_DELETE_LAST_ADMIN') {
          toast.error('Cannot delete the last administrator account')
        } else {
          toast.error('Failed to delete account')
        }
        console.error('Failed to delete account:', error)
      }
    },
    [loadUsers]
  )

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  // Check if user has view permission
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <ShieldAlert className="h-16 w-16 text-red-400" />
        <h2 className="text-2xl font-bold text-white">{t('unauthorized.title')}</h2>
        <p className="text-gray-400">{t('unauthorized.description')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ViewAccount user={viewUser} open={!!viewUser} onClose={() => setViewUser(null)} />
      <EditAccount
        user={editUser}
        open={!!editUser}
        onClose={() => setEditUser(null)}
        onSuccess={loadUsers}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-gray-400 mt-1">{t('description')}</p>
        </div>
        {canCreate && <CreateAccount onSuccess={loadUsers} />}
      </div>

      <AccountsFilter
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {loading ? (
        <div className="text-center mt-20 text-gray-400">
          <LoaderCircle className="mx-auto h-20 w-20 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No accounts found</div>
      ) : (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <AccountsTable
            users={users}
            page={page}
            totalPages={totalPages}
            onRowClick={setViewUser}
            onEdit={setEditUser}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      )}
    </div>
  )
}
