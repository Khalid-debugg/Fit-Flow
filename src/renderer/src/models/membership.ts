export const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'e-wallet'] as const
export const PAYMENT_STATUS = ['unpaid', 'partial', 'paid'] as const
export const PRICE_MODIFIER_TYPES = ['multiplier', 'discount', 'custom'] as const
export const PAYMENT_RECORD_STATUS = ['completed', 'scheduled', 'pending'] as const

export type PaymentStatus = (typeof PAYMENT_STATUS)[number]
export type PriceModifierType = (typeof PRICE_MODIFIER_TYPES)[number]
export type PaymentRecordStatus = (typeof PAYMENT_RECORD_STATUS)[number]

export type ScheduledPayment = {
  amount: number
  payment_method: (typeof PAYMENT_METHODS)[number]
  payment_date: string
  notes?: string | null
}

export type Membership = {
  id?: string
  memberId: string
  planId: string
  startDate: string
  endDate: string
  totalPrice: number
  amountPaid: number
  remainingBalance: number
  paymentStatus: PaymentStatus
  paymentMethod: (typeof PAYMENT_METHODS)[number]
  paymentDate: string
  remainingCheckIns?: number | null
  isCustom: boolean
  priceModifierType?: PriceModifierType | null
  priceModifierValue?: number | null
  customPriceName?: string | null
  scheduledPayments?: ScheduledPayment[]
  hasScheduledPayments?: boolean
  notes: string | null
  createdAt?: string
  memberName?: string
  memberPhone?: string
  memberCountryCode?: string
  planName?: string
  planPrice?: number
  planType?: string
  isPaused?: boolean
  pauseDurationDays?: number | null
  remainingDaysBeforePause?: number | null
}

export type MembershipDbRow = {
  id: string
  member_id: string
  plan_id: string
  start_date: string
  end_date: string
  total_price: number
  amount_paid: number
  remaining_balance: number
  payment_status: PaymentStatus
  payment_method: (typeof PAYMENT_METHODS)[number]
  payment_date: string
  remaining_check_ins?: number | null
  is_custom: number
  price_modifier_type?: PriceModifierType | null
  price_modifier_value?: number | null
  custom_price_name?: string | null
  notes: string | null
  is_paused: number
  paused_date?: string | null
  original_end_date?: string | null
  pause_duration_days?: number | null
  remaining_days_before_pause?: number | null
  created_at: string
  member_name?: string
  member_phone?: string
  member_country_code?: string
  plan_name?: string
  plan_price?: number
  plan_type?: string
}

export type MembershipPayment = {
  id?: string
  membershipId: string
  amount: number
  paymentMethod: (typeof PAYMENT_METHODS)[number]
  paymentDate: string
  paymentStatus: PaymentRecordStatus
  notes: string | null
  createdAt?: string
}

export type MembershipPaymentDbRow = {
  id: string
  membership_id: string
  amount: number
  payment_method: (typeof PAYMENT_METHODS)[number]
  payment_date: string
  payment_status: PaymentRecordStatus
  notes: string | null
  created_at: string
}

export interface MembershipFilters {
  query: string
  memberId: string
  planId: string
  dateFrom: string
  dateTo: string
  status: 'all' | 'active' | 'expired' | 'paused'
}

export const DEFAULT_FILTERS: MembershipFilters = {
  query: '',
  memberId: '',
  planId: '',
  dateFrom: '',
  dateTo: '',
  status: 'all'
}
