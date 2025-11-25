import { jsPDF } from 'jspdf'
import JsBarcode from 'jsbarcode'

interface GymInfo {
  gymName?: string
  gymAddress?: string
  gymPhone?: string
  gymLogoPath?: string
  logoPreview?: string | null
}

// Helper function to load images (accepts both file paths and data URLs)
async function loadImage(pathOrDataUrl: string): Promise<string> {
  // If it's already a data URL, return it directly
  if (pathOrDataUrl.startsWith('data:')) {
    return pathOrDataUrl
  }

  // Otherwise, try to load from file system
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } else {
        reject(new Error('Failed to get canvas context'))
      }
    }
    img.onerror = reject
    img.src = pathOrDataUrl.startsWith('file://') ? pathOrDataUrl : `file://${pathOrDataUrl}`
  })
}

export async function generateBarcodePDF(
  memberId: string,
  memberName: string,
  joinDate: string,
  gymInfo?: GymInfo
) {
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

    // Create PDF (54x32mm for better spacing)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [54, 32]
    })

    // Modern gradient background (subtle)
    pdf.setFillColor(250, 250, 255)
    pdf.rect(0, 0, 54, 32, 'F')

    // Colored header bar with gradient effect
    pdf.setFillColor(59, 130, 246) // Blue-500
    pdf.rect(0, 0, 54, 7, 'F')

    // Lighter blue stripe
    pdf.setFillColor(96, 165, 250) // Blue-400
    pdf.rect(0, 6, 54, 1, 'F')

    // Main content white card
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(2, 8, 50, 22, 1.5, 1.5, 'F')

    // Subtle shadow effect
    pdf.setDrawColor(200, 200, 220)
    pdf.setLineWidth(0.1)
    pdf.roundedRect(2, 8, 50, 22, 1.5, 1.5, 'S')

    let currentY = 3

    // Add gym logo in header (white background circle)
    const logoSource = gymInfo?.logoPreview || gymInfo?.gymLogoPath
    if (logoSource) {
      try {
        const logoImg = await loadImage(logoSource)

        // Create a temporary image to get dimensions
        const tempImg = new Image()
        await new Promise<void>((resolve) => {
          tempImg.onload = () => resolve()
          tempImg.src = logoImg
        })

        // Calculate aspect ratio to fit within circle
        const circleRadius = 2.5
        const circleDiameter = circleRadius * 2
        const circleX = 6
        const circleY = 3.5

        // White circle background for logo
        pdf.setFillColor(255, 255, 255)
        pdf.circle(circleX, circleY, circleRadius, 'F')

        // Calculate dimensions to fit within circle while maintaining aspect ratio
        const aspectRatio = tempImg.width / tempImg.height
        let logoWidth = circleDiameter * 0.8  // 80% of circle diameter for padding
        let logoHeight = logoWidth / aspectRatio

        if (logoHeight > circleDiameter * 0.8) {
          logoHeight = circleDiameter * 0.8
          logoWidth = logoHeight * aspectRatio
        }

        // Center the logo in the circle
        const logoX = circleX - logoWidth / 2
        const logoY = circleY - logoHeight / 2

        pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight)
      } catch (error) {
        console.warn('Failed to load gym logo:', error)
      }
    }

    // Gym name in header (white text on blue)
    const hasLogo = !!(gymInfo?.logoPreview || gymInfo?.gymLogoPath)
    if (gymInfo?.gymName) {
      pdf.setFontSize(7.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      const xPos = hasLogo ? 11 : 27
      const align = hasLogo ? 'left' : 'center'
      pdf.text(gymInfo.gymName, xPos, 4.5, { align: align as 'left' | 'center' })
    } else {
      // Default "Member Card" text
      pdf.setFontSize(7.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('MEMBER CARD', 27, 4.5, { align: 'center' })
    }

    // Member name (large, prominent)
    currentY = 12
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(30, 41, 59) // Slate-800
    pdf.text(memberName, 27, currentY, { align: 'center' })

    // Small divider line
    pdf.setDrawColor(226, 232, 240) // Slate-200
    pdf.setLineWidth(0.2)
    pdf.line(8, currentY + 1, 46, currentY + 1)

    // Add barcode (centered, prominent)
    currentY = 15
    const barcodeWidth = 38
    const barcodeHeight = 12
    const barcodeX = (54 - barcodeWidth) / 2
    pdf.addImage(barcodeImage, 'PNG', barcodeX, currentY, barcodeWidth, barcodeHeight)

    // Bottom info section with icons
    currentY = 28
    pdf.setFontSize(4.5)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 116, 139) // Slate-500

    const parsedDate =
      joinDate && !isNaN(new Date(joinDate).getTime())
        ? new Date(joinDate).toLocaleDateString('en-GB')
        : 'N/A'

    // Join date
    pdf.text(`Member since ${parsedDate}`, 27, currentY, { align: 'center' })

    // Contact info at the very bottom
    if (gymInfo?.gymPhone || gymInfo?.gymAddress) {
      currentY += 1.8
      const bottomInfo: string[] = []
      if (gymInfo.gymPhone) bottomInfo.push(`📞 ${gymInfo.gymPhone}`)
      if (gymInfo.gymAddress) bottomInfo.push(`📍 ${gymInfo.gymAddress}`)
      pdf.setFontSize(3.5)
      pdf.setTextColor(148, 163, 184) // Slate-400
      pdf.text(bottomInfo.join('  •  '), 27, currentY, { align: 'center' })
    }

    // Save PDF
    const fileName = `keychain-barcode-${memberName.replace(/\s+/g, '-').toLowerCase()}.pdf`
    pdf.save(fileName)
  } catch (error) {
    console.error('PDF generation error:', error)
    throw error
  }
}

export function printBarcode(
  memberId: string,
  memberName: string,
  joinDate: string,
  gymInfo?: GymInfo
) {
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

    const logoSource = gymInfo?.logoPreview || gymInfo?.gymLogoPath
    const logoHTML = logoSource
      ? `<div style="
          position: absolute;
          top: 1.5mm;
          left: 2mm;
          width: 5mm;
          height: 5mm;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 0.3mm;
        ">
          <img src="${logoSource.startsWith('data:') ? logoSource : `file://${logoSource}`}"
               style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain;" />
        </div>`
      : ''

    const gymNameHTML = gymInfo?.gymName || 'MEMBER CARD'
    const hasLogoForLayout = !!logoSource

    const bottomInfoParts: string[] = []
    if (gymInfo?.gymPhone) bottomInfoParts.push(`📞 ${gymInfo.gymPhone}`)
    if (gymInfo?.gymAddress) bottomInfoParts.push(`📍 ${gymInfo.gymAddress}`)
    const bottomInfoHTML =
      bottomInfoParts.length > 0
        ? `<div style="font-size: 4pt; color: #94a3b8; margin-top: 1mm;">${bottomInfoParts.join('  •  ')}</div>`
        : ''

    // Build modern print layout
    printContainer.innerHTML = `
      <div style="
        width: 54mm;
        height: 32mm;
        font-family: 'Segoe UI', Arial, sans-serif;
        text-align: center;
        background: linear-gradient(135deg, #fafafe 0%, #f0f4ff 100%);
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
      ">
        <!-- Header with gradient -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 7mm;
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
          display: flex;
          align-items: center;
          justify-content: ${hasLogoForLayout ? 'flex-start' : 'center'};
          padding: 0 2mm;
        ">
          ${logoHTML}
          <div style="
            font-size: 8pt;
            font-weight: bold;
            color: white;
            margin-left: ${hasLogoForLayout ? '5mm' : '0'};
            letter-spacing: 0.3px;
          ">
            ${gymNameHTML}
          </div>
        </div>

        <!-- Main card content -->
        <div style="
          position: absolute;
          top: 8mm;
          left: 2mm;
          right: 2mm;
          bottom: 1mm;
          background: white;
          border-radius: 1.5mm;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 2mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        ">
          <!-- Member name -->
          <div style="
            font-size: 7pt;
            font-weight: bold;
            color: #1e293b;
            margin-top: 1mm;
          ">
            ${memberName}
          </div>

          <!-- Divider -->
          <div style="
            width: 80%;
            height: 0.2mm;
            background: #e2e8f0;
            margin: 0.5mm auto;
          "></div>

          <!-- Barcode -->
          <div style="
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1mm 0;
          ">
            <img src="${canvas.toDataURL()}" style="width: 85%; height: auto;" />
          </div>

          <!-- Footer info -->
          <div style="
            font-size: 5pt;
            color: #64748b;
            margin-bottom: 0.5mm;
          ">
            Member since ${parsedDate}
          </div>
          ${bottomInfoHTML}
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
          <title>Print Member Card</title>
          <style>
            @media print {
              @page {
                size: 54mm 32mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
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
