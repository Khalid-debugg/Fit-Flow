import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Users, UserCheck, DollarSign, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { t } = useTranslation('common')

  const stats = [
    {
      title: t('dashboard.totalMembers'),
      value: '0',
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: t('dashboard.activeMembers'),
      value: '0',
      icon: UserCheck,
      color: 'text-green-500'
    },
    {
      title: t('dashboard.todayCheckins'),
      value: '0',
      icon: TrendingUp,
      color: 'text-purple-500'
    },
    {
      title: t('dashboard.monthlyRevenue'),
      value: '$0',
      icon: DollarSign,
      color: 'text-yellow-500'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">{t('dashboard.welcome')}</h1>
        <p className="text-muted-foreground mt-2">{t('dashboard.overview')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button className="h-24 flex flex-col gap-2">
              <UserCheck className="h-6 w-6" />
              <span>{t('dashboard.checkInMember')}</span>
            </Button>
            <Button className="h-24 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>{t('dashboard.addMember')}</span>
            </Button>
            <Button className="h-24 flex flex-col gap-2">
              <DollarSign className="h-6 w-6" />
              <span>{t('dashboard.recordPayment')}</span>
            </Button>
            <Button className="h-24 flex flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>{t('dashboard.viewReports')}</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">No recent activity</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
