import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Calendar } from '@renderer/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Search, X, CalendarIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { MemberFilters } from '@renderer/models/member'
import { cn } from '@renderer/lib/utils'

interface MembersFilterProps {
  filters: MemberFilters
  onChange: (filters: MemberFilters) => void
  onReset: () => void
}

export default function MembersFilter({ filters, onChange, onReset }: MembersFilterProps) {
  const { t, i18n } = useTranslation('members')
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  const handleFilterChange = (key: keyof MemberFilters, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px] space-y-2">
          <Label htmlFor="search" className="text-gray-200 text-sm">
            {t('filters.search')}
          </Label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder={t('filters.searchPlaceholder')}
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="ps-10 bg-gray-900 border-gray-700"
            />
          </div>
        </div>

        <div className="space-y-2 border-2 border-gray-700 ps-4 pe-6 py-2 rounded-lg">
          <Label className="text-gray-200 text-sm">{t('filters.gender')}</Label>
          <RadioGroup
            value={filters.gender}
            onValueChange={(value) => handleFilterChange('gender', value)}
            className="flex gap-3"
          >
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="all" id="gender-all" />
              <Label htmlFor="gender-all" className="text-gray-300 cursor-pointer text-sm">
                {t('filters.all')}
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="male" id="gender-male" />
              <Label htmlFor="gender-male" className="text-gray-300 cursor-pointer text-sm">
                {t('male')}
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="female" id="gender-female" />
              <Label htmlFor="gender-female" className="text-gray-300 cursor-pointer text-sm">
                {t('female')}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2 border-2 border-gray-700 ps-4 pe-6 py-2 rounded-lg">
          <Label className="text-gray-200 text-sm">{t('filters.status')}</Label>
          <RadioGroup
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
            className="flex gap-3"
          >
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="all" id="status-all" />
              <Label htmlFor="status-all" className="text-gray-300 cursor-pointer text-sm">
                {t('filters.all')}
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="active" id="status-active" />
              <Label htmlFor="status-active" className="text-gray-300 cursor-pointer text-sm">
                {t('active')}
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="paused" id="status-paused" />
              <Label htmlFor="status-paused" className="text-gray-300 cursor-pointer text-sm">
                {t('paused')}
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="expired" id="status-expired" />
              <Label htmlFor="status-expired" className="text-gray-300 cursor-pointer text-sm">
                {t('expired')}
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="inactive" id="status-inactive" />
              <Label htmlFor="status-inactive" className="text-gray-300 cursor-pointer text-sm">
                {t('inactive')}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateFrom" className="text-gray-200 text-sm">
            {t('filters.joinDateFrom')}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="primary"
                className={cn(
                  'w-40 justify-start text-left font-normal bg-gray-900 border-gray-700 text-white hover:bg-gray-800',
                  !filters.dateFrom && 'text-gray-400'
                )}
              >
                <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {filters.dateFrom
                  ? format(new Date(filters.dateFrom), 'MM/dd/yyyy', { locale: dateLocale })
                  : t('filters.pickDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                onSelect={(date) => {
                  if (date) {
                    handleFilterChange('dateFrom', format(date, 'yyyy-MM-dd'))
                  }
                }}
                locale={dateLocale}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateTo" className="text-gray-200 text-sm">
            {t('filters.joinDateTo')}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="primary"
                className={cn(
                  'w-40 justify-start text-left font-normal bg-gray-900 border-gray-700 text-white hover:bg-gray-800',
                  !filters.dateTo && 'text-gray-400'
                )}
              >
                <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {filters.dateTo
                  ? format(new Date(filters.dateTo), 'MM/dd/yyyy', { locale: dateLocale })
                  : t('filters.pickDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                onSelect={(date) => {
                  if (date) {
                    handleFilterChange('dateTo', format(date, 'yyyy-MM-dd'))
                  }
                }}
                locale={dateLocale}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button variant="ghost" size="sm" onClick={onReset} className="gap-2">
          <X className="h-4 w-4" />
          {t('filters.reset')}
        </Button>
      </div>
    </div>
  )
}
