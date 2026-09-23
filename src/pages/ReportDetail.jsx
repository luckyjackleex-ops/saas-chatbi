import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, FileDown, ChartColumn } from 'lucide-react'
import { readDrafts } from '../lib/store.js'
import { exportElementToPdf } from '../lib/export.js'
import { ChartResult } from '../components/map.jsx'

function loadReport(id) {
  try {
    const drafts = readDrafts()
    const found = drafts.find((d) => d.id === id)
    if (!found) return null
    const sections = [{ title: '核心指标摘要', content: found.editedContent || found.insights || '（暂无内容）', editable: true }]
    if (found.suggestions) sections.push({ title: '策略建议', content: found.suggestions, editable: true })
    return {
      report: { id: found.id, title: found.title, createdAt: found.createdAt, role: found.role, sections },
      chartResults: found.chartResults,
    }
  } catch {
    return null
  }
}

export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [report, setReport] = useState(null)
  const [charts, setCharts] = useState(null)

  useEffect(() => {
    if (!id) return
    const hash = window.location.hash
    if (hash && hash.startsWith('#data=')) {
      try {
        const data = JSON.parse(decodeURIComponent(atob(hash.replace('#data=', ''))))
        setReport(data.report)
        setCharts(data.chartResults || null)
        return
      } catch {}
    }
    const loaded = loadReport(id)
    setReport(loaded?.report || null)
    setCharts(loaded?.chartResults || null)
  }, [id])

  if (status === 'loading' && !report) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400 text-sm">加载中...</p></div>
  }
  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500 text-sm">报告未找到</p>
        <button onClick={() => navigate('/')} className="text-sm text-violet-600 hover:text-violet-700 transition-colors">返回 Dashboard →</button>
      </div>
    )
  }
  return (
    <div id="report-content" className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
            <p className="text-sm text-slate-400 mt-2 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{report.createdAt}</p>
          </div>
          <button onClick={() => exportElementToPdf('report-content', report.title)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors shadow-sm">
            <FileDown className="h-4 w-4" /> 下载 PDF
          </button>
        </div>
        {charts && charts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ChartColumn className="h-4 w-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">数据图表</h2>
            </div>
            <ChartResult results={charts} height={320} />
          </div>
        )}
        <div className="space-y-4">
          {report.sections.map((s, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-3">{s.title}</h2>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
