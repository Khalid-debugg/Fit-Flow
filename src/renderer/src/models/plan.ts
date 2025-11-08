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

export type Plan = {
  id?: number
  name: string
  description: string | null
  isOffer: boolean
  price: number
  durationDays: number
  created_at?: string
}
export type PlanDbRow = {
  id?: number
  name: string
  description: string | null
  is_offer: boolean
  price: number
  duration_days: number
  created_at?: string
}
