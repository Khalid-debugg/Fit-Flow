// src/renderer/src/pages/Reports.tsx

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReportFilters, ReportPreview } from '@renderer/components/reports'
import { ReportData, ReportFilters as IReportFilters } from '@renderer/models/report'
import { toast } from 'sonner'

export default function Reports() {
  const { t } = useTranslation('reports')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [currentFilters, setCurrentFilters] = useState<IReportFilters | null>(null)

  const handleGenerate = async (filters: IReportFilters) => {
    setLoading(true)
    try {
      const data = await window.electron.ipcRenderer.invoke(
        'reports:generate',
        filters.startDate,
        filters.endDate
      )
      setReportData(data)
      setCurrentFilters(filters)
      toast.success(t('messages.generated'))
    } catch (error) {
      console.error('Failed to generate report:', error)
      toast.error(t('messages.error'))
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    if (!reportData || !currentFilters) return

    try {
      // Save report to database first
      await window.electron.ipcRenderer.invoke('reports:save', {
        reportType: currentFilters.reportType,
        startDate: currentFilters.startDate,
        endDate: currentFilters.endDate,
        totalRevenue: reportData.summary.totalRevenue,
        totalMembers: reportData.summary.totalMembers,
        newMembers: reportData.summary.newMembers,
        totalMemberships: reportData.summary.totalMemberships,
        newMemberships: reportData.summary.newMemberships,
        totalCheckIns: reportData.summary.totalCheckIns
      })

      // Open print dialog (users can save as PDF from there)
      toast.info(t('messages.printDialog'))
      setTimeout(() => {
        window.print()
      }, 500)
    } catch (error) {
      console.error('Failed to save report:', error)
      toast.error(t('messages.downloadError'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
        <p className="text-gray-400">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <ReportFilters onGenerate={handleGenerate} loading={loading} />
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-2">
          {reportData && currentFilters ? (
            <ReportPreview
              data={reportData}
              startDate={currentFilters.startDate}
              endDate={currentFilters.endDate}
              onPrint={handlePrint}
              onDownload={handleDownload}
            />
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{t('empty.title')}</h3>
                <p className="text-gray-400">{t('empty.description')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Print Styles for Single Page */}
      <style>
        {`
          @media print {
            /* Reset and base styles */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            /* Hide everything except report */
            body * {
              visibility: hidden;
            }
            
            #report-content,
            #report-content * {
              visibility: visible;
            }
            
            #report-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              padding: 12mm !important;
            }
            
            /* Hide screen-only elements */
            .no-print {
              display: none !important;
            }
            
            /* Show print-only elements */
            .print-only {
              display: block !important;
            }
            
            /* Single page fit */
            @page {
              size: A4;
              margin: 0;
            }
            
            /* Compact spacing for single page */
            #report-content {
              font-size: 10px !important;
            }
            
            #report-content h1 {
              font-size: 18px !important;
              margin-bottom: 6px !important;
            }
            
            #report-content h2 {
              font-size: 13px !important;
              margin-bottom: 6px !important;
              margin-top: 6px !important;
            }
            
            #report-content .grid {
              gap: 6px !important;
            }
            
            #report-content .p-4 {
              padding: 8px !important;
            }
            
            #report-content .p-3 {
              padding: 6px !important;
            }
            
            #report-content .mb-6 {
              margin-bottom: 10px !important;
            }
            
            #report-content .mb-4 {
              margin-bottom: 6px !important;
            }
            
            #report-content .mb-3 {
              margin-bottom: 4px !important;
            }
            
            /* Prevent page breaks */
            #report-content,
            #report-content > * {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            /* Remove shadows and unnecessary decorations */
            * {
              box-shadow: none !important;
              text-shadow: none !important;
            }
            
            /* Chart sizing - keep them visible */
            .chart-container {
              page-break-inside: avoid !important;
            }
            
            .recharts-wrapper {
              height: 140px !important;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            
            .recharts-wrapper svg {
              overflow: visible !important;
            }
            
            /* Compact text sizes */
            .text-2xl {
              font-size: 16px !important;
            }
            
            .text-xl {
              font-size: 14px !important;
            }
            
            .text-lg {
              font-size: 12px !important;
            }
            
            .text-xs {
              font-size: 8px !important;
            }
            
            .text-sm {
              font-size: 9px !important;
            }
            
            /* Icon sizes */
            .w-5 {
              width: 16px !important;
              height: 16px !important;
            }
            
            .w-4 {
              width: 14px !important;
              height: 14px !important;
            }
            
            /* Compact card padding */
            .border-2 {
              border-width: 1px !important;
            }
            
            .rounded-lg {
              border-radius: 4px !important;
            }
          }
          
          @media screen {
            .print-only {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  )
}
