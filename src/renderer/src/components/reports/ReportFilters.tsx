import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Calendar, FileText } from 'lucide-react'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear
} from 'date-fns'
import { ReportType, ReportFilters as IReportFilters } from '@renderer/models/report'

interface ReportFiltersProps {
  onGenerate: (filters: IReportFilters) => void
  loading: boolean
}

export default function ReportFilters({ onGenerate, loading }: ReportFiltersProps) {
  const { t } = useTranslation('reports')
  const [reportType, setReportType] = useState<ReportType>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleQuickSelect = (type: ReportType) => {
    setReportType(type)
    const today = new Date()
    let start: Date
    let end: Date

    switch (type) {
      case 'week':
        start = startOfWeek(today, { weekStartsOn: 6 }) // Saturday
        end = endOfWeek(today, { weekStartsOn: 6 })
        break
      case 'month':
        start = startOfMonth(today)
        end = endOfMonth(today)
        break
      case 'year':
        start = startOfYear(today)
        end = endOfYear(today)
        break
      default:
        return
    }

    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))
  }

  const handleGenerate = () => {
    if (!startDate || !endDate) {
      return
    }
    onGenerate({ reportType, startDate, endDate })
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">{t('filters.title')}</h2>
      </div>

      <div className="space-y-6">
        {/* Quick Select Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            {t('filters.quickSelect')}
          </label>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={reportType === 'week' ? 'primary' : 'secondary'}
              onClick={() => handleQuickSelect('week')}
              className="w-full"
            >
              {t('filters.thisWeek')}
            </Button>
            <Button
              variant={reportType === 'month' ? 'primary' : 'secondary'}
              onClick={() => handleQuickSelect('month')}
              className="w-full"
            >
              {t('filters.thisMonth')}
            </Button>
            <Button
              variant={reportType === 'year' ? 'primary' : 'secondary'}
              onClick={() => handleQuickSelect('year')}
              className="w-full"
            >
              {t('filters.thisYear')}
            </Button>
          </div>
        </div>

        {/* Custom Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            {t('filters.customRange')}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('filters.startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setReportType('custom')
                }}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('filters.endDate')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setReportType('custom')
                }}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={loading || !startDate || !endDate}
          className="w-full gap-2"
        >
          <FileText className="w-4 h-4" />
          {loading ? t('filters.generating') : t('filters.generate')}
        </Button>
      </div>
    </div>
  )
}
