import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Calendar as CalendarComponent } from '@renderer/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Calendar, CalendarIcon, FileText } from 'lucide-react'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear
} from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { ReportType, ReportFilters as IReportFilters } from '@renderer/models/report'
import { cn } from '@renderer/lib/utils'

interface ReportFiltersProps {
  onGenerate: (filters: IReportFilters) => void
  loading: boolean
}

export default function ReportFilters({ onGenerate, loading }: ReportFiltersProps) {
  const { t, i18n } = useTranslation('reports')
  const [reportType, setReportType] = useState<ReportType>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const dateLocale = i18n.language === 'ar' ? ar : enUS

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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="primary"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-gray-900 border-gray-700 text-white hover:bg-gray-800',
                      !startDate && 'text-gray-400'
                    )}
                  >
                    <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    {startDate
                      ? format(new Date(startDate), 'MM/dd/yyyy', { locale: dateLocale })
                      : t('filters.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate ? new Date(startDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(format(date, 'yyyy-MM-dd'))
                        setReportType('custom')
                      }
                    }}
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('filters.endDate')}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="primary"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-gray-900 border-gray-700 text-white hover:bg-gray-800',
                      !endDate && 'text-gray-400'
                    )}
                  >
                    <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    {endDate
                      ? format(new Date(endDate), 'MM/dd/yyyy', { locale: dateLocale })
                      : t('filters.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate ? new Date(endDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(format(date, 'yyyy-MM-dd'))
                        setReportType('custom')
                      }
                    }}
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
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
