import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import {
  ArrowLeft,
  Briefcase,
  ChartColumn,
  Microscope,
  HelpCircle,
  MessageCircle,
  Send,
  LoaderCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Code,
  ChevronUp,
  ChevronDown,
  Check,
  PenLine,
  Save,
  X,
  FileText,
  FileDown,
  Share2,
  Link2,
} from 'lucide-react'
import { useAuth } from '../context/index.jsx'
import { ROLE_CONFIG } from '../lib/metrics.js'
import { useQueryPipeline, useDrafts, useChatHistory } from '../lib/hooks.js'
import { generateReport, insight } from '../lib/llm.js'
import { kpiCards } from '../lib/query.js'
import { compareResults, comparisonChart } from '../lib/stats.js'
import { interpretComparison } from '../lib/llm.js'
import { exportElementToPdf } from '../lib/export.js'
import { StepList, StreamingText, InsightMarkdown } from '../components/charts.jsx'
import { ChartResult } from '../components/map.jsx'
import { ChatInput, DataTable, StrategySuggestion, ScenarioGuide } from '../components/chat.jsx'

const ROLE_ICONS = { manager: Briefcase, pm: ChartColumn, analyst: Microscope }

const COLORS = {
  violet: {
    bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', textDark: 'text-violet-800', icon: 'text-violet-500',
    btn: 'bg-violet-600 hover:bg-violet-700', lightBg: 'bg-violet-50', lightBorder: 'border-violet-200', lightText: 'text-violet-600',
    lightHover: 'hover:text-violet-600', lightHoverBorder: 'hover:border-violet-300', lightHoverBg: 'hover:bg-violet-50', hoverBg: 'hover:bg-violet-100',
    ring: 'focus:ring-violet-500/20', focus: 'focus:border-violet-500', roleTab: 'text-violet-700',
  },
  blue: {
    bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', textDark: 'text-blue-800', icon: 'text-blue-500',
    btn: 'bg-blue-600 hover:bg-blue-700', lightBg: 'bg-blue-50', lightBorder: 'border-blue-200', lightText: 'text-blue-600',
    lightHover: 'hover:text-blue-600', lightHoverBorder: 'hover:border-blue-300', lightHoverBg: 'hover:bg-blue-50', hoverBg: 'hover:bg-blue-100',
    ring: 'focus:ring-blue-500/20', focus: 'focus:border-blue-500', roleTab: 'text-blue-700',
  },
  emerald: {
    bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', textDark: 'text-emerald-800', icon: 'text-emerald-500',
    btn: 'bg-emerald-600 hover:bg-emerald-700', lightBg: 'bg-emerald-50', lightBorder: 'border-emerald-200', lightText: 'text-emerald-600',
    lightHover: 'hover:text-emerald-600', lightHoverBorder: 'hover:border-emerald-300', lightHoverBg: 'hover:bg-emerald-50', hoverBg: 'hover:bg-emerald-100',
    ring: 'focus:ring-emerald-500/20', focus: 'focus:border-emerald-500', roleTab: 'text-emerald-700',
  },
}

const ATTRIBUTION = [
  { key: 'customer_tier', label: '按客户分层下钻' },
  { key: 'channel', label: '按渠道下钻' },
  { key: 'region', label: '按地区下钻' },
]

const SQL_PREVIEW = `-- Generated SQL (preview)
SELECT
  month,
  SUM(mrr) AS mrr,
  SUM(new_customers) AS new_customers,
  AVG(churn_rate) AS churn_rate,
  AVG(nrr) AS nrr
FROM financial_metrics
WHERE month BETWEEN '2026-01' AND '2026-05'
GROUP BY month
ORDER BY month;`

export default function ChatBI() {
  const navigate = useNavigate()
  const { activeRole } = useAuth()
  const [role, setRole] = useState(activeRole)
  const config = ROLE_CONFIG[role]
  const color = COLORS[config.color]
  const {
    phase,
    steps,
    results,
    insightsStream,
    error,
    clarification,
    executeQueryPipeline,
    respondToClarification,
    dismissClarification,
  } = useQueryPipeline()
  const { messages, contextSummary, addMessage, clearMessages } = useChatHistory(role)
  const { addDraft } = useDrafts(role)

  const [insightText, setInsightText] = useState('')
  const [report, setReport] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showGuide, setShowGuide] = useState(true)
  const [question, setQuestion] = useState('')
  const [reply, setReply] = useState('')
  const [comparison, setComparison] = useState(null)
  const [comparing, setComparing] = useState(false)
  const [sqlOpen, setSqlOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [attribution, setAttribution] = useState(null)
  const [attributionLoading, setAttributionLoading] = useState(null)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const insightRef = useRef(null)
  const processing = phase !== 'idle' && phase !== 'complete'

  const switchRole = (r) => {
    setRole(r)
    setComparison(null)
    setSqlOpen(false)
    setAttribution(null)
    setShareLink('')
    setInsightText('')
  }

  const ask = async (q) => {
    setInsightText('')
    setReport(null)
    setComparison(null)
    setSqlOpen(false)
    setAttribution(null)
    setShareLink('')
    setQuestion(q)
    addMessage({ id: `q-${Date.now()}`, role: 'user', content: q, timestamp: Date.now() })
    await executeQueryPipeline(q, contextSummary)
  }

  const doReply = async () => {
    if (!reply.trim()) return
    const text = reply
    setReply('')
    await respondToClarification(text)
  }

  const addAssistant = (content) => {
    if (content.trim()) {
      addMessage({ id: `a-${Date.now()}`, role: 'assistant', content, results, timestamp: Date.now() })
    }
  }

  const captureInsight = () => {
    if (insightRef.current) {
      const text = insightRef.current.innerText.trim()
      setInsightText(text)
      addAssistant(text)
    }
  }

  useEffect(() => {
    if (config.features.editableInsights && phase === 'complete' && insightRef.current) {
      const text = insightRef.current.innerText.trim()
      const apply = (t) => {
        setInsightText(t)
        addAssistant(t)
      }
      if (text.length < 20 && results.length > 0) insight(results, question).then(apply).catch(() => apply(text || '洞察生成失败，请重试。'))
      else apply(text)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const doGenerateReport = async () => {
    if (!insightText.trim() || saving) return
    setSaving(true)
    try {
      const rep = await generateReport(question || config.reportTitle, insightText, '', results)
      setReport(rep)
      addDraft({
        id: rep.id,
        title: `${config.reportTitle} - ${new Date().toLocaleDateString('zh-CN')}`,
        createdAt: new Date().toLocaleString('zh-CN'),
        role,
        query: question,
        insights: insightText,
        editedContent: insightText,
        chartResults: results,
      })
    } catch {
      const id = `draft-${Date.now()}`
      setReport({ id })
      addDraft({
        id,
        title: `${config.reportTitle} - ${new Date().toLocaleDateString('zh-CN')}`,
        createdAt: new Date().toLocaleString('zh-CN'),
        role,
        query: question,
        insights: insightText,
        editedContent: insightText,
        chartResults: results,
      })
    } finally {
      setSaving(false)
    }
  }

  const doSaveDraft = () => {
    if (!insightText.trim()) return
    addDraft({
      id: `draft-${Date.now()}`,
      title: `${config.reportTitle} - ${new Date().toLocaleDateString('zh-CN')}`,
      createdAt: new Date().toLocaleString('zh-CN'),
      role,
      query: question,
      insights: insightText,
      editedContent: insightText,
      chartResults: results,
    })
  }

  const doComparison = async () => {
    if (results.length < 2) return
    setComparing(true)
    try {
      const comp = compareResults(results[0], results[1])
      const llm = await interpretComparison({ tStatistic: comp.tStatistic, pValue: comp.pValue, significant: comp.significant, groupA: comp.groupA, groupB: comp.groupB })
      setComparison({ ...comp, chartOption: comparisonChart(comp), llmInterpretation: llm })
    } catch {
    } finally {
      setComparing(false)
    }
  }

  const toggleAttribution = (key) => {
    if (attribution === key) {
      setAttribution(null)
      return
    }
    setAttribution(key)
    setAttributionLoading(key)
    setTimeout(() => setAttributionLoading(null), 800)
  }

  const doShare = () => {
    const link = `${window.location.origin}/report/share?q=${encodeURIComponent(question)}`
    navigator.clipboard.writeText(link)
    setShareLink(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveEdit = () => {
    setInsightText(editText)
    setEditing(false)
  }

  const kpi = config.features.kpiCards ? kpiCards() : []
  const hasResults = results.length > 0

  return (
    <div id={config.pdfDivId} className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-4 w-4" /> 返回看板
            </button>
            <span className="w-px h-5 bg-slate-200" />
            <h1 className="text-sm font-semibold text-slate-900">ChatBI</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              {Object.keys(ROLE_CONFIG).map((r) => {
                const rc = ROLE_CONFIG[r]
                const Icon = ROLE_ICONS[r]
                const active = role === r
                return (
                  <button key={r} onClick={() => switchRole(r)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active ? `bg-white ${COLORS[rc.color].roleTab} shadow-sm` : 'text-slate-500 hover:text-slate-700'}`}>
                    <Icon className="h-3 w-3" /> {rc.label}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setShowGuide(!showGuide)} className={`flex items-center gap-1.5 text-xs text-slate-400 ${color.lightHover} transition-colors`}>
              <HelpCircle className="h-3.5 w-3.5" /> 使用指南
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {showGuide && <ScenarioGuide scenarios={config.guideScenarios} onSelect={ask} />}

        {messages.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">对话历史</span>
              <button onClick={clearMessages} className="text-[10px] text-slate-400 hover:text-red-500 transition-colors">清除对话</button>
            </div>
            <div className="space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? `${color.lightBg} ${color.lightText}` : 'bg-slate-100 text-slate-600'}`}>
                    <p className="line-clamp-3 whitespace-pre-wrap break-words">{m.content}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{new Date(m.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <ChatInput onSubmit={ask} isProcessing={processing} placeholder={config.placeholder} />
          <div className="flex gap-2 mt-3 flex-wrap">
            {config.recommendedQuestions.map((q) => (
              <button key={q} onClick={() => ask(q)} disabled={processing} className={`text-xs text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 ${color.lightHover} ${color.lightHoverBorder} ${color.lightHoverBg} transition-colors disabled:opacity-50 shadow-sm`}>{q}</button>
            ))}
          </div>
        </div>

        {clarification && (
          <div className={`${color.bg} ${color.border} rounded-xl border p-5 mb-6 animate-fade-in`}>
            <div className="flex items-start gap-3 mb-3">
              <MessageCircle className={`h-5 w-5 ${color.icon} shrink-0 mt-0.5`} />
              <div>
                <p className={`text-sm font-medium ${color.textDark} mb-1`}>AI 需要确认</p>
                <p className={`text-sm ${color.text}`}>{clarification.question}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="text" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doReply()} placeholder="在此回复以补充说明..." className={`flex-1 px-3 py-2 rounded-lg border ${color.lightBorder} text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none ${color.focus} ${color.ring}`} />
              <button onClick={doReply} disabled={!reply.trim()} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg ${color.btn} disabled:bg-slate-300 text-white text-sm font-medium transition-colors`}>
                <Send className="h-3.5 w-3.5" /> 回复
              </button>
              <button onClick={dismissClarification} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">忽略</button>
            </div>
          </div>
        )}

        {processing && steps.length > 0 && <div className="mb-6"><StepList steps={steps} /></div>}

        {error && !clarification && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 animate-fade-in"><p className="text-amber-700 text-sm">{error}</p></div>}

        {config.features.kpiCards && hasResults && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-fade-in">
            {kpi.map((k) => {
              const up = k.change > 0
              const down = k.change < 0
              const cls = up ? 'text-emerald-600' : down ? 'text-red-500' : 'text-slate-400'
              const arrow = up ? '↑' : down ? '↓' : '→'
              return (
                <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{k.label}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-xl font-bold text-slate-900 tabular-nums">{k.value}</span>
                    <span className="text-xs text-slate-400">{k.unit}</span>
                  </div>
                  <span className={`text-sm font-medium ${cls}`}>{arrow} {Math.abs(k.change)}% <span className="text-xs text-slate-400 font-normal">环比</span></span>
                </div>
              )
            })}
          </div>
        )}

        {config.features.comparison && hasResults && !comparison && results.length >= 2 && phase === 'complete' && (
          <div className="mb-6 animate-fade-in">
            <button onClick={doComparison} disabled={comparing} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg ${color.lightBg} border ${color.lightBorder} ${color.lightText} text-sm font-medium ${color.hoverBg} transition-colors`}>
              {comparing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
              运行对比分析检验
            </button>
          </div>
        )}

        {comparison && (
          <div className="space-y-4 mb-6 animate-fade-in">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">对比分析：{comparison.groupA.label} vs {comparison.groupB.label}</h3>
              <ReactECharts option={comparison.chartOption} style={{ height: 360 }} />
            </div>
            <div className={`rounded-xl border p-5 ${comparison.significant ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`h-5 w-5 ${comparison.significant ? 'text-emerald-600' : 'text-slate-400'}`} />
                <h4 className="font-semibold text-sm text-slate-900">统计检验结论</h4>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-slate-600">p = {comparison.pValue.toFixed(4)} {comparison.significant ? <span className="text-emerald-600 font-medium">&lt; 0.05（差异显著）</span> : <span className="text-slate-500 font-medium">&gt; 0.05（差异不显著）</span>}</p>
                <p className="text-slate-700">{comparison.llmInterpretation || comparison.interpretation}</p>
              </div>
            </div>
          </div>
        )}

        {config.features.sqlPreview && hasResults && (
          <div className="mb-4 animate-fade-in">
            <button onClick={() => setSqlOpen(!sqlOpen)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-700 text-xs font-medium transition-colors">
              <Code className="h-3.5 w-3.5" /> {sqlOpen ? '隐藏 SQL' : '查看 SQL'}
            </button>
            {sqlOpen && (
              <div className="mt-3 bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-slate-300 font-mono whitespace-pre leading-relaxed">{SQL_PREVIEW}</pre>
              </div>
            )}
          </div>
        )}

        {hasResults && !comparison && (
          config.features.dataTable ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6 animate-fade-in">
              <div className="lg:col-span-3"><ChartResult results={results} /></div>
              <div className="lg:col-span-2">{results[0] && <DataTable result={results[0]} />}</div>
            </div>
          ) : (
            <div className="mb-6 animate-fade-in"><ChartResult results={results} /></div>
          )
        )}

        {insightsStream && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-4 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className={`h-4 w-4 ${color.icon}`} />
                <h3 className="text-sm font-semibold text-slate-700">AI 洞察</h3>
              </div>
              {config.features.editableInsights && !editing ? (
                <button onClick={() => { setEditText(insightText); setEditing(true) }} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"><PenLine className="h-3 w-3" /> 编辑</button>
              ) : config.features.editableInsights && editing ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"><X className="h-3 w-3" /> 取消</button>
                  <button onClick={saveEdit} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-medium"><Save className="h-3 w-3" /> 保存</button>
                </div>
              ) : null}
            </div>
            {editing ? (
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full min-h-[120px] p-3 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 resize-y" />
            ) : (
              <div ref={insightRef}>
                <StreamingText stream={insightsStream} onComplete={config.features.editableInsights ? undefined : captureInsight} />
              </div>
            )}
          </div>
        )}

        {insightText && phase === 'complete' && <div className="mb-4 animate-fade-in"><StrategySuggestion context={insightText} /></div>}

        {report && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-4 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <FileText className={`h-4 w-4 ${color.icon}`} />
              <h3 className="text-sm font-semibold text-slate-700">报告已生成</h3>
            </div>
            <p className="text-sm text-slate-500 mb-3">报告 ID：{report.id}，已自动存入草稿箱。</p>
            <button onClick={() => navigate(`/report/${report.id}`)} className={`text-sm font-medium ${color.lightText} ${color.lightHover} transition-colors`}>查看报告 →</button>
          </div>
        )}

        {config.features.attribution && hasResults && phase === 'complete' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-4 animate-fade-in overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">归因分析</h3>
              <p className="text-xs text-slate-400 mt-0.5">逐层下钻，定位指标变化根因</p>
            </div>
            {ATTRIBUTION.map((a) => (
              <div key={a.key} className="border-b border-slate-50 last:border-b-0">
                <button onClick={() => toggleAttribution(a.key)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                  <span className="text-sm text-slate-600">{a.label}</span>
                  {attributionLoading === a.key ? <LoaderCircle className="h-4 w-4 text-emerald-500 animate-spin" /> : attribution === a.key ? <ChevronUp className="h-4 w-4 text-emerald-500" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                {attribution === a.key && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                      {a.key === 'customer_tier' && '企业版客户（月费 > ¥5,000）流失率从 2.1% 上升至 4.7%，贡献了 68% 的流失率上升。中端客户流失率保持稳定（1.8%），SMB 客户流失率略有下降（3.2% → 2.9%）。'}
                      {a.key === 'channel' && '付费投放渠道的客户流失率最高（3.8%），自然流量客户流失率最低（1.5%）。合作伙伴渠道客户质量最优，LTV 达 ¥12.8 万。'}
                      {a.key === 'region' && '华东地区贡献了 45% 的 MRR（¥128 万），华南地区增速最快（环比 +8.2%）。华北地区企业版客户流失率显著高于其他区域（5.1% vs 平均 4.7%）。'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {shareLink && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm animate-fade-in">
            <p className="text-sm text-slate-500 mb-2">分享链接：</p>
            <code className="text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded block break-all">{shareLink}</code>
          </div>
        )}

        {phase === 'complete' && (
          <div className="flex gap-3 mt-6 animate-fade-in flex-wrap">
            <button onClick={doGenerateReport} disabled={!insightText.trim() || saving} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg ${color.btn} disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium transition-colors shadow-sm`}>
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} {config.reportLabel}
            </button>
            <button onClick={doSaveDraft} disabled={!insightText.trim()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors border border-slate-200 shadow-sm disabled:opacity-50">
              <Save className="h-4 w-4" /> 保存到草稿箱
            </button>
            <button onClick={() => exportElementToPdf(config.pdfDivId, config.pdfFilename)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors border border-slate-200 shadow-sm">
              <FileDown className="h-4 w-4" /> 导出 PDF
            </button>
            {config.features.shareLink && (
              <button onClick={doShare} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors border border-slate-200 shadow-sm">
                {copied ? <><Check className="h-4 w-4 text-emerald-500" /> 已复制</> : <><Share2 className="h-4 w-4" /> 分享链接</>}
              </button>
            )}
          </div>
        )}

        {phase === 'complete' && (
          <div className="mt-4">
            <ChatInput onSubmit={ask} isProcessing={false} placeholder={config.followUpPlaceholder} />
          </div>
        )}

        {!hasResults && !processing && !error && !clarification && (
          <div className="text-center py-16">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${color.lightBg} flex items-center justify-center`}>
              {(() => { const Icon = ROLE_ICONS[role]; return <Icon className={`h-7 w-7 ${color.textDark}`} /> })()}
            </div>
            <p className="text-slate-600 text-base mb-1 font-medium">{config.emptyTitle}</p>
            <p className="text-slate-400 text-sm">{config.emptyDesc}</p>
          </div>
        )}
      </div>
    </div>
  )
}
