import { memo, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { CheckCircle, XCircle, Clock, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Button } from '@renderer/components/ui/button'

interface NotificationResult {
  memberName: string
  phoneNumber: string
  status: 'sent' | 'failed' | 'skipped'
  reason?: string
  daysLeft: number
}

interface NotificationResultsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  results: NotificationResult[]
  sentCount: number
  failedCount: number
  skippedCount: number
}

export const NotificationResultsDialog = memo(function NotificationResultsDialog({
  open,
  onOpenChange,
  results,
  sentCount,
  failedCount,
  skippedCount
}: NotificationResultsDialogProps) {
  const { t } = useTranslation('settings')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const sentResults = results.filter((r) => r.status === 'sent')
  const failedResults = results.filter((r) => r.status === 'failed')
  const skippedResults = results.filter((r) => r.status === 'skipped')

  // Paginate results
  const totalPages = Math.ceil(results.length / itemsPerPage)
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return results.slice(startIndex, endIndex)
  }, [results, currentPage])

  const paginatedSent = paginatedResults.filter((r) => r.status === 'sent')
  const paginatedFailed = paginatedResults.filter((r) => r.status === 'failed')
  const paginatedSkipped = paginatedResults.filter((r) => r.status === 'skipped')

  // Reset page when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCurrentPage(1)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white bg-gray-800 -m-6 mb-4 p-4 rounded-t-lg border-b border-gray-700">
            <MessageCircle className="w-5 h-5 text-green-400" />
            {t('whatsapp.resultsDialog.title')}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {t('whatsapp.resultsDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400 font-semibold">{t('whatsapp.resultsDialog.sent')}</span>
              </div>
              <p className="text-2xl font-bold text-white">{sentCount}</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-400 font-semibold">{t('whatsapp.resultsDialog.failed')}</span>
              </div>
              <p className="text-2xl font-bold text-white">{failedCount}</p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-semibold">{t('whatsapp.resultsDialog.skipped')}</span>
              </div>
              <p className="text-2xl font-bold text-white">{skippedCount}</p>
            </div>
          </div>

          {/* Results List */}
          <ScrollArea className="h-[400px] rounded-lg border border-gray-700">
            <div className="space-y-3 p-4">
              {/* Successfully Sent */}
              {paginatedSent.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {t('whatsapp.resultsDialog.successSection', { count: sentResults.length })}
                  </h4>
                  <div className="space-y-2">
                    {paginatedSent.map((result, index) => (
                      <div
                        key={`sent-${index}`}
                        className="bg-gray-900/50 rounded-lg p-3 border border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-white">{result.memberName}</p>
                            <p className="text-xs text-gray-400 mt-1">{result.phoneNumber}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-yellow-400 font-semibold">
                              {t('whatsapp.resultsDialog.daysLeft', { days: result.daysLeft })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed */}
              {paginatedFailed.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {t('whatsapp.resultsDialog.failedSection', { count: failedResults.length })}
                  </h4>
                  <div className="space-y-2">
                    {paginatedFailed.map((result, index) => (
                      <div
                        key={`failed-${index}`}
                        className="bg-gray-900/50 rounded-lg p-3 border border-red-500/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-white">{result.memberName}</p>
                            <p className="text-xs text-gray-400 mt-1">{result.phoneNumber}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-yellow-400 font-semibold">
                              {t('whatsapp.resultsDialog.daysLeft', { days: result.daysLeft })}
                            </span>
                          </div>
                        </div>
                        {result.reason && (
                          <div className="bg-red-500/10 rounded px-2 py-1 mt-2">
                            <p className="text-xs text-red-300">{result.reason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skipped */}
              {paginatedSkipped.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {t('whatsapp.resultsDialog.skippedSection', { count: skippedResults.length })}
                  </h4>
                  <div className="space-y-2">
                    {paginatedSkipped.map((result, index) => (
                      <div
                        key={`skipped-${index}`}
                        className="bg-gray-900/50 rounded-lg p-3 border border-yellow-500/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-white">{result.memberName}</p>
                            <p className="text-xs text-gray-400 mt-1">{result.phoneNumber}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-yellow-400 font-semibold">
                              {t('whatsapp.resultsDialog.daysLeft', { days: result.daysLeft })}
                            </span>
                          </div>
                        </div>
                        {result.reason && (
                          <div className="bg-yellow-500/10 rounded px-2 py-1 mt-2">
                            <p className="text-xs text-yellow-300">{result.reason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>{t('whatsapp.resultsDialog.noResults')}</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages}
              </p>
              <div className="flex gap-2 ltr:flex-row rtl:flex-row-reverse">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('pagination.previous')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                  {t('pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
})
