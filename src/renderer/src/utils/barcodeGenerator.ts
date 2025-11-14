import { jsPDF } from 'jspdf'
import JsBarcode from 'jsbarcode'

export async function generateBarcodePDF(memberId: string, memberName: string, joinDate: string) {
  try {
    // Create temporary canvas for barcode
    const canvas = document.createElement('canvas')

    // Generate barcode — large and clean
    JsBarcode(canvas, memberId, {
      format: 'CODE128',
      width: 1.8, // thicker bars
      height: 22, // taller barcode
      displayValue: false,
      background: '#ffffff',
      lineColor: '#000000',
      margin: 0
    })

    const barcodeImage = canvas.toDataURL('image/png')

    // Create smaller PDF (50x30mm)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [50, 30]
    })

    // White background
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, 50, 30, 'F')

    // Optional border (light)
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.2)
    pdf.rect(1, 1, 48, 28)

    // Member name (small, top)
    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'bold')
    pdf.text(memberName, 25, 6, { align: 'center' })

    // Add barcode (dominant visual element)
    const barcodeWidth = 42 // take almost full width
    const barcodeHeight = 18
    const barcodeX = (50 - barcodeWidth) / 2
    const barcodeY = 7
    pdf.addImage(barcodeImage, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight)

    // Join date (tiny, bottom)
    const parsedDate =
      joinDate && !isNaN(new Date(joinDate).getTime())
        ? new Date(joinDate).toLocaleDateString('en-GB')
        : 'N/A'

    pdf.setFontSize(5)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(80, 80, 80)
    pdf.text(`Joined: ${parsedDate}`, 25, 28, { align: 'center' })

    // Save PDF
    const fileName = `keychain-barcode-${memberName.replace(/\s+/g, '-').toLowerCase()}.pdf`
    pdf.save(fileName)
  } catch (error) {
    console.error('PDF generation error:', error)
    throw error
  }
}

export function printBarcode(memberId: string, memberName: string, joinDate: string) {
  try {
    const printContainer = document.createElement('div')
    printContainer.style.position = 'fixed'
    printContainer.style.left = '-9999px'
    document.body.appendChild(printContainer)

    // Generate barcode with better resolution for printing
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, memberId, {
      format: 'CODE128',
      width: 1.8,
      height: 45,
      displayValue: false,
      background: '#ffffff',
      lineColor: '#000000',
      margin: 0
    })

    const parsedDate =
      joinDate && !isNaN(new Date(joinDate).getTime())
        ? new Date(joinDate).toLocaleDateString('en-GB')
        : 'N/A'

    // Build print layout (barcode-focused)
    printContainer.innerHTML = `
      <div style="
        width: 50mm;
        height: 30mm;
        border: 1px solid #ccc;
        padding: 2mm;
        font-family: Arial, sans-serif;
        text-align: center;
        background: white;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      ">
        <div style="font-size: 7pt; font-weight: bold; margin-top: 1mm;">
          ${memberName}
        </div>
        <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
          <img src="${canvas.toDataURL()}" style="width: 90%; height: auto;" />
        </div>
        <div style="font-size: 6pt; color: #555; margin-bottom: 1mm;">
          Joined: ${parsedDate}
        </div>
      </div>
    `

    // Open print window
    const printWindow = window.open('', '_blank')
    if (!printWindow) throw new Error('Could not open print window')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode Label</title>
          <style>
            @media print {
              @page {
                size: 50mm 30mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${printContainer.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
      document.body.removeChild(printContainer)
    }, 250)
  } catch (error) {
    console.error('Print error:', error)
    throw error
  }
}
