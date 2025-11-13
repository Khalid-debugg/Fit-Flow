export type CheckIn = {
  id: string
  memberId: string
  checkInTime: string
  createdAt?: string
  memberName?: string
  memberPhone?: string
  membershipStatus?: 'active' | 'expired' | 'none'
  membershipEndDate?: string | null
}

export type CheckInDbRow = {
  id: string
  member_id: string
  check_in_time: string
  created_at?: string
  member_name?: string
  member_phone?: string
  membership_end_date?: string | null
}

export interface CheckInFilters {
  query: string
  dateFrom: string
  dateTo: string
  status: 'all' | 'active' | 'expired' | 'none'
}

export const DEFAULT_FILTERS: CheckInFilters = {
  query: '',
  dateFrom: new Date().toISOString().split('T')[0],
  dateTo: new Date().toISOString().split('T')[0],
  status: 'all'
}

export interface CheckInStats {
  today: number
  thisWeek: number
  thisMonth: number
  activeMembers: number
}
