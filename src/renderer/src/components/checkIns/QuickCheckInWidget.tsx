import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { ScanBarcode, Search, Loader2 } from 'lucide-react'
import { useCheckIn } from '@renderer/hooks/useCheckIn'
import { toast } from 'sonner'
import MemberCheckInCard from '@renderer/components/checkIns/MemberCheckInCard'
import { useDebounce } from '@renderer/hooks/useDebounce'

interface QuickCheckInWidgetProps {
  onCheckInSuccess: () => void
}

interface MemberSearchResult {
  id: string
  name: string
  phone: string
  email: string
  membershipStatus: 'active' | 'inactive'
}

export default function QuickCheckInWidget({ onCheckInSuccess }: QuickCheckInWidgetProps) {
  const { t } = useTranslation('checkIns')
  const { t: tDashboard } = useTranslation('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchPage, setSearchPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const { lookupMember, confirmCheckIn, cancelCheckIn, memberCard, loading } = useCheckIn()

  const debouncedQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!memberCard && !loading) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [memberCard, loading])

  // Search members
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      searchMembers(1, true)
    } else {
      setSearchResults([])
      setShowResults(false)
      setSearchPage(1)
    }
  }, [debouncedQuery])

  const searchMembers = async (page: number, reset: boolean = false) => {
    setSearchLoading(true)
    try {
      const results = await window.electron.ipcRenderer.invoke(
        'members:search',
        debouncedQuery,
        page
      )

      if (reset) {
        setSearchResults(results)
      } else {
        setSearchResults((prev) => [...prev, ...results])
      }

      setHasMore(results.length === 10)
      setSearchPage(page)
      setShowResults(true)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  // Infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const bottom = target.scrollHeight - target.scrollTop === target.clientHeight

    if (bottom && hasMore && !searchLoading) {
      searchMembers(searchPage + 1, false)
    }
  }

  // Handle barcode scan (Enter key)
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault()

      // Check if it's a member ID (barcode scan - 16 hex chars)
      if (/^[0-9a-f]{16}$/i.test(searchQuery.trim())) {
        await handleBarcodeCheckIn(searchQuery.trim())
      } else if (searchResults.length === 1) {
        // If only one result, select it
        await handleMemberSelect(searchResults[0].id)
      }
    }
  }

  const handleBarcodeCheckIn = async (memberId: string) => {
    setShowResults(false)
    const result = await lookupMember(memberId)

    if (!result.success) {
      toast.error(result.error)
      setSearchQuery('')
    }
  }

  const handleMemberSelect = async (memberId: string) => {
    setShowResults(false)
    const result = await lookupMember(memberId)

    if (!result.success) {
      toast.error(result.error)
    }
    setSearchQuery('')
  }

  const handleConfirm = async () => {
    const result = await confirmCheckIn()

    if (result.success) {
      toast.success(t('messages.checkInSuccess'))
      setSearchQuery('')
      setSearchResults([])
      onCheckInSuccess()
    } else {
      toast.error(result.error)
    }
  }

  const handleCancel = () => {
    cancelCheckIn()
    setSearchQuery('')
    setSearchResults([])
  }

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
  }

  return (
    <>
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <ScanBarcode className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-200">{t('quickCheckIn')}</h2>
            <p className="text-sm text-gray-400">{tDashboard('searchOrScan')}</p>
          </div>
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="search-member" className="text-gray-200 text-sm">
            {tDashboard('searchMember')}
          </Label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              id="search-member"
              type="text"
              placeholder={tDashboard('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="bg-gray-900 border-gray-700 text-white text-lg h-12 ps-10"
              autoComplete="off"
            />
            {searchLoading && (
              <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ScanBarcode className="w-3 h-3" />
            <span>{t('barcodeReady')}</span>
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div
              ref={resultsRef}
              onScroll={handleScroll}
              className="absolute z-50 w-full top-20 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto"
            >
              {searchResults.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleMemberSelect(member.id)}
                  className="p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{member.name}</p>
                      <p className="text-sm text-gray-400">{member.phone}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(member.membershipStatus)}`}
                    >
                      {t(`status.${member.membershipStatus}`)}
                    </span>
                  </div>
                </div>
              ))}
              {searchLoading && (
                <div className="p-3 text-center text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {showResults &&
            searchResults.length === 0 &&
            !searchLoading &&
            debouncedQuery.trim().length >= 2 && (
              <div className="absolute z-50 w-full top-20 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-4 text-center text-gray-400">
                {tDashboard('noMembersFound')}
              </div>
            )}
        </div>
      </div>

      {memberCard && (
        <MemberCheckInCard
          member={memberCard}
          open={!!memberCard}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          loading={loading}
        />
      )}
    </>
  )
}
