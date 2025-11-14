import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CheckInFilters } from '@renderer/models/checkIn'

interface CheckInsFilterProps {
  filters: CheckInFilters
  onChange: (filters: CheckInFilters) => void
  onReset: () => void
}

export default function CheckInsFilter({ filters, onChange, onReset }: CheckInsFilterProps) {
  const { t } = useTranslation('checkIns')

  const handleFilterChange = (key: keyof CheckInFilters, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="search" className="text-gray-200 text-sm">
            {t('filter.search')}
          </Label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder={t('filter.searchPlaceholder')}
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="ps-10 bg-gray-900 border-gray-700"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateFrom" className="text-gray-200 text-sm">
            {t('filter.dateFrom')}
          </Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="bg-gray-900 border-gray-700 w-40"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateTo" className="text-gray-200 text-sm">
            {t('filter.dateTo')}
          </Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="bg-gray-900 border-gray-700 w-40"
          />
        </div>

        <div className="space-y-2 border-2 border-gray-700 ps-4 pe-6 py-2 rounded-lg">
          <Label className="text-gray-200 text-sm">{t('filter.status')}</Label>
          <RadioGroup
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
            className="flex gap-3"
          >
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="all" id="status-all" />
              <Label htmlFor="status-all" className="text-gray-300 cursor-pointer text-sm">
                {t('filter.all')}
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="active" id="status-active" />
              <Label htmlFor="status-active" className="text-gray-300 cursor-pointer text-sm">
                {t('status.active')}
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="expired" id="status-expired" />
              <Label htmlFor="status-expired" className="text-gray-300 cursor-pointer text-sm">
                {t('status.expired')}
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="none" id="status-none" />
              <Label htmlFor="status-none" className="text-gray-300 cursor-pointer text-sm">
                {t('status.none')}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button variant="ghost" size="sm" onClick={onReset} className="gap-2">
          <X className="h-4 w-4" />
          {t('filter.reset')}
        </Button>
      </div>
    </div>
  )
}
