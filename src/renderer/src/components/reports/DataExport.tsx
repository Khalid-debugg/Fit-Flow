// src/renderer/src/components/reports/DataExport.tsx

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Download, FileSpreadsheet, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'

type ExportTable = 'members' | 'memberships' | 'checkins' | 'accounts' | 'plans'

interface TableOption {
  value: ExportTable
  label: string
  description: string
}

export default function DataExport() {
  const { t } = useTranslation('reports')
  const { hasPermission } = useAuth()
  const [exporting, setExporting] = useState(false)
  const [selectedTables, setSelectedTables] = useState<Set<ExportTable>>(new Set())

  const canExport = hasPermission(PERMISSIONS.reports.export)

  const tableOptions: TableOption[] = [
    {
      value: 'members',
      label: t('export.tables.members.label'),
      description: t('export.tables.members.description')
    },
    {
      value: 'memberships',
      label: t('export.tables.memberships.label'),
      description: t('export.tables.memberships.description')
    },
    {
      value: 'checkins',
      label: t('export.tables.checkins.label'),
      description: t('export.tables.checkins.description')
    },
    {
      value: 'accounts',
      label: t('export.tables.accounts.label'),
      description: t('export.tables.accounts.description')
    },
    {
      value: 'plans',
      label: t('export.tables.plans.label'),
      description: t('export.tables.plans.description')
    }
  ]

  const toggleTable = (table: ExportTable) => {
    const newSelected = new Set(selectedTables)
    if (newSelected.has(table)) {
      newSelected.delete(table)
    } else {
      newSelected.add(table)
    }
    setSelectedTables(newSelected)
  }

  const handleExport = async () => {
    if (selectedTables.size === 0) {
      toast.error(t('export.messages.selectAtLeastOne'))
      return
    }

    if (!canExport) {
      toast.error(t('export.noPermission'))
      return
    }

    setExporting(true)

    try {
      const tables = Array.from(selectedTables)

      if (tables.length === 1) {
        // Export single table
        const result = await window.electron.ipcRenderer.invoke('exports:table', tables[0])

        if (result.canceled) {
          toast.info(t('export.messages.canceled'))
          return
        }

        if (!result.success) {
          throw new Error(result.error || 'Export failed')
        }

        toast.success(t('export.messages.successSingle', { filename: result.filename }))
      } else {
        // Export multiple tables
        const result = await window.electron.ipcRenderer.invoke('exports:multiple', tables)

        if (result.canceled) {
          toast.info(t('export.messages.canceled'))
          return
        }

        if (!result.success) {
          throw new Error(result.error || 'Export failed')
        }

        toast.success(
          t('export.messages.successMultiple', {
            count: result.files.length,
            directory: result.directory
          }),
          {
            duration: 5000
          }
        )
      }

      // Clear selection after successful export
      setSelectedTables(new Set())
    } catch (error) {
      console.error('Export error:', error)
      toast.error(t('export.messages.error'))
    } finally {
      setExporting(false)
    }
  }

  if (!canExport) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="text-center">
          <FileSpreadsheet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">{t('export.title')}</h3>
          <p className="text-gray-400 text-sm">
            {t('export.noPermission')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{t('export.title')}</h3>
          <p className="text-gray-400 text-sm">
            {t('export.subtitle')}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {tableOptions.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all
              ${
                selectedTables.has(option.value)
                  ? 'bg-blue-600/10 border-blue-500'
                  : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
              }
            `}
          >
            <input
              type="checkbox"
              checked={selectedTables.has(option.value)}
              onChange={() => toggleTable(option.value)}
              className="mt-1 w-4 h-4 rounded border-gray-500 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{option.label}</span>
                {selectedTables.has(option.value) && (
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1">{option.description}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {selectedTables.size === 0
            ? t('export.status.noSelection')
            : t('export.status.selected', { count: selectedTables.size })}
        </p>
        <Button
          onClick={handleExport}
          disabled={exporting || selectedTables.size === 0}
          className="gap-2"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('export.buttons.exporting')}
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {t('export.buttons.export')}
            </>
          )}
        </Button>
      </div>

      {selectedTables.size > 0 && (
        <div className="mt-4 p-3 bg-blue-600/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            💡 {selectedTables.size === 1
              ? t('export.info.single')
              : t('export.info.multiple')}
          </p>
        </div>
      )}
    </div>
  )
}
