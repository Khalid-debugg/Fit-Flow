import { jsPDF } from 'jspdf'
import { ReportData } from '@renderer/models/report'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

interface ReportPdfOptions {
  data: ReportData
  startDate: string
  endDate: string
  language?: string
}

// Helper function to render text as image (supports Arabic and all Unicode)
function renderTextAsImage(
  text: string,
  fontSize: number,
  fontWeight: string = 'normal',
  color: string = '#000000'
): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  // Set font for measurement
  ctx.font = `${fontWeight} ${fontSize}px "Segoe UI", Arial, sans-serif`

  // Measure text
  const metrics = ctx.measureText(text)
  const width = Math.ceil(metrics.width) + 4
  const height = Math.ceil(fontSize * 1.5)

  // Set canvas size
  canvas.width = width
  canvas.height = height

  // Re-apply font after canvas resize
  ctx.font = `${fontWeight} ${fontSize}px "Segoe UI", Arial, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  // Text
  ctx.fillStyle = color
  ctx.fillText(text, width / 2, height / 2)

  return canvas.toDataURL('image/png')
}

export async function generateReportPDF(options: ReportPdfOptions): Promise<void> {
  const { data, startDate, endDate, language = 'en' } = options
  const dateLocale = language === 'ar' ? ar : enUS

  try {
    // Create PDF - A4 Portrait
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = 210
    const pageHeight = 297
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let currentY = margin

    // Background
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')

    // Title
    const titleText = language === 'ar' ? 'تقرير الإيرادات والإحصائيات' : 'Revenue & Statistics Report'
    const titleImage = renderTextAsImage(titleText, 48, 'bold', '#1f2937')
    const titleImg = new Image()
    await new Promise<void>((resolve) => {
      titleImg.onload = () => resolve()
      titleImg.src = titleImage
    })

    const titleHeight = 15
    const titleWidth = (titleImg.width * titleHeight) / titleImg.height
    pdf.addImage(titleImage, 'PNG', (pageWidth - titleWidth) / 2, currentY, titleWidth, titleHeight)
    currentY += titleHeight + 8

    // Date Range
    const dateRangeText = `${format(new Date(startDate), 'dd MMM yyyy', { locale: dateLocale })} - ${format(new Date(endDate), 'dd MMM yyyy', { locale: dateLocale })}`
    const dateImage = renderTextAsImage(dateRangeText, 28, 'normal', '#6b7280')
    const dateImg = new Image()
    await new Promise<void>((resolve) => {
      dateImg.onload = () => resolve()
      dateImg.src = dateImage
    })

    const dateHeight = 8
    const dateWidth = (dateImg.width * dateHeight) / dateImg.height
    pdf.addImage(dateImage, 'PNG', (pageWidth - dateWidth) / 2, currentY, dateWidth, dateHeight)
    currentY += dateHeight + 10

    // Divider
    pdf.setDrawColor(229, 231, 235)
    pdf.setLineWidth(0.5)
    pdf.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 10

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0
      }).format(amount)
    }

    // Key Metrics Section
    const metricsTitle = language === 'ar' ? 'المؤشرات الرئيسية' : 'Key Metrics'
    const metricsTitleImage = renderTextAsImage(metricsTitle, 36, 'bold', '#1f2937')
    const metricsTitleImg = new Image()
    await new Promise<void>((resolve) => {
      metricsTitleImg.onload = () => resolve()
      metricsTitleImg.src = metricsTitleImage
    })

    const metricsTitleHeight = 10
    const metricsTitleWidth = (metricsTitleImg.width * metricsTitleHeight) / metricsTitleImg.height
    pdf.addImage(metricsTitleImage, 'PNG', margin, currentY, metricsTitleWidth, metricsTitleHeight)
    currentY += metricsTitleHeight + 8

    // Metrics Grid
    const metrics = [
      {
        label: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
        value: formatCurrency(data.summary.totalRevenue),
        color: [34, 197, 94]
      },
      {
        label: language === 'ar' ? 'أعضاء جدد' : 'New Members',
        value: data.summary.newMembers.toString(),
        color: [59, 130, 246]
      },
      {
        label: language === 'ar' ? 'عضويات جديدة' : 'New Memberships',
        value: data.summary.newMemberships.toString(),
        color: [234, 179, 8]
      },
      {
        label: language === 'ar' ? 'إجمالي تسجيلات الحضور' : 'Total Check-Ins',
        value: data.summary.totalCheckIns.toString(),
        color: [168, 85, 247]
      }
    ]

    const boxWidth = (contentWidth - 10) / 2
    const boxHeight = 35

    for (let i = 0; i < metrics.length; i++) {
      const row = Math.floor(i / 2)
      const col = i % 2
      const x = margin + col * (boxWidth + 10)
      const y = currentY + row * (boxHeight + 8)

      // Box background
      pdf.setFillColor(249, 250, 251)
      pdf.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'F')

      // Box border
      const [r, g, b] = metrics[i].color
      pdf.setDrawColor(r, g, b)
      pdf.setLineWidth(0.8)
      pdf.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'S')

      // Label
      const labelImage = renderTextAsImage(metrics[i].label, 20, 'normal', '#6b7280')
      const labelImg = new Image()
      await new Promise<void>((resolve) => {
        labelImg.onload = () => resolve()
        labelImg.src = labelImage
      })

      const labelHeight = 5
      const labelWidth = (labelImg.width * labelHeight) / labelImg.height
      pdf.addImage(labelImage, 'PNG', x + (boxWidth - labelWidth) / 2, y + 8, labelWidth, labelHeight)

      // Value
      const valueImage = renderTextAsImage(metrics[i].value, 44, 'bold', '#1f2937')
      const valueImg = new Image()
      await new Promise<void>((resolve) => {
        valueImg.onload = () => resolve()
        valueImg.src = valueImage
      })

      const valueHeight = 10
      const valueWidth = (valueImg.width * valueHeight) / valueImg.height
      pdf.addImage(
        valueImage,
        'PNG',
        x + (boxWidth - valueWidth) / 2,
        y + 20,
        valueWidth,
        valueHeight
      )
    }

    currentY += boxHeight * 2 + 8 + 15

    // Additional Metrics
    const additionalTitle = language === 'ar' ? 'إحصائيات إضافية' : 'Additional Statistics'
    const additionalTitleImage = renderTextAsImage(additionalTitle, 36, 'bold', '#1f2937')
    const additionalTitleImg = new Image()
    await new Promise<void>((resolve) => {
      additionalTitleImg.onload = () => resolve()
      additionalTitleImg.src = additionalTitleImage
    })

    const additionalTitleHeight = 10
    const additionalTitleWidth =
      (additionalTitleImg.width * additionalTitleHeight) / additionalTitleImg.height
    pdf.addImage(
      additionalTitleImage,
      'PNG',
      margin,
      currentY,
      additionalTitleWidth,
      additionalTitleHeight
    )
    currentY += additionalTitleHeight + 8

    // Additional stats
    const additionalStats = [
      {
        label: language === 'ar' ? 'إجمالي الأعضاء' : 'Total Members',
        value: data.summary.totalMembers.toString()
      },
      {
        label: language === 'ar' ? 'الأعضاء النشطون' : 'Active Members',
        value: data.summary.activeMembers.toString()
      },
      {
        label: language === 'ar' ? 'متوسط الإيرادات اليومية' : 'Avg Daily Revenue',
        value: formatCurrency(data.summary.averageDailyRevenue)
      },
      {
        label: language === 'ar' ? 'متوسط الحضور اليومي' : 'Avg Daily Check-Ins',
        value: Math.round(data.summary.averageDailyCheckIns).toString()
      }
    ]

    const smallBoxWidth = (contentWidth - 15) / 4
    const smallBoxHeight = 25

    for (let i = 0; i < additionalStats.length; i++) {
      const x = margin + i * (smallBoxWidth + 5)

      // Box background
      pdf.setFillColor(249, 250, 251)
      pdf.roundedRect(x, currentY, smallBoxWidth, smallBoxHeight, 2, 2, 'F')

      // Label
      const statLabelImage = renderTextAsImage(additionalStats[i].label, 16, 'normal', '#6b7280')
      const statLabelImg = new Image()
      await new Promise<void>((resolve) => {
        statLabelImg.onload = () => resolve()
        statLabelImg.src = statLabelImage
      })

      const statLabelHeight = 4
      const statLabelWidth = (statLabelImg.width * statLabelHeight) / statLabelImg.height
      pdf.addImage(
        statLabelImage,
        'PNG',
        x + (smallBoxWidth - statLabelWidth) / 2,
        currentY + 5,
        statLabelWidth,
        statLabelHeight
      )

      // Value
      const statValueImage = renderTextAsImage(additionalStats[i].value, 32, 'bold', '#1f2937')
      const statValueImg = new Image()
      await new Promise<void>((resolve) => {
        statValueImg.onload = () => resolve()
        statValueImg.src = statValueImage
      })

      const statValueHeight = 8
      const statValueWidth = (statValueImg.width * statValueHeight) / statValueImg.height
      pdf.addImage(
        statValueImage,
        'PNG',
        x + (smallBoxWidth - statValueWidth) / 2,
        currentY + 13,
        statValueWidth,
        statValueHeight
      )
    }

    currentY += smallBoxHeight + 15

    // Footer
    pdf.setDrawColor(229, 231, 235)
    pdf.setLineWidth(0.5)
    pdf.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 5

    const generatedText = `${language === 'ar' ? 'تم الإنشاء في' : 'Generated on'}: ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: dateLocale })}`
    const footerImage = renderTextAsImage(generatedText, 20, 'normal', '#9ca3af')
    const footerImg = new Image()
    await new Promise<void>((resolve) => {
      footerImg.onload = () => resolve()
      footerImg.src = footerImage
    })

    const footerHeight = 5
    const footerWidth = (footerImg.width * footerHeight) / footerImg.height
    pdf.addImage(
      footerImage,
      'PNG',
      (pageWidth - footerWidth) / 2,
      currentY,
      footerWidth,
      footerHeight
    )

    // Generate filename
    const dateStr = format(new Date(), 'yyyy-MM-dd')
    const filename = `report-${format(new Date(startDate), 'yyyy-MM-dd')}_to_${format(new Date(endDate), 'yyyy-MM-dd')}_generated-${dateStr}.pdf`

    // Save PDF
    pdf.save(filename)
  } catch (error) {
    console.error('PDF generation error:', error)
    throw error
  }
}
