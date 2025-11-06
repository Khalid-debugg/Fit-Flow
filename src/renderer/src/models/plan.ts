export const PLAN_FILTERS = ['all', 'daily', 'weekly', 'monthly', 'annually'] as const
export type PlanFilter = (typeof PLAN_FILTERS)[number]

export type Plan = {
  id?: number
  name: string
  description: string | null
  price: number
  durationDays: number
  created_at?: string
}
