import { memo, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { useSettings } from '@renderer/hooks/useSettings'

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

interface RevenueChartProps {
  data: RevenueData
}

function RevenueChart({ data }: RevenueChartProps) {
  const { t } = useTranslation('dashboard')
  const { settings } = useSettings()

  const chartData = useMemo(() => {
    return data.dailyRevenue.map((item) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: item.revenue
    }))
  }, [data.dailyRevenue])

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat(settings?.language, {
      style: 'currency',
      currency: settings?.currency,
      minimumFractionDigits: 0
    }).format(value)
  }, [settings?.language, settings?.currency])

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">{t('revenueChart.title')}</h2>
        <p className="text-sm text-gray-400">{t('revenueChart.subtitle')}</p>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">{t('revenueChart.thisMonth')}</span>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(data.summary.totalThisMonth)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {data.summary.percentageChange >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span
              className={`text-sm ${data.summary.percentageChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {data.summary.percentageChange >= 0 ? '+' : ''}
              {data.summary.percentageChange}%
            </span>
          </div>
        </div>

        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">{t('revenueChart.lastMonth')}</span>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(data.summary.totalLastMonth)}
          </p>
        </div>

        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">{t('revenueChart.avgDaily')}</span>
            <DollarSign className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(data.summary.averageDaily)}
          </p>
        </div>

        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">{t('revenueChart.highestDay')}</span>
            <Calendar className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(data.summary.highestDay.revenue)}
          </p>
          {data.summary.highestDay.date && (
            <p className="text-xs text-gray-500 mt-1">
              {new Date(data.summary.highestDay.date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(RevenueChart)
