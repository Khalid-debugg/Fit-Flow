import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Download, Printer } from 'lucide-react'
import Barcode from 'react-barcode'
import { generateBarcodePDF, printBarcode } from '@renderer/utils/barcodeGenerator'
import { toast } from 'sonner'

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

  const handleDownloadPDF = async () => {
    try {
      await generateBarcodePDF(memberId, memberName, joinDate)
      toast.success(t('barcode.downloadSuccess'))
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast.error(t('barcode.downloadError'))
    }
  }

  const handlePrint = () => {
    try {
      printBarcode(memberId, memberName, joinDate)
    } catch (error) {
      console.error('Failed to print:', error)
      toast.error(t('barcode.printError'))
    }
  }

  return (
    <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-blue-400 flex items-center gap-2">
        {t('barcode.title')}
      </h3>

      <div className="bg-white p-4 rounded-lg flex flex-col items-center gap-3">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">{t('barcode.gymCard')}</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{memberName}</p>
        </div>

        <div className="my-2">
          <Barcode
            value={memberId}
            width={2}
            height={60}
            fontSize={12}
            background="#ffffff"
            lineColor="#000000"
          />
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
