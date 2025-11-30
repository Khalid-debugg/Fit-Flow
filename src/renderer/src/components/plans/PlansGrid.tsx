import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Pencil, Trash2, ChevronLeft, ChevronRight, Sparkles, Clock } from 'lucide-react'
import { Plan } from '@renderer/models/plan'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../ui/alert-dialog'
import { useSettings } from '@renderer/hooks/useSettings'

interface PlansGridProps {
  plans: Plan[]
  page: number
  totalPages: number
  onEdit: (plan: Plan) => void
  onDelete: (id: number) => void
  onPageChange: (page: number) => void
}

export default function PlansGrid({
  plans,
  page,
  totalPages,
  onEdit,
  onDelete,
  onPageChange
}: PlansGridProps) {
  const { t, i18n } = useTranslation('plans')
  const { settings } = useSettings()
  const getDurationText = (days: number) => {
    const years = Math.floor(days / 365)
    const remainingAfterYears = days % 365

    const months = Math.floor(remainingAfterYears / 30)
    const remainingAfterMonths = remainingAfterYears % 30

    const weeks = Math.floor(remainingAfterMonths / 7)
    const remainingDays = remainingAfterMonths % 7

    const parts: string[] = []

    if (years > 0) parts.push(`${t('years', { count: years })}`)
    if (months > 0) parts.push(`${t('months', { count: months })}`)
    if (weeks > 0) parts.push(`${t('weeks', { count: weeks })}`)
    if (remainingDays > 0 || parts.length === 0)
      parts.push(`${t('days', { count: remainingDays })}`)

    return i18n.language.startsWith('ar') ? parts.join(' و ') : parts.join(' ')
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          return (
            <div
              key={plan.id}
              className={`
                relative rounded-2xl p-6 transition-all duration-300
                ${
                  plan.isOffer
                    ? 'bg-linear-to-br from-yellow-900/40 via-orange-900/30 to-yellow-900/40 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105'
                    : 'bg-gray-800 border border-gray-700 hover:border-gray-600 hover:shadow-lg'
                }
              `}
            >
              {plan.isOffer && (
                <div className="absolute -top-3 -right-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-r from-yellow-600 to-orange-600 rounded-full blur-md opacity-75 animate-pulse"></div>
                    <div className="relative bg-linear-to-r from-yellow-600 to-orange-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      {t('specialOffer')}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3
                      className={`text-2xl font-bold mb-2 ${
                        plan.isOffer
                          ? 'bg-linear-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent'
                          : 'text-white'
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{getDurationText(plan.durationDays)}</span>
                    </div>
                  </div>
                </div>

                {plan.description && (
                  <p className="text-gray-300 text-sm line-clamp-3 min-h-16">{plan.description}</p>
                )}

                <div className="pt-4 border-t border-gray-700/50">
                  <div className="flex items-baseline gap-1 mb-6">
                    <span
                      className={`text-4xl font-bold ${
                        plan.isOffer
                          ? 'bg-linear-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent'
                          : 'text-white'
                      }`}
                    >
                      {Intl.NumberFormat(settings?.language, {
                        style: 'currency',
                        currency: settings?.currency,
                        minimumFractionDigits: 0
                      }).format(plan.price)}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant={'ghost'} size="sm" onClick={() => onEdit(plan)}>
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('alert.deletePlan')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('alert.deletePlanMessage')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(plan.id!)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            {t('form.confirm')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-400">
            {t('pagination.page')} {page} {t('pagination.of')} {totalPages}
          </p>
          <div className="flex gap-2 ltr:flex-row rtl:flex-row-reverse">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('pagination.previous')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              {t('pagination.next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
