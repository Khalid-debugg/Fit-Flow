export const GENDER = ['male', 'female'] as const
export const STATUS = ['active', 'inactive', 'expired'] as const
export type Member = {
  id?: string
  name: string
  email: string | null
  countryCode: string
  phone: string
  gender: (typeof GENDER)[number]
  address: string | null
  joinDate: string
  status: (typeof STATUS)[number]
  notes: string | null
  createdAt?: string
  currentMembership?: {
    id: number
    planName: string
    planPrice: number
    startDate: string
    endDate: string
    status: string
    remainingCheckIns?: number | null
  }
  alreadyCheckedIn?: boolean
  checkInTime?: string
  pendingPayments?: Array<{
    amount: number
    paymentDate?: string
  }>
}
export type MemberDbRow = {
  id: string
  name: string
  email: string | null
  country_code: string
  phone: string
  gender: (typeof GENDER)[number]
  address: string | null
  join_date: string
  notes: string | null
  created_at: string
  membership_id: number | null
  plan_name: string | null
  plan_price: number | null
  start_date: string | null
  end_date: string | null
  remaining_check_ins: number | null
  membership_count: number
}
export interface MemberFilters {
  query: string
  gender: 'all' | (typeof GENDER)[number]
  status: 'all' | (typeof STATUS)[number]
  dateFrom: string
  dateTo: string
}

export const DEFAULT_FILTERS: MemberFilters = {
  query: '',
  gender: 'all',
  status: 'all',
  dateFrom: '',
  dateTo: ''
}
