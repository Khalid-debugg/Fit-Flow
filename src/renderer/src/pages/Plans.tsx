import { useEffect, useState, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plan, PlanFilter } from '@renderer/models/plan'
import { EditPlan, PlansFilter, PlansGrid, CreatePlan } from '@renderer/components/plans'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'

function Plans() {
  const { t } = useTranslation('plans')
  const { hasPermission } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<PlanFilter>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)

  // Check if user has permission to view plans
  if (!hasPermission(PERMISSIONS.plans.view)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-300 mb-2">{t('errors.noPermission')}</h2>
          <p className="text-gray-400">{t('errors.noPermissionMessage')}</p>
        </div>
      </div>
    )
  }

  const loadPlans = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.electron.ipcRenderer.invoke('plans:get', page, filter)
      setPlans(data.plans)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Failed to load plans:', error)
      toast.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [page, filter, t])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const handleFilterChange = useCallback((newFilter: PlanFilter) => {
    setFilter(newFilter)
    setPage(1)
  }, [])

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await window.electron.ipcRenderer.invoke('plans:delete', id)
        toast.success(t('success.deleteSuccess'))
        loadPlans()
      } catch (error) {
        console.error('Failed to delete plan:', error)
        toast.error(t('errors.deleteFailed'))
      }
    },
    [loadPlans, t]
  )

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  return (
    <div className="space-y-6">
      <EditPlan
        plan={editPlan}
        open={!!editPlan}
        onClose={() => setEditPlan(null)}
        onSuccess={loadPlans}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        {hasPermission(PERMISSIONS.plans.create) && <CreatePlan onSuccess={loadPlans} />}
      </div>

      <PlansFilter filter={filter} onChange={handleFilterChange} />

      {loading ? (
        <div className="text-center mt-20 text-gray-400">
          <LoaderCircle className="mx-auto h-20 w-20 animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('noPlans')}</div>
      ) : (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <PlansGrid
            plans={plans}
            page={page}
            totalPages={totalPages}
            onEdit={setEditPlan}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
            hasPermission={hasPermission}
          />
        </div>
      )}
    </div>
  )
}

export default memo(Plans)
