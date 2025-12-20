import { useState } from 'react'
import { Member } from '@renderer/models/member'
import { playSuccess, playWarning, playError } from '@renderer/utils/audioFeedback'

export function useCheckIn() {
  const [loading, setLoading] = useState(false)
  const [memberCard, setMemberCard] = useState<Member | null>(null)

  const lookupMemberByPhone = async (phoneNumber: string) => {
    setLoading(true)
    try {
      // Get member by phone number
      const member = await window.electron.ipcRenderer.invoke('members:getByPhone', phoneNumber)

      if (!member) {
        playError()
        return { success: false, error: 'Member not found with this phone number' }
      }

      // Check if already checked in today
      const existingCheckIn = await window.electron.ipcRenderer.invoke(
        'checkIns:checkToday',
        member.id
      )

      // Get pending payments if member has a current membership
      let pendingPayments = undefined
      if (member.currentMembership?.id) {
        const payments = await window.electron.ipcRenderer.invoke(
          'memberships:getPayments',
          member.currentMembership.id.toString()
        )

        // Filter for pending and scheduled payments
        const allPendingPayments = payments.filter(
          (p: any) => p.paymentStatus === 'pending' || p.paymentStatus === 'scheduled'
        )

        // Sort scheduled payments by date (earliest first)
        const sortedPayments = allPendingPayments.sort((a: any, b: any) => {
          // Scheduled payments with dates come first, sorted by date
          if (a.paymentStatus === 'scheduled' && b.paymentStatus === 'scheduled') {
            return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
          }
          if (a.paymentStatus === 'scheduled') return -1
          if (b.paymentStatus === 'scheduled') return 1
          return 0
        })

        // Map all pending/scheduled payments
        if (sortedPayments.length > 0) {
          pendingPayments = sortedPayments.map((payment: any) => ({
            amount: payment.amount,
            paymentDate: payment.paymentStatus === 'scheduled' ? payment.paymentDate : undefined
          }))
        }
      }

      if (existingCheckIn) {
        playWarning()
        const time = new Date(existingCheckIn.checkInTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
        const memberWithCheckIn = {
          ...member,
          alreadyCheckedIn: true,
          checkInTime: time,
          pendingPayments
        }
        setMemberCard(memberWithCheckIn)
        return { success: true, member: memberWithCheckIn }
      }

      // Show member card for confirmation
      const memberWithPaymentInfo = {
        ...member,
        pendingPayments
      }
      setMemberCard(memberWithPaymentInfo)
      return { success: true, member: memberWithPaymentInfo }
    } catch (error) {
      console.error('Lookup failed:', error)
      playError()
      return { success: false, error: 'Failed to lookup member' }
    } finally {
      setLoading(false)
    }
  }

  const lookupMember = async (memberId: string) => {
    setLoading(true)
    try {
      // Get member by ID (for barcode scanning)
      const member = await window.electron.ipcRenderer.invoke('members:getById', memberId)

      if (!member) {
        playError()
        return { success: false, error: 'Member not found' }
      }

      // Check if already checked in today
      const existingCheckIn = await window.electron.ipcRenderer.invoke(
        'checkIns:checkToday',
        member.id
      )

      // Get pending payments if member has a current membership
      let pendingPayments = undefined
      if (member.currentMembership?.id) {
        const payments = await window.electron.ipcRenderer.invoke(
          'memberships:getPayments',
          member.currentMembership.id.toString()
        )

        // Filter for pending and scheduled payments
        const allPendingPayments = payments.filter(
          (p: any) => p.paymentStatus === 'pending' || p.paymentStatus === 'scheduled'
        )

        // Sort scheduled payments by date (earliest first)
        const sortedPayments = allPendingPayments.sort((a: any, b: any) => {
          // Scheduled payments with dates come first, sorted by date
          if (a.paymentStatus === 'scheduled' && b.paymentStatus === 'scheduled') {
            return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
          }
          if (a.paymentStatus === 'scheduled') return -1
          if (b.paymentStatus === 'scheduled') return 1
          return 0
        })

        // Map all pending/scheduled payments
        if (sortedPayments.length > 0) {
          pendingPayments = sortedPayments.map((payment: any) => ({
            amount: payment.amount,
            paymentDate: payment.paymentStatus === 'scheduled' ? payment.paymentDate : undefined
          }))
        }
      }

      if (existingCheckIn) {
        playWarning()
        const time = new Date(existingCheckIn.checkInTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
        // Add duplicate check-in info to member object
        const memberWithCheckIn = {
          ...member,
          alreadyCheckedIn: true,
          checkInTime: time,
          pendingPayments
        }
        setMemberCard(memberWithCheckIn)
        return { success: true, member: memberWithCheckIn }
      }

      // Show member card for confirmation
      const memberWithPaymentInfo = {
        ...member,
        pendingPayments
      }
      setMemberCard(memberWithPaymentInfo)
      return { success: true, member: memberWithPaymentInfo }
    } catch (error) {
      console.error('Lookup failed:', error)
      playError()
      return { success: false, error: 'Failed to lookup member' }
    } finally {
      setLoading(false)
    }
  }

  const confirmCheckIn = async () => {
    if (!memberCard) return { success: false, error: 'No member selected' }

    setLoading(true)
    try {
      // Create check-in and get warnings
      const result = await window.electron.ipcRenderer.invoke('checkIns:create', memberCard.id)

      let hasWarnings = false
      const warnings: string[] = []

      // Process warnings from backend
      if (result.warnings && result.warnings.length > 0) {
        hasWarnings = true
        result.warnings.forEach((warning: string) => {
          if (warning.startsWith('PAYMENT_PARTIAL:')) {
            const balance = warning.split(':')[1]
            warnings.push(`Outstanding balance: ${balance}`)
          } else if (warning === 'PAYMENT_UNPAID') {
            warnings.push('Membership payment is unpaid')
          } else if (warning.startsWith('LOW_CHECK_INS:')) {
            const remaining = warning.split(':')[1]
            warnings.push(`Only ${remaining} check-ins remaining`)
          }
        })
      }

      // Play sound based on membership status or duplicate check-in
      if (memberCard.alreadyCheckedIn || hasWarnings) {
        playWarning()
      } else if (memberCard.status === 'active') {
        playSuccess()
      } else {
        playWarning()
      }

      // Clear member card
      setMemberCard(null)

      return { success: true, warnings }
    } catch (error: any) {
      console.error('Check-in failed:', error)

      // Handle specific error for no check-ins remaining
      if (error?.message === 'NO_CHECK_INS_REMAINING') {
        playError()
        return { success: false, error: 'No check-ins remaining on this membership' }
      }

      playError()
      return { success: false, error: 'Failed to create check-in' }
    } finally {
      setLoading(false)
    }
  }

  const cancelCheckIn = () => {
    setMemberCard(null)
  }

  return {
    lookupMember,
    lookupMemberByPhone,
    confirmCheckIn,
    cancelCheckIn,
    memberCard,
    loading
  }
}
