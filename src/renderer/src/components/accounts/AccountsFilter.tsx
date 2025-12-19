import { useTranslation } from 'react-i18next'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Search, X } from 'lucide-react'
import { UserFilters } from '@renderer/models/account'

interface AccountsFilterProps {
  filters: UserFilters
  onChange: (filters: UserFilters) => void
  onReset: () => void
}

export default function AccountsFilter({ filters, onChange, onReset }: AccountsFilterProps) {
  const { t } = useTranslation('accounts')

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
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
          <Label className="text-gray-200 text-sm">{t('filters.role')}</Label>
          <RadioGroup
            value={filters.role}
            onValueChange={(value) => handleFilterChange('role', value)}
            className="flex gap-3 flex-wrap"
          >
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="all" id="role-all" />
              <Label htmlFor="role-all" className="text-gray-300 cursor-pointer text-sm">
                {t('filters.all')}
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="admin" id="role-admin" />
              <Label htmlFor="role-admin" className="text-gray-300 cursor-pointer text-sm">
                {t('roles.admin.label')}
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="manager" id="role-manager" />
              <Label htmlFor="role-manager" className="text-gray-300 cursor-pointer text-sm">
                {t('roles.manager.label')}
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="coach" id="role-coach" />
              <Label htmlFor="role-coach" className="text-gray-300 cursor-pointer text-sm">
                {t('roles.coach.label')}
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="receptionist" id="role-receptionist" />
              <Label htmlFor="role-receptionist" className="text-gray-300 cursor-pointer text-sm">
                {t('roles.receptionist.label')}
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="custom" id="role-custom" />
              <Label htmlFor="role-custom" className="text-gray-300 cursor-pointer text-sm">
                {t('roles.custom.label')}
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
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="all" id="status-all" />
              <Label htmlFor="status-all" className="text-gray-300 cursor-pointer text-sm">
                {t('filters.all')}
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="active" id="status-active" />
              <Label htmlFor="status-active" className="text-gray-300 cursor-pointer text-sm">
                {t('active')}
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="inactive" id="status-inactive" />
              <Label htmlFor="status-inactive" className="text-gray-300 cursor-pointer text-sm">
                {t('inactive')}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button variant="ghost" size="sm" onClick={onReset} className="gap-2">
          <X className="h-4 w-4" />
          {t('filters.reset')}
        </Button>
      </div>
    </div>
  )
}
