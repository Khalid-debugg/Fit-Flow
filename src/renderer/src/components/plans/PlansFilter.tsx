import { Button } from '@renderer/components/ui/button'
import { useTranslation } from 'react-i18next'
import { PlanFilter, PLAN_FILTERS } from '@renderer/models/plan'

interface PlansFilterProps {
  filter: PlanFilter
  onChange: (filter: PlanFilter) => void
}

export default function PlansFilter({ filter, onChange }: PlansFilterProps) {
  const { t } = useTranslation('plans')

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="flex flex-wrap gap-2">
        {PLAN_FILTERS.map((filterOption) => (
          <Button
            key={filterOption}
            variant={filter === filterOption ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onChange(filterOption)}
            className="capitalize"
          >
            {t(`filters.${filterOption}`)}
          </Button>
        ))}
      </div>
    </div>
  )
}
