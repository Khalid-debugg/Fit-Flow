export const PLAN_FILTERS = [
  'all',
  'daily',
  'weekly',
  'monthly',
  'annually',
  'custom',
  'offer'
] as const
export type PlanFilter = (typeof PLAN_FILTERS)[number]

export const PLAN_TYPES = ['duration', 'checkin'] as const
export type PlanType = (typeof PLAN_TYPES)[number]

export type Plan = {
  id?: number
  name: string
  description: string | null
  isOffer: boolean
  price: number
  durationDays: number | null
  planType: PlanType
  checkInLimit?: number | null
  created_at?: string
}
export type PlanDbRow = {
  id?: number
  name: string
  description: string | null
  is_offer: boolean
  price: number
  duration_days: number | null
  plan_type: PlanType
  check_in_limit?: number | null
  created_at?: string
}
