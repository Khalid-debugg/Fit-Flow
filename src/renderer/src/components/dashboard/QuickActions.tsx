import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'
import { UserPlus, CreditCard, Package, Users, FileText, Grid, Zap } from 'lucide-react'
import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'

interface QuickActionsProps {
  onCreateMember?: () => void
  onCreateMembership?: () => void
  onCreatePlan?: () => void
}

export default function QuickActions({
  onCreateMember,
  onCreateMembership,
  onCreatePlan
}: QuickActionsProps) {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  const allActions = [
    {
      label: t('quickActions.addMember'),
      icon: UserPlus,
      onClick: onCreateMember || (() => navigate('/members?action=create')),
      permission: PERMISSIONS.members.create
    },
    {
      label: t('quickActions.addMembership'),
      icon: CreditCard,
      onClick: onCreateMembership || (() => navigate('/memberships?action=create')),
      permission: PERMISSIONS.memberships.create
    },
    {
      label: t('quickActions.createPlan'),
      icon: Package,
      onClick: onCreatePlan || (() => navigate('/plans?action=create')),
      permission: PERMISSIONS.plans.create
    },
    {
      label: t('quickActions.viewMembers'),
      icon: Users,
      onClick: () => navigate('/members'),
      permission: PERMISSIONS.members.view
    },
    {
      label: t('quickActions.viewMemberships'),
      icon: FileText,
      onClick: () => navigate('/memberships'),
      permission: PERMISSIONS.memberships.view
    },
    {
      label: t('quickActions.viewPlans'),
      icon: Grid,
      onClick: () => navigate('/plans'),
      permission: PERMISSIONS.plans.view
    }
  ]

  // Filter actions based on permissions
  const actions = allActions.filter((action) => hasPermission(action.permission))

  // Don't render if no actions are available
  if (actions.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">{t('quickActions.title')}</h3>
      </div>

      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            onClick={action.onClick}
            className="flex-1 min-w-[120px] h-auto py-4 flex flex-col items-center gap-2 bg-gray-900/50 text-gray-300 border border-gray-700 hover:bg-gradient-to-br hover:from-yellow-500/20 hover:to-orange-500/20 hover:border-yellow-500/50 hover:text-yellow-400 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300"
          >
            <action.icon className="w-6 h-6" />
            <span className="text-xs font-medium text-center">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
