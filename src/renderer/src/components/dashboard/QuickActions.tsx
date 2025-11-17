import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'
import { UserPlus, CreditCard, Package, Users, FileText, Grid, Zap } from 'lucide-react'

export default function QuickActions() {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()

  const actions = [
    {
      label: t('quickActions.addMember'),
      icon: UserPlus,
      onClick: () => navigate('/members?action=create'),
      color: 'blue'
    },
    {
      label: t('quickActions.addMembership'),
      icon: CreditCard,
      onClick: () => navigate('/memberships?action=create'),
      color: 'green'
    },
    {
      label: t('quickActions.createPlan'),
      icon: Package,
      onClick: () => navigate('/plans?action=create'),
      color: 'purple'
    },
    {
      label: t('quickActions.viewMembers'),
      icon: Users,
      onClick: () => navigate('/members'),
      color: 'orange'
    },
    {
      label: t('quickActions.viewMemberships'),
      icon: FileText,
      onClick: () => navigate('/memberships'),
      color: 'pink'
    },
    {
      label: t('quickActions.viewPlans'),
      icon: Grid,
      onClick: () => navigate('/plans'),
      color: 'indigo'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
      green: 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
      purple: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30',
      orange: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30',
      pink: 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30',
      indigo: 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">{t('quickActions.title')}</h3>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            onClick={action.onClick}
            className={`h-auto py-4 flex flex-col items-center gap-2 ${getColorClasses(action.color)} border border-gray-700`}
          >
            <action.icon className="w-6 h-6" />
            <span className="text-xs font-medium text-center">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
