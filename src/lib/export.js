import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function exportElementToPdf(elementId, filename) {
  const el = document.getElementById(elementId)
  if (!el) {
    alert('导出失败：未找到内容元素。请刷新页面后重试。')
    return
  }
  try {
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const imgHeight = (canvas.height * pageWidth) / canvas.width
    const pageHeight = pdf.internal.pageSize.getHeight()
    let remaining = imgHeight
    let y = 0
    pdf.addImage(img, 'PNG', 0, y, pageWidth, imgHeight)
    remaining -= pageHeight
    while (remaining > 0) {
      y -= pageHeight
      pdf.addPage()
      pdf.addImage(img, 'PNG', 0, y, pageWidth, imgHeight)
      remaining -= pageHeight
    }
    pdf.save(`${filename}.pdf`)
  } catch (e) {
    console.error('PDF export failed:', e)
    alert('PDF 导出失败，请稍后重试。')
  }
}

export async function exportHtmlToPdf(html, filename) {
  const node = document.createElement('div')
  node.style.cssText =
    'position:fixed;left:0;top:0;width:800px;padding:32px;background:#fff;z-index:99999;opacity:0;pointer-events:none;font-size:14px;line-height:1.8;color:#1e293b;font-family:sans-serif;'
  node.innerHTML = html
  document.body.appendChild(node)
  await new Promise((r) => requestAnimationFrame(r))
  await new Promise((r) => setTimeout(r, 50))
  try {
    const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const imgHeight = (canvas.height * pageWidth) / canvas.width
    const pageHeight = pdf.internal.pageSize.getHeight()
    let remaining = imgHeight
    let y = 0
    pdf.addImage(img, 'PNG', 0, y, pageWidth, imgHeight)
    remaining -= pageHeight
    while (remaining > 0) {
      y -= pageHeight
      pdf.addPage()
      pdf.addImage(img, 'PNG', 0, y, pageWidth, imgHeight)
      remaining -= pageHeight
    }
    pdf.save(`${filename}.pdf`)
  } catch (e) {
    console.error('PDF export failed:', e)
    alert('PDF 导出失败，请稍后重试。')
  } finally {
    document.body.removeChild(node)
  }
}
