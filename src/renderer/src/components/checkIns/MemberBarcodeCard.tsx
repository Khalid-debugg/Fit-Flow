import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Download, Printer } from 'lucide-react'
import Barcode from 'react-barcode'
import { generateBarcodePDF, printBarcode } from '@renderer/utils/barcodeGenerator'
import { toast } from 'sonner'
import { useSettings } from '@renderer/hooks/useSettings'
import { useState, useEffect } from 'react'

interface MemberBarcodeCardProps {
  memberId: string
  memberName: string
  joinDate: string
}

export default function MemberBarcodeCard({
  memberId,
  memberName,
  joinDate
}: MemberBarcodeCardProps) {
  const { t } = useTranslation('checkIns')
  const { settings } = useSettings()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    const loadLogo = async () => {
      if (settings?.gymLogoPath) {
        try {
          const result = await window.electron.ipcRenderer.invoke(
            'gym:getLogoPreview',
            settings.gymLogoPath
          )
          if (result.success && result.previewUrl) {
            setLogoPreview(result.previewUrl)
          }
        } catch (error) {
          console.error('Failed to load logo:', error)
        }
      }
    }
    loadLogo()
  }, [settings?.gymLogoPath])

  const gymInfo = settings
    ? {
        gymName: settings.gymName,
        gymAddress: settings.gymAddress,
        gymPhone: settings.gymPhone,
        gymCountryCode: settings.gymCountryCode,
        gymLogoPath: settings.gymLogoPath,
        logoPreview: logoPreview,
        barcodeSize: settings.barcodeSize || 'keychain'
      }
    : undefined

  const handleDownloadPDF = async () => {
    try {
      await generateBarcodePDF(memberId, memberName, joinDate, gymInfo)
      toast.success(t('barcode.downloadSuccess'))
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast.error(t('barcode.downloadError'))
    }
  }

  const handlePrint = () => {
    try {
      printBarcode(memberId, memberName, joinDate, gymInfo)
    } catch (error) {
      console.error('Failed to print:', error)
      toast.error(t('barcode.printError'))
    }
  }

  return (
    <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700 max-w-[28rem]">
      <h3 className="text-lg font-semibold mb-4 text-blue-400 flex items-center gap-2">
        {t('barcode.title')}
      </h3>

      <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg overflow-hidden shadow-lg">
        {/* Modern header with gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-400 px-4 py-3 flex items-center gap-3">
          {logoPreview && (
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
              <img
                src={logoPreview}
                alt="Gym Logo"
                className="max-w-full max-h-full w-auto h-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
          )}
          <p className="text-sm font-bold text-white tracking-wide">
            {gymInfo?.gymName || 'MEMBER CARD'}
          </p>
        </div>

        {/* Card content */}
        <div className="bg-white m-2 rounded-lg p-4 shadow-sm">
          <div className="text-center mb-3">
            <p className="text-base font-bold text-slate-800">{memberName}</p>
            <div className="w-3/4 h-px bg-slate-200 mx-auto mt-2"></div>
          </div>

          <div className="flex justify-center my-3">
            <Barcode
              value={memberId}
              width={1.2}
              height={50}
              fontSize={11}
              background="#ffffff"
              lineColor="#000000"
            />
          </div>

          <div className="text-center text-xs text-slate-500">
            Member since {new Date(joinDate).toLocaleDateString('en-GB')}
          </div>

          {(gymInfo?.gymPhone || gymInfo?.gymAddress) && (
            <div className="text-center text-[10px] text-slate-400 mt-1">
              {[gymInfo.gymPhone, gymInfo.gymAddress].filter(Boolean).join(' • ')}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <Button variant="primary" onClick={handleDownloadPDF} className="flex-1 gap-2">
          <Download className="w-4 h-4" />
          {t('barcode.download')}
        </Button>
        <Button variant="secondary" onClick={handlePrint} className="flex-1 gap-2">
          <Printer className="w-4 h-4" />
          {t('barcode.print')}
        </Button>
      </div>
    </div>
  )
}
