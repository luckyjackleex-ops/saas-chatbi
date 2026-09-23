import { useEffect, useMemo, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import {
  X,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  LoaderCircle,
  FileText,
  MapPin,
  DollarSign,
  Users,
  TrendingDown,
  UserPlus,
  Activity,
} from 'lucide-react'
import { METRIC_DICTIONARY } from '../lib/metrics.js'
import { useQueryPipeline, useDrafts } from '../lib/hooks.js'
import { generateSuggestions, generateSuggestionsFallback, generateReport } from '../lib/llm.js'
import { StepList, StreamingText, InsightMarkdown } from './charts.jsx'
import { ChartResult } from './map.jsx'
import { SimpleInput } from './chat.jsx'

export function MetricDictionary({ open, onClose, metrics = METRIC_DICTIONARY }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-[480px] bg-white shadow-2xl h-full overflow-y-auto animate-slide-in-right">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-bold text-slate-800">统一口径 · 指标词典</h2>
            <p className="text-xs text-slate-500 mt-0.5">所有指标的标准定义与计算公式，确保团队数据认知对齐</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X className="h-4 w-4 text-slate-400" /></button>
        </div>
        <div className="px-6 py-4 space-y-6">
          {metrics.map((m) => (
            <div key={m.key} className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-brand-600" /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{m.label}<span className="text-[10px] text-slate-400 font-normal ml-1.5">{m.unit}</span></h3>
                  <p className="text-xs text-slate-500">{m.fullName}</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb className="h-3 w-3 text-amber-600" />
                  <span className="text-[10px] font-semibold text-amber-700 uppercase">计算公式</span>
                </div>
                <p className="text-xs text-amber-800 font-mono leading-relaxed">{m.formula}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1 h-1 rounded-full bg-brand-400" />
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">业务含义</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{m.business}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 px-6 py-3 text-[10px] text-slate-400">数据口径统一，决策才能对齐。如有疑问，请联系数据团队。</div>
      </div>
    </div>
  )
}

export function MetricDrawer({ open, onClose, metric }) {
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
  const { addDraft } = useDrafts('manager')
  const [insights, setInsights] = useState('')
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState(null)
  const [query, setQuery] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [suggestionStream, setSuggestionStream] = useState(null)
  const [suggestionText, setSuggestionText] = useState('')
  const insightRef = useRef(null)
  const suggestionRef = useRef(null)
  const ran = useRef(false)
  const processing = phase !== 'idle' && phase !== 'complete'

  useEffect(() => {
    if (!open || !metric || ran.current) return
    ran.current = true
    const q = `分析${metric.label}最近的变化趋势和原因，当前值为 ${metric.value}`
    setQuery(q)
    executeQueryPipeline(q)
  }, [open, metric, executeQueryPipeline])

  useEffect(() => {
    if (!open) {
      ran.current = false
      setInsights('')
      setReply('')
      setSavedId(null)
      setQuery('')
      setSuggestionText('')
      setSuggestionStream(null)
    }
  }, [open])

  const captureInsights = () => {
    if (insightRef.current) setInsights(insightRef.current.innerText.trim())
  }

  const runQuestion = async (q) => {
    setInsights('')
    setReply('')
    setSavedId(null)
    setQuery(q)
    setSuggestionText('')
    setSuggestionStream(null)
    await executeQueryPipeline(q)
  }

  const doReply = async () => {
    if (!reply.trim()) return
    const text = reply
    setReply('')
    await respondToClarification(text)
  }

  const doSuggest = async () => {
    if (suggesting) return
    setSuggesting(true)
    setSuggestionText('')
    setSuggestionStream(generateSuggestions(`用户问题：${query}\n\nAI洞察：${insights}`))
  }

  const onSuggestionComplete = async () => {
    setSuggesting(false)
    if (suggestionRef.current) {
      const text = suggestionRef.current.innerText.trim()
      if (text.length < 20) {
        try {
          setSuggestionText(await generateSuggestionsFallback(`用户问题：${query}\n\nAI洞察：${insights}`))
        } catch {
          setSuggestionText(text || '策略建议生成失败，请重试。')
        }
      }
    }
  }

  const saveReport = async () => {
    if (!insights.trim() || saving) return
    setSaving(true)
    try {
      const report = await generateReport(metric?.label || '数据分析', insights, '', results)
      setSavedId(report.id)
      addDraft({
        id: report.id,
        title: `${metric?.label || '数据'}分析报告 - ${new Date().toLocaleDateString('zh-CN')}`,
        createdAt: new Date().toLocaleString('zh-CN'),
        role: 'manager',
        query,
        insights,
        editedContent: insights,
        chartResults: results,
      })
    } catch {
      const id = `draft-${Date.now()}`
      setSavedId(id)
      addDraft({
        id,
        title: `${metric?.label || '数据'}分析 - ${new Date().toLocaleDateString('zh-CN')}`,
        createdAt: new Date().toLocaleString('zh-CN'),
        role: 'manager',
        query,
        insights,
        editedContent: insights,
        chartResults: results,
      })
    } finally {
      setSaving(false)
    }
  }

  const hasResults = results.length > 0
  return (
    <>
      <div className={`slide-panel-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`slide-panel ${open ? 'open' : ''} flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-4 w-4 text-brand-500" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800">{metric ? `分析：${metric.label}` : '数据分析'}</h3>
              {metric && <p className="text-xs text-slate-400 mt-0.5">当前值：{typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {processing && steps.length > 0 && <div className="mb-6"><StepList steps={steps} /></div>}
          {error && !clarification && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 animate-fade-in"><p className="text-amber-700 text-sm">{error}</p></div>}
          {clarification && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6 animate-fade-in">
              <p className="text-sm font-medium text-brand-800 mb-1">AI 需要确认</p>
              <p className="text-sm text-brand-700 mb-3">{clarification.question}</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doReply()}
                  placeholder="补充说明..."
                  className="flex-1 px-3 py-2 rounded-lg border border-brand-200 text-sm focus:outline-none focus:border-brand-500"
                />
                <button onClick={doReply} disabled={!reply.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white text-sm font-medium transition-colors">
                  <SendIcon /> 回复
                </button>
                <button onClick={dismissClarification} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700">忽略</button>
              </div>
            </div>
          )}
          {hasResults && phase !== 'idle' && <div className="mb-6 animate-fade-in"><ChartResult results={results} height={280} /></div>}
          {insightsStream && (
            <div className="mb-6 animate-fade-in">
              <div ref={insightRef}>
                <StreamingText stream={insightsStream} onComplete={captureInsights} />
              </div>
            </div>
          )}
          {insights && phase === 'complete' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 animate-fade-in shadow-sm"><InsightMarkdown text={insights} /></div>
          )}
          {insights && phase === 'complete' && !suggestionStream && !suggestionText && (
            <button
              onClick={doSuggest}
              disabled={suggesting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 text-amber-700 text-sm font-medium transition-colors mb-6 animate-fade-in"
            >
              {suggesting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
              {suggesting ? '正在生成策略建议...' : '💡 生成 AI 策略建议'}
            </button>
          )}
          {suggestionStream && !suggestionText && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-800">AI 策略建议</span>
                <span className="text-[10px] text-amber-400 ml-auto">生成中...</span>
              </div>
              <div ref={suggestionRef} className="text-sm text-slate-700 leading-relaxed">
                <StreamingText stream={suggestionStream} onComplete={onSuggestionComplete} />
              </div>
            </div>
          )}
          {suggestionText && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-3"><Lightbulb className="h-4 w-4 text-amber-500" /><span className="text-sm font-semibold text-amber-800">AI 策略建议</span></div>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{suggestionText}</div>
            </div>
          )}
          {savedId && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 animate-fade-in">
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-emerald-600" /><p className="text-sm text-emerald-700">报告已生成并存入草稿箱（ID: {savedId}）</p></div>
            </div>
          )}
          {!hasResults && !processing && !error && !clarification && (
            <div className="text-center py-12"><MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-400">输入问题开始分析</p></div>
          )}
        </div>
        {phase === 'complete' && (
          <div className="px-6 py-4 border-t border-slate-200 shrink-0 space-y-3">
            <button
              onClick={saveReport}
              disabled={!insights.trim() || saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium transition-colors shadow-sm"
            >
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              生成报告并保存
            </button>
            <SimpleInput onSubmit={runQuestion} isProcessing={false} placeholder="继续追问，如「拆分到不同客户层级看看」" />
          </div>
        )}
      </div>
    </>
  )
}

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
      <path d="m21.854 2.147-10.94 10.939" />
    </svg>
  )
}

function formatMetric(value, unit) {
  if (unit === '万元') return value.toFixed(1)
  if (unit === '人' || unit === '个') return value.toLocaleString()
  return String(value)
}

export function CityDrawer({ open, onClose, city, allCities }) {
  const {
    phase,
    progress,
    insightsStream,
    error,
    clarification,
    executeQueryPipeline,
    respondToClarification,
    dismissClarification,
  } = useQueryPipeline()
  const [reply, setReply] = useState('')
  const [insights, setInsights] = useState('')
  const processing = phase !== 'idle' && phase !== 'complete'

  const chartOption = useMemo(() => {
    if (!city || allCities.length === 0) return null
    const avg = (key) => allCities.reduce((s, c) => s + c[key], 0) / allCities.length
    const avgMrr = avg('mrr')
    const avgDau = avg('dau')
    const avgNrr = avg('nrr')
    const avgChurn = avg('churnRate')
    const avgD7 = avg('d7Retention')
    const avgArpu = avg('arpu')
    return {
      tooltip: { trigger: 'axis', backgroundColor: '#ffffff', borderColor: '#e2e8f0', textStyle: { color: '#1e293b', fontSize: 13 } },
      legend: { data: [city.city, '全部城市均值'], textStyle: { color: '#64748b', fontSize: 12 }, top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '14%', containLabel: true },
      xAxis: { type: 'category', data: ['MRR(万)', 'DAU(百人)', 'NRR(%)', '流失率(%)', 'D7留存(%)', 'ARPU(千)'], axisLabel: { color: '#64748b', fontSize: 11 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#64748b', fontSize: 11 } },
      series: [
        {
          name: city.city,
          type: 'bar',
          data: [
            Number((city.mrr / 1e4).toFixed(1)),
            Math.round(city.dau / 100),
            city.nrr,
            city.churnRate,
            city.d7Retention,
            Number((city.arpu / 1e3).toFixed(1)),
          ],
          itemStyle: { color: '#7c3aed', borderRadius: [6, 6, 0, 0] },
          barWidth: '35%',
        },
        {
          name: '全部城市均值',
          type: 'bar',
          data: [
            Number((avgMrr / 1e4).toFixed(1)),
            Math.round(avgDau / 100),
            Number(avgNrr.toFixed(1)),
            Number(avgChurn.toFixed(1)),
            Number(avgD7.toFixed(1)),
            Number((avgArpu / 1e3).toFixed(1)),
          ],
          itemStyle: { color: '#c4b5fd', borderRadius: [6, 6, 0, 0] },
          barWidth: '35%',
        },
      ],
    }
  }, [city, allCities])

  const ask = async (q) => {
    setInsights('')
    await executeQueryPipeline(
      `${city?.city || ''}城市的${q}`,
      `${city?.city}当前MRR ¥${city ? (city.mrr / 1e4).toFixed(1) : 0}万，客户${city?.totalCustomers || 0}个，NRR ${city?.nrr || 0}%，流失率${city?.churnRate || 0}%，DAU ${city?.dau || 0}`,
    )
  }

  const captureInsights = () => {
    const el = document.getElementById('city-chat-stream')
    if (el) setInsights(el.innerText.trim())
  }

  const doReply = async () => {
    if (!reply.trim()) return
    const text = reply
    setReply('')
    await respondToClarification(text)
  }

  if (!open || !city) return null

  const metrics = [
    { key: 'mrr', label: 'MRR', value: Number((city.mrr / 1e4).toFixed(1)), unit: '万元', icon: DollarSign, color: '#7c3aed' },
    { key: 'arr', label: 'ARR', value: Number((city.arr / 1e4).toFixed(0)), unit: '万元', icon: DollarSign, color: '#3b82f6' },
    { key: 'dau', label: 'DAU', value: city.dau, unit: '人', icon: Users, color: '#10b981' },
    { key: 'nrr', label: 'NRR', value: city.nrr, unit: '%', icon: TrendingUp, color: '#f59e0b' },
    { key: 'churnRate', label: '流失率', value: city.churnRate, unit: '%', icon: TrendingDown, color: '#ef4444' },
    { key: 'newCustomers', label: '新增客户', value: city.newCustomers, unit: '个', icon: UserPlus, color: '#22c55e' },
    { key: 'totalCustomers', label: '总客户', value: city.totalCustomers, unit: '个', icon: Users, color: '#6366f1' },
    { key: 'd7Retention', label: 'D7 留存', value: city.d7Retention, unit: '%', icon: Activity, color: '#8b5cf6' },
    { key: 'arpu', label: 'ARPU', value: city.arpu, unit: '元', icon: DollarSign, color: '#14b8a6' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[540px] bg-white shadow-2xl h-full overflow-y-auto animate-slide-in-right flex flex-col">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-500" />
              <h2 className="text-base font-bold text-slate-800">{city.city}</h2>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">城市详情</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span>{city.totalCustomers} 客户</span>
              <span>MRR ¥{(city.mrr / 1e4).toFixed(1)}万</span>
              <span style={{ color: city.nrr > 100 ? '#10b981' : '#ef4444' }}>NRR {city.nrr}%</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X className="h-4 w-4 text-slate-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {metrics.map((m) => (
              <div key={m.key} className="bg-slate-50 rounded-xl border border-slate-100 p-3.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: m.color + '18' }}>
                    <m.icon className="h-3 w-3" style={{ color: m.color }} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{m.label}</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-bold text-slate-900 tabular-nums">{formatMetric(m.value, m.unit)}</span>
                  <span className="text-[10px] text-slate-400">{m.unit}</span>
                </div>
              </div>
            ))}
          </div>
          {chartOption && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">{city.city} vs 全部城市均值</h3>
              <ReactECharts option={chartOption} style={{ height: 260 }} notMerge lazyUpdate />
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-semibold text-slate-700">AI 城市分析</h3>
              <span className="text-[10px] text-slate-400 ml-auto">ChatBI</span>
            </div>
            <div className="px-4 py-4 min-h-[200px] max-h-[400px] overflow-y-auto space-y-3">
              {processing && (
                <div className="flex items-center gap-2 text-slate-400">
                  <LoaderCircle className="h-3.5 w-3.5 text-brand-500 animate-spin" />
                  <span className="text-xs">{progress}</span>
                </div>
              )}
              {error && !clarification && <div className="bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-amber-700 text-xs">{error}</p></div>}
              {clarification && (
                <div className="bg-brand-50 border border-brand-200 rounded-lg p-3">
                  <p className="text-xs text-brand-700 mb-2">{clarification.question}</p>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && doReply()}
                      placeholder="补充说明..."
                      className="flex-1 px-2 py-1.5 rounded border border-brand-200 text-xs focus:outline-none focus:border-brand-500"
                    />
                    <button onClick={doReply} disabled={!reply.trim()} className="px-3 py-1.5 rounded bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white text-xs font-medium transition-colors">回复</button>
                    <button onClick={dismissClarification} className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600">忽略</button>
                  </div>
                </div>
              )}
              {insightsStream && (
                <div className="text-xs text-slate-700 leading-relaxed">
                  <div id="city-chat-stream">
                    <StreamingText stream={insightsStream} onComplete={captureInsights} />
                  </div>
                </div>
              )}
              {insights && phase === 'complete' && <div className="text-xs text-slate-700 leading-relaxed bg-brand-50 rounded-lg p-3 whitespace-pre-wrap">{insights}</div>}
              {!processing && !error && !clarification && !insightsStream && !insights && (
                <div className="text-center py-8">
                  <MessageSquare className="h-6 w-6 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">在下方输入问题</p>
                  <p className="text-xs text-slate-300 mt-1">例如：「{city.city}的客户流失原因是什么？」</p>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-slate-100">
              <SimpleInput onSubmit={ask} isProcessing={processing} placeholder={`问关于${city.city}的任何问题，如「流失率为什么这么高？」`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
