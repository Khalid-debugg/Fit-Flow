import { useTranslation } from 'react-i18next'
import { CheckInStats as Stats } from '@renderer/models/checkIn'
import { Calendar, TrendingUp, Users, CheckCircle } from 'lucide-react'

interface CheckInStatsProps {
  stats: Stats
}

export default function CheckInStats({ stats }: CheckInStatsProps) {
  const { t } = useTranslation('checkIns')

  const statsCards = [
    {
      label: t('stats.today'),
      value: stats.today,
      icon: Calendar,
      color: 'blue'
    },
    {
      label: t('stats.week'),
      value: stats.thisWeek,
      icon: TrendingUp,
      color: 'green'
    },
    {
      label: t('stats.month'),
      value: stats.thisMonth,
      icon: CheckCircle,
      color: 'purple'
    },
    {
      label: t('stats.active'),
      value: stats.activeMembers,
      icon: Users,
      color: 'orange'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500/20 text-blue-400',
      green: 'bg-green-500/20 text-green-400',
      purple: 'bg-purple-500/20 text-purple-400',
      orange: 'bg-orange-500/20 text-orange-400'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((stat) => (
        <div
          key={stat.label}
          className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(stat.color)}`}
            >
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
