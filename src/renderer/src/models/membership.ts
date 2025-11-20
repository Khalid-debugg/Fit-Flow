export const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'e-wallet'] as const

export type Membership = {
  id?: string
  memberId: string
  planId: string
  startDate: string
  endDate: string
  amountPaid: number
  paymentMethod: (typeof PAYMENT_METHODS)[number]
  paymentDate: string
  notes: string | null
  createdAt?: string
  memberName?: string
  memberPhone?: string
  planName?: string
  planPrice?: number
}

export type MembershipDbRow = {
  id: string
  member_id: string
  plan_id: string
  start_date: string
  end_date: string
  amount_paid: number
  payment_method: (typeof PAYMENT_METHODS)[number]
  payment_date: string
  notes: string | null
  created_at: string
  member_name?: string
  member_phone?: string
  plan_name?: string
  plan_price?: number
}

export interface MembershipFilters {
  query: string
  memberId: string
  paymentMethod: 'all' | (typeof PAYMENT_METHODS)[number]
  dateFrom: string
  dateTo: string
  status: 'all' | 'active' | 'expired'
}

export const DEFAULT_FILTERS: MembershipFilters = {
  query: '',
  memberId: '',
  paymentMethod: 'all',
  dateFrom: '',
  dateTo: '',
  status: 'all'
}
