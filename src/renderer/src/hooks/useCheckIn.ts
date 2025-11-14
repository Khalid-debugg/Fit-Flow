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

      if (existingCheckIn) {
        playError()
        const time = new Date(existingCheckIn.checkInTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
        return { success: false, error: `Already checked in today at ${time}` }
      }

      // Show member card for confirmation
      setMemberCard(member)
      return { success: true, member }
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

      if (existingCheckIn) {
        playError()
        const time = new Date(existingCheckIn.checkInTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
        return { success: false, error: `Already checked in today at ${time}` }
      }

      // Show member card for confirmation
      setMemberCard(member)
      return { success: true, member }
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
      // Create check-in
      await window.electron.ipcRenderer.invoke('checkIns:create', memberCard.id)

      // Play sound based on membership status
      if (memberCard.status === 'active') {
        playSuccess()
      } else {
        playWarning()
      }

      // Clear member card
      setMemberCard(null)

      return { success: true }
    } catch (error) {
      console.error('Check-in failed:', error)

      if ((error as Error).message === 'DUPLICATE_CHECK_IN') {
        playError()
        return { success: false, error: 'Already checked in today' }
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
