import { jsPDF } from 'jspdf'
import JsBarcode from 'jsbarcode'

// Import Arabic font support for jsPDF
// Note: You'll need to add a font file or use a workaround for Arabic text
// For now, we'll use canvas-based text rendering which supports Arabic

interface GymInfo {
  gymName?: string
  gymAddress?: string
  gymPhone?: string
  gymCountryCode?: string
  gymLogoPath?: string
  logoPreview?: string | null
  barcodeSize?: 'keychain' | 'card'
}

interface CardDimensions {
  width: number
  height: number
  headerHeight: number
  logoRadius: number
  logoPosition: { x: number; y: number }
  maxGymNameWidth: number
  gymNameX: number
  cardPadding: number
  barcodeWidth: number
  barcodeHeight: number
}

// Define dimensions for different card sizes
const CARD_DIMENSIONS: Record<'keychain' | 'card', CardDimensions> = {
  keychain: {
    width: 54,
    height: 32,
    headerHeight: 7,
    logoRadius: 3.2,
    logoPosition: { x: 7.2, y: 3.5 },
    maxGymNameWidth: 32,
    gymNameX: 13,
    cardPadding: 2,
    barcodeWidth: 36,
    barcodeHeight: 10
  },
  card: {
    width: 85.6,
    height: 54,
    headerHeight: 11,
    logoRadius: 5,
    logoPosition: { x: 10, y: 5.5 },
    maxGymNameWidth: 50,
    gymNameX: 20,
    cardPadding: 3,
    barcodeWidth: 60,
    barcodeHeight: 18
  }
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
    img.onerror = (error) => {
      console.warn('Image load error:', error)
      reject(error)
    }
    img.src = pathOrDataUrl.startsWith('file://') ? pathOrDataUrl : `file://${pathOrDataUrl}`
  })
}

// Helper function to render text as image (supports Arabic and all Unicode)
function renderTextAsImage(
  text: string,
  fontSize: number,
  fontWeight: string = 'normal',
  color: string = '#000000',
  backgroundColor: string = 'transparent'
): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  // Set font for measurement
  ctx.font = `${fontWeight} ${fontSize}px "Segoe UI", Arial, sans-serif`

  // Measure text
  const metrics = ctx.measureText(text)
  const width = Math.ceil(metrics.width) + 4 // Add padding
  const height = Math.ceil(fontSize * 1.5) // Line height

  // Set canvas size
  canvas.width = width
  canvas.height = height

  // Re-apply font after canvas resize (canvas reset)
  ctx.font = `${fontWeight} ${fontSize}px "Segoe UI", Arial, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  // Background
  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
  }

  // Text
  ctx.fillStyle = color
  ctx.fillText(text, width / 2, height / 2)

  return canvas.toDataURL('image/png')
}

export async function generateBarcodePDF(
  memberId: string,
  memberName: string,
  joinDate: string,
  gymInfo?: GymInfo
) {
  try {
    // Get dimensions based on card size
    const size = gymInfo?.barcodeSize || 'keychain'
    const dim = CARD_DIMENSIONS[size]

    // Create temporary canvas for barcode
    const canvas = document.createElement('canvas')

    // Generate barcode with size-appropriate dimensions
    const barcodeHeightPx = size === 'keychain' ? 22 : 35
    JsBarcode(canvas, memberId, {
      format: 'CODE128',
      width: 1.8, // thicker bars
      height: barcodeHeightPx,
      displayValue: false,
      background: '#ffffff',
      lineColor: '#000000',
      margin: 0
    })

    const barcodeImage = canvas.toDataURL('image/png')

    // Create PDF with appropriate dimensions
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [dim.width, dim.height]
    })

    // Modern gradient background (subtle)
    pdf.setFillColor(250, 250, 255)
    pdf.rect(0, 0, dim.width, dim.height, 'F')

    // Colored header bar with gradient effect
    pdf.setFillColor(59, 130, 246) // Blue-500
    pdf.rect(0, 0, dim.width, dim.headerHeight, 'F')

    // Lighter blue stripe
    pdf.setFillColor(96, 165, 250) // Blue-400
    pdf.rect(0, dim.headerHeight - 1, dim.width, 1, 'F')

    // Main content white card
    const cardY = dim.headerHeight + 1
    const cardHeight = dim.height - cardY - 1
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(
      dim.cardPadding,
      cardY,
      dim.width - dim.cardPadding * 2,
      cardHeight,
      1.5,
      1.5,
      'F'
    )

    // Subtle shadow effect
    pdf.setDrawColor(200, 200, 220)
    pdf.setLineWidth(0.1)
    pdf.roundedRect(
      dim.cardPadding,
      cardY,
      dim.width - dim.cardPadding * 2,
      cardHeight,
      1.5,
      1.5,
      'S'
    )

    let currentY = dim.headerHeight / 2

    // Add gym logo in header - render to canvas with circular clipping
    const logoSource = gymInfo?.logoPreview || gymInfo?.gymLogoPath

    // Logo positioning
    const circleRadius = dim.logoRadius
    const circleDiameter = circleRadius * 2
    const circleX = dim.logoPosition.x
    const circleY = dim.logoPosition.y

    if (logoSource) {
      try {
        // Load the logo image (already a data URL from logoPreview)
        let logoDataUrl = logoSource

        // If it's not a data URL, try to load it
        if (!logoSource.startsWith('data:')) {
          logoDataUrl = await loadImage(logoSource)
        }

        // Check if it's SVG - jsPDF doesn't support SVG directly
        if (logoDataUrl.startsWith('data:image/svg')) {
          throw new Error('SVG images not supported in PDF. Please use PNG, JPEG, or GIF format.')
        }

        // Validate it's a proper image format for jsPDF
        if (!logoDataUrl.match(/^data:image\/(png|jpeg|jpg|gif|webp|bmp);base64,/)) {
          throw new Error('Invalid image format. Must be PNG, JPEG, GIF, or WEBP')
        }

        // Create a canvas to render the logo in a circle with white background
        const logoCanvas = document.createElement('canvas')
        const canvasSize = 200 // High resolution for quality
        logoCanvas.width = canvasSize
        logoCanvas.height = canvasSize
        const ctx = logoCanvas.getContext('2d')

        if (ctx) {
          // Draw white circle background
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2)
          ctx.fill()

          // Clip to circle
          ctx.beginPath()
          ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2)
          ctx.clip()

          // Load and draw the logo
          const logoImg = new Image()
          await new Promise<void>((resolve, reject) => {
            logoImg.onload = () => {
              // Calculate dimensions to fit within circle
              const padding = canvasSize * 0.15 // 15% padding
              const maxSize = canvasSize - padding * 2
              const aspectRatio = logoImg.width / logoImg.height

              let drawWidth = maxSize
              let drawHeight = maxSize / aspectRatio

              if (drawHeight > maxSize) {
                drawHeight = maxSize
                drawWidth = maxSize * aspectRatio
              }

              const drawX = (canvasSize - drawWidth) / 2
              const drawY = (canvasSize - drawHeight) / 2

              ctx.drawImage(logoImg, drawX, drawY, drawWidth, drawHeight)
              resolve()
            }
            logoImg.onerror = () => reject(new Error('Failed to load logo image'))
            logoImg.src = logoDataUrl
          })

          // Convert canvas to data URL and add to PDF
          const circularLogoDataUrl = logoCanvas.toDataURL('image/png')
          const logoWidth = circleDiameter
          const logoHeight = circleDiameter
          const logoX = circleX - logoWidth / 2
          const logoY = circleY - logoHeight / 2

          pdf.addImage(circularLogoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight)
        }
      } catch (error) {
        console.error('Failed to add gym logo to PDF:', error)
        // Logo failed to load, draw white circle as placeholder
        pdf.setFillColor(255, 255, 255)
        pdf.circle(circleX, circleY, circleRadius, 'F')
      }
    }

    // Gym name in header (white text on blue) - using canvas for Unicode support
    const hasLogo = !!(gymInfo?.logoPreview || gymInfo?.gymLogoPath)
    const gymNameText = gymInfo?.gymName || 'MEMBER CARD'
    const gymNameFontSize = size === 'keychain' ? 28 : 42
    const gymNameImage = renderTextAsImage(
      gymNameText,
      gymNameFontSize,
      'bold',
      '#ffffff',
      'transparent'
    )

    // Load the rendered text image
    const tempGymNameImg = new Image()
    await new Promise<void>((resolve) => {
      tempGymNameImg.onload = () => resolve()
      tempGymNameImg.src = gymNameImage
    })

    // Calculate dimensions (scale down to fit header)
    const maxGymNameWidth = hasLogo ? dim.maxGymNameWidth : dim.width * 0.75
    const gymNameAspectRatio = tempGymNameImg.width / tempGymNameImg.height
    let gymNameWidth = maxGymNameWidth
    let gymNameHeight = gymNameWidth / gymNameAspectRatio

    const maxHeaderHeight = dim.headerHeight * 0.6
    if (gymNameHeight > maxHeaderHeight) {
      gymNameHeight = maxHeaderHeight
      gymNameWidth = gymNameHeight * gymNameAspectRatio
    }

    const gymNameX = hasLogo ? dim.gymNameX : (dim.width - gymNameWidth) / 2
    const gymNameY = dim.headerHeight / 2 - gymNameHeight / 2

    pdf.addImage(gymNameImage, 'PNG', gymNameX, gymNameY, gymNameWidth, gymNameHeight)

    // Member name (large, prominent) - using canvas for Arabic support
    const memberNameYStart = cardY + (size === 'keychain' ? 1.5 : 3.5)
    const memberNameFontSize = size === 'keychain' ? 22 : 40
    const memberNameImage = renderTextAsImage(
      memberName,
      memberNameFontSize,
      'bold',
      '#1e293b',
      'transparent'
    )

    const tempMemberNameImg = new Image()
    await new Promise<void>((resolve) => {
      tempMemberNameImg.onload = () => resolve()
      tempMemberNameImg.src = memberNameImage
    })

    const maxMemberNameWidth = dim.width * 0.85
    const memberNameAspectRatio = tempMemberNameImg.width / tempMemberNameImg.height
    const scaleFactor = size === 'keychain' ? 0.12 : 0.15
    const memberNameWidth = Math.min(maxMemberNameWidth, tempMemberNameImg.width * scaleFactor)
    const memberNameHeight = memberNameWidth / memberNameAspectRatio

    const memberNameX = (dim.width - memberNameWidth) / 2
    const memberNameY = memberNameYStart

    pdf.addImage(
      memberNameImage,
      'PNG',
      memberNameX,
      memberNameY,
      memberNameWidth,
      memberNameHeight
    )

    // Small divider line - positioned BELOW the name
    currentY = memberNameYStart + memberNameHeight + (size === 'keychain' ? 0.5 : 1.2)
    pdf.setDrawColor(226, 232, 240) // Slate-200
    pdf.setLineWidth(0.2)
    const dividerMargin = dim.width * 0.15
    pdf.line(dividerMargin, currentY, dim.width - dividerMargin, currentY)

    // Add barcode (centered, prominent)
    const barcodeYOffset = size === 'keychain' ? 1 : 2.5
    currentY = currentY + barcodeYOffset
    const barcodeWidth = dim.barcodeWidth
    const barcodeHeight = dim.barcodeHeight
    const barcodeX = (dim.width - barcodeWidth) / 2
    pdf.addImage(barcodeImage, 'PNG', barcodeX, currentY, barcodeWidth, barcodeHeight)

    // Bottom info section - add more spacing after barcode
    const bottomSpacing = size === 'keychain' ? 1.5 : 3
    currentY = currentY + barcodeHeight + bottomSpacing
    const bottomFontSize = size === 'keychain' ? 4.5 : 7
    pdf.setFontSize(bottomFontSize)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 116, 139) // Slate-500

    const parsedDate =
      joinDate && !isNaN(new Date(joinDate).getTime())
        ? new Date(joinDate).toLocaleDateString('en-GB')
        : 'N/A'

    // Join date
    pdf.text(`Member since ${parsedDate}`, dim.width / 2, currentY, { align: 'center' })

    // Contact info at the very bottom - using canvas for emoji support
    if (gymInfo?.gymPhone || gymInfo?.gymAddress) {
      const contactSpacing = size === 'keychain' ? 1 : 1.5
      currentY += contactSpacing
      const bottomInfo: string[] = []
      if (gymInfo.gymPhone) {
        const phoneText = gymInfo.gymCountryCode
          ? `${gymInfo.gymCountryCode} ${gymInfo.gymPhone}`
          : gymInfo.gymPhone
        bottomInfo.push(phoneText)
      }
      if (gymInfo.gymAddress) bottomInfo.push(gymInfo.gymAddress)

      const bottomInfoText = bottomInfo.join(' • ')
      const contactFontSize = size === 'keychain' ? 11 : 18
      const bottomInfoImage = renderTextAsImage(
        bottomInfoText,
        contactFontSize,
        'normal',
        '#94a3b8',
        'transparent'
      )

      const tempBottomImg = new Image()
      await new Promise<void>((resolve) => {
        tempBottomImg.onload = () => resolve()
        tempBottomImg.src = bottomInfoImage
      })

      const maxBottomWidth = dim.width * 0.9
      const bottomAspectRatio = tempBottomImg.width / tempBottomImg.height
      const bottomScaleFactor = size === 'keychain' ? 0.07 : 0.08
      const bottomWidth = Math.min(maxBottomWidth, tempBottomImg.width * bottomScaleFactor)
      const bottomHeight = bottomWidth / bottomAspectRatio

      const bottomX = (dim.width - bottomWidth) / 2
      pdf.addImage(bottomInfoImage, 'PNG', bottomX, currentY, bottomWidth, bottomHeight)
    }

    // Save PDF
    const sizeLabel = size === 'keychain' ? 'keychain' : 'card'
    const fileName = `${sizeLabel}-barcode-${memberName.replace(/\s+/g, '-').toLowerCase()}.pdf`
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
    // Get dimensions based on card size
    const size = gymInfo?.barcodeSize || 'keychain'
    const dim = CARD_DIMENSIONS[size]

    const printContainer = document.createElement('div')
    printContainer.style.position = 'fixed'
    printContainer.style.left = '-9999px'
    document.body.appendChild(printContainer)

    // Generate barcode with better resolution for printing
    const canvas = document.createElement('canvas')
    const barcodeHeightPx = size === 'keychain' ? 45 : 70
    JsBarcode(canvas, memberId, {
      format: 'CODE128',
      width: 1.8,
      height: barcodeHeightPx,
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
    const logoSize = size === 'keychain' ? '5mm' : '8mm'
    const logoPadding = size === 'keychain' ? '0.3mm' : '0.5mm'
    const logoTop = size === 'keychain' ? '1.5mm' : '2mm'
    const logoLeft = size === 'keychain' ? '2mm' : '3mm'
    const logoHTML = logoSource
      ? `<div style="
          position: absolute;
          top: ${logoTop};
          left: ${logoLeft};
          width: ${logoSize};
          height: ${logoSize};
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: ${logoPadding};
        ">
          <img src="${logoSource}"
               style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain;"
               onerror="this.style.display='none'" />
        </div>`
      : ''

    const gymNameHTML = gymInfo?.gymName || 'MEMBER CARD'
    const hasLogoForLayout = !!logoSource

    const bottomInfoParts: string[] = []
    if (gymInfo?.gymPhone) {
      const phoneText = gymInfo.gymCountryCode
        ? `Tel: ${gymInfo.gymCountryCode} ${gymInfo.gymPhone}`
        : `Tel: ${gymInfo.gymPhone}`
      bottomInfoParts.push(phoneText)
    }
    if (gymInfo?.gymAddress) bottomInfoParts.push(gymInfo.gymAddress)
    const contactFontSize = size === 'keychain' ? '4pt' : '6pt'
    const contactMargin = size === 'keychain' ? '1mm' : '1.5mm'
    const bottomInfoHTML =
      bottomInfoParts.length > 0
        ? `<div style="font-size: ${contactFontSize}; color: #94a3b8; margin-top: ${contactMargin};">${bottomInfoParts.join(' • ')}</div>`
        : ''

    const gymNameFontSize = size === 'keychain' ? '8pt' : '12pt'
    const memberNameFontSize = size === 'keychain' ? '7pt' : '11pt'
    const dateFontSize = size === 'keychain' ? '5pt' : '8pt'
    const headerPadding = size === 'keychain' ? '0 2mm' : '0 3mm'
    const cardPadding = size === 'keychain' ? '2mm' : '3mm'
    const logoMarginLeft = hasLogoForLayout ? (size === 'keychain' ? '5mm' : '8mm') : '0'

    // Build modern print layout
    printContainer.innerHTML = `
      <div style="
        width: ${dim.width}mm;
        height: ${dim.height}mm;
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
          height: ${dim.headerHeight}mm;
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
          display: flex;
          align-items: center;
          justify-content: ${hasLogoForLayout ? 'flex-start' : 'center'};
          padding: ${headerPadding};
        ">
          ${logoHTML}
          <div style="
            font-size: ${gymNameFontSize};
            font-weight: bold;
            color: white;
            margin-left: ${logoMarginLeft};
            letter-spacing: 0.3px;
          ">
            ${gymNameHTML}
          </div>
        </div>

        <!-- Main card content -->
        <div style="
          position: absolute;
          top: ${dim.headerHeight + 1}mm;
          left: ${cardPadding};
          right: ${cardPadding};
          bottom: 1mm;
          background: white;
          border-radius: 1.5mm;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: ${cardPadding};
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        ">
          <!-- Member name -->
          <div style="
            font-size: ${memberNameFontSize};
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
            font-size: ${dateFontSize};
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
                size: ${dim.width}mm ${dim.height}mm;
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
