// src/renderer/src/components/reports/ReportPreview.tsx

import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import {
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  ClipboardCheck,
  Calendar,
  Activity
} from 'lucide-react'
import { ReportData } from '@renderer/models/report'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'

interface ReportPreviewProps {
  data: ReportData
  startDate: string
  endDate: string
  onPrint: () => void
  onDownload: () => void
}

export default function ReportPreview({
  data,
  startDate,
  endDate,
  onPrint,
  onDownload
}: ReportPreviewProps) {
  const { t, i18n } = useTranslation('reports')
  const { hasPermission } = useAuth()
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  // Check if user has permission to save/download reports
  const canSave = hasPermission(PERMISSIONS.reports.save)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getChangeBgColor = (change: number) => {
    if (change > 0) return 'bg-green-50'
    if (change < 0) return 'bg-red-50'
    return 'bg-gray-50'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-5 h-5" />
    if (change < 0) return <TrendingDown className="w-5 h-5" />
    return <Activity className="w-5 h-5" />
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
      {/* Header - Don't print */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 p-6 no-print">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h1 className="text-2xl font-bold mb-1">{t('pdf.title')}</h1>
            <p className="text-blue-100 text-sm">
              {format(new Date(startDate), 'dd MMMM yyyy', { locale: dateLocale })} -{' '}
              {format(new Date(endDate), 'dd MMMM yyyy', { locale: dateLocale })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onPrint}
              className="gap-2 bg-white hover:bg-gray-100 text-blue-700"
            >
              <Printer className="w-4 h-4" />
              {t('preview.print')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onDownload}
              disabled={!canSave}
              className="gap-2 bg-blue-800 hover:bg-blue-900"
              title={!canSave ? 'You do not have permission to download reports' : ''}
            >
              <Download className="w-4 h-4" />
              {t('preview.download')}
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div id="report-content" className="p-8 bg-white">
        {/* Print Header - Only show when printing */}
        <div className="print-only mb-8 pb-6 border-b-2 border-gray-300">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{t('pdf.title')}</h1>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p className="text-lg">
              {format(new Date(startDate), 'dd MMMM yyyy', { locale: dateLocale })} -{' '}
              {format(new Date(endDate), 'dd MMMM yyyy', { locale: dateLocale })}
            </p>
            <p>
              {t('pdf.generatedOn')}: {format(new Date(), 'dd MMMM yyyy', { locale: dateLocale })}
            </p>
          </div>
        </div>

        {/* Key Metrics with Comparisons */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
            {t('pdf.keyMetrics')}
          </h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Revenue */}
            <div className="bg-linear-to-br from-green-50 to-white p-6 rounded-xl border-2 border-green-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-full ${getChangeBgColor(data.comparison.revenue.change)} ${getChangeColor(data.comparison.revenue.change)} font-bold`}
                >
                  {getChangeIcon(data.comparison.revenue.change)}
                  <span className="text-lg">{formatChange(data.comparison.revenue.change)}</span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                {t('pdf.totalRevenue')}
              </h3>
              <p className="text-4xl font-bold text-gray-900 mb-4">
                {formatCurrency(data.summary.totalRevenue)}
              </p>
              <div className="pt-4 border-t border-green-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">{t('pdf.previous')}:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(data.comparison.revenue.previous)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('pdf.difference')}:</span>
                  <span
                    className={`font-bold ${getChangeColor(data.comparison.revenue.difference)}`}
                  >
                    {data.comparison.revenue.difference >= 0 ? '+' : ''}
                    {formatCurrency(data.comparison.revenue.difference)}
                  </span>
                </div>
              </div>
            </div>

            {/* New Members */}
            <div className="bg-linear-to-br from-blue-50 to-white p-6 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-full ${getChangeBgColor(data.comparison.members.change)} ${getChangeColor(data.comparison.members.change)} font-bold`}
                >
                  {getChangeIcon(data.comparison.members.change)}
                  <span className="text-lg">{formatChange(data.comparison.members.change)}</span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                {t('pdf.newMembers')}
              </h3>
              <p className="text-4xl font-bold text-gray-900 mb-4">{data.summary.newMembers}</p>
              <div className="pt-4 border-t border-blue-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">{t('pdf.previous')}:</span>
                  <span className="font-semibold text-gray-900">
                    {data.comparison.members.previous}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('pdf.difference')}:</span>
                  <span
                    className={`font-bold ${getChangeColor(data.comparison.members.difference)}`}
                  >
                    {data.comparison.members.difference >= 0 ? '+' : ''}
                    {data.comparison.members.difference}
                  </span>
                </div>
              </div>
            </div>

            {/* Memberships */}
            <div className="bg-linear-to-br from-yellow-50 to-white p-6 rounded-xl border-2 border-yellow-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <CreditCard className="w-8 h-8 text-yellow-600" />
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-full ${getChangeBgColor(data.comparison.memberships.change)} ${getChangeColor(data.comparison.memberships.change)} font-bold`}
                >
                  {getChangeIcon(data.comparison.memberships.change)}
                  <span className="text-lg">
                    {formatChange(data.comparison.memberships.change)}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                {t('pdf.newMemberships')}
              </h3>
              <p className="text-4xl font-bold text-gray-900 mb-4">{data.summary.newMemberships}</p>
              <div className="pt-4 border-t border-yellow-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">{t('pdf.previous')}:</span>
                  <span className="font-semibold text-gray-900">
                    {data.comparison.memberships.previous}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('pdf.difference')}:</span>
                  <span
                    className={`font-bold ${getChangeColor(data.comparison.memberships.difference)}`}
                  >
                    {data.comparison.memberships.difference >= 0 ? '+' : ''}
                    {data.comparison.memberships.difference}
                  </span>
                </div>
              </div>
            </div>

            {/* Check-Ins */}
            <div className="bg-linear-to-br from-purple-50 to-white p-6 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <ClipboardCheck className="w-8 h-8 text-purple-600" />
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-full ${getChangeBgColor(data.comparison.checkIns.change)} ${getChangeColor(data.comparison.checkIns.change)} font-bold`}
                >
                  {getChangeIcon(data.comparison.checkIns.change)}
                  <span className="text-lg">{formatChange(data.comparison.checkIns.change)}</span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                {t('pdf.totalCheckIns')}
              </h3>
              <p className="text-4xl font-bold text-gray-900 mb-4">{data.summary.totalCheckIns}</p>
              <div className="pt-4 border-t border-purple-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">{t('pdf.previous')}:</span>
                  <span className="font-semibold text-gray-900">
                    {data.comparison.checkIns.previous}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('pdf.difference')}:</span>
                  <span
                    className={`font-bold ${getChangeColor(data.comparison.checkIns.difference)}`}
                  >
                    {data.comparison.checkIns.difference >= 0 ? '+' : ''}
                    {data.comparison.checkIns.difference}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
            {t('pdf.additionalMetrics')}
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-linear-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow">
              <Calendar className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {t('pdf.totalMembers')}
              </p>
              <p className="text-3xl font-bold text-gray-900">{data.summary.totalMembers}</p>
            </div>
            <div className="bg-linear-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow">
              <Activity className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {t('pdf.activeMembers')}
              </p>
              <p className="text-3xl font-bold text-gray-900">{data.summary.activeMembers}</p>
            </div>
            <div className="bg-linear-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow">
              <TrendingUp className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {t('pdf.avgDailyRevenue')}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.summary.averageDailyRevenue)}
              </p>
            </div>
            <div className="bg-linear-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow">
              <ClipboardCheck className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {t('pdf.avgDailyCheckIns')}
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(data.summary.averageDailyCheckIns)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t-2 border-gray-200 text-center">
          <p className="text-sm text-gray-500">{t('pdf.footer')}</p>
        </div>
      </div>
    </div>
  )
}
