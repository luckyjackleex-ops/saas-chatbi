import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  FileSpreadsheet,
  BookOpen,
  MapPin,
  Inbox,
  ArrowRight,
  ShieldAlert,
  Zap,
  Clock,
  Sparkles,
  FileText,
  DollarSign,
} from 'lucide-react'
import { useAuth } from '../context/index.jsx'
import { monthlySeries, sparkData } from '../lib/query.js'
import { summarySnapshot, dailyFinancial, dailyProduct, weeklyData, cityAnalytics, customerTiers } from '../lib/data.js'
import { detectAnomalies } from '../lib/anomaly.js'
import { useWatchlist } from '../lib/hooks.js'
import { setNotifications } from '../lib/store.js'
import { complete } from '../lib/llm.js'
import { METRIC_ICONS, BENCHMARK, METRIC_DICTIONARY, ACTIVITY_FEED, ACTIVITY_STYLES } from '../lib/metrics.js'
import { sparklineOption } from '../lib/charts.js'
import { CountUp, InView } from '../components/charts.jsx'
import { WorldMap } from '../components/map.jsx'
import { MetricDrawer, CityDrawer, MetricDictionary } from '../components/drawers.jsx'

function pctChange(cur, prev) {
  if (cur == null || prev == null || isNaN(cur) || isNaN(prev) || Number(prev) === 0) return 0
  const c = Number(cur)
  const p = Number(prev)
  return Number((((c - p) / p) * 100).toFixed(1))
}

function formatValue(key, value) {
  if (value == null || isNaN(value)) return '-'
  const num = Number(value)
  if (key === 'mrr' || key === 'arr') return num.toFixed(1)
  if (key === 'dau') return Math.round(num).toLocaleString()
  return String(num)
}

function MetricCard({ data, onAnalyze }) {
  const meta = METRIC_ICONS[data.key] || { icon: DollarSign, color: '#64748b', desc: '' }
  const dict = METRIC_DICTIONARY.find((d) => d.key === data.key)
  const fullName = dict?.fullName || data.label
  const business = dict?.business || meta.desc
  const tip = dict ? `${dict.fullName}\n公式：${dict.formula}\n含义：${dict.business}` : fullName
  const Icon = meta.icon
  const change = pctChange(data.value, data.prev)
  const isChurn = data.key === 'churn_rate'
  const good = isChurn ? data.value < data.prev : data.value > data.prev
  const bad = isChurn ? data.value > data.prev : data.value < data.prev
  const changeColor = good ? 'text-emerald-600' : bad ? 'text-red-500' : 'text-slate-400'
  const ChangeIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  const benchmark = BENCHMARK[data.key]
  const isLarge = data.isLarge ?? false
  const cardSparkData = Array.isArray(data.sparkData) ? data.sparkData : []

  return (
    <div
      className={`bg-white rounded-xl border p-5 shadow-sm b2b-shadow-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in relative group/card ${
        data.isAnomaly ? 'border-red-300 ring-1 ring-red-100 bg-red-50/20' : 'border-slate-200'
      } ${isLarge ? 'col-span-2' : 'col-span-1'}`}
      style={{ animationDelay: `${(data.index ?? 0) * 0.06}s` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: meta.color + '18' }}>
            <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-slate-800 leading-tight">{fullName}</span>
            <span className="ml-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded align-middle">{data.label}</span>
          </div>
        </div>
        {data.isAnomaly && (
          <span className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">异常</span>
          </span>
        )}
      </div>
      {dict && (
        <div className="absolute top-3 right-3 z-20">
          <div className="relative group/tip">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold cursor-help group-hover/tip:bg-slate-300 transition-colors">?</span>
            <div className="absolute right-0 top-full mt-1 w-56 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none leading-relaxed whitespace-pre-wrap opacity-0 group-hover/tip:opacity-100 transition-opacity">{tip}</div>
          </div>
        </div>
      )}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className={`tabular-nums font-bold text-slate-900 ${isLarge ? 'text-3xl' : 'text-2xl'}`}>
          <CountUp value={data.value ?? 0} duration={500} delay={(data.index ?? 0) * 80} format={(v) => formatValue(data.key, v)} />
        </span>
        <span className="text-xs text-slate-400">{data.unit}</span>
        {change !== 0 && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ml-1 ${changeColor}`}>
            <ChangeIcon className="h-3 w-3" />
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-[10px] text-slate-400 mb-1">{data.changeLabel || '日环比'}</p>
      <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{business}</p>
      {benchmark && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded text-[10px]">
          {(() => {
            const val = typeof data.value === 'number' && !isNaN(data.value) ? data.value : 0
            const bmVal = benchmark.value || 1
            const better = benchmark.higherIsBetter ? val > bmVal : val < bmVal
            const diff = benchmark.higherIsBetter ? ((val - bmVal) / bmVal) * 100 : ((bmVal - val) / bmVal) * 100
            return (
              <>
                <span className="text-slate-400">{benchmark.label} {benchmark.value}{data.unit}</span>
                <span className="text-slate-300">·</span>
                <span className={`font-semibold ${better ? 'text-emerald-600' : 'text-amber-600'}`}>{better ? '优于行业基准' : '需关注'}</span>
                <span className="text-slate-400">({diff > 0 ? '+' : ''}{Math.abs(diff).toFixed(0)}%)</span>
              </>
            )
          })()}
        </div>
      )}
      {cardSparkData.length > 0 && (
        <div className={isLarge ? 'h-12 mb-1' : 'h-8 mb-1'}>
          <ReactECharts option={sparklineOption(cardSparkData, meta.color, isLarge ? 48 : 32)} style={{ height: isLarge ? 48 : 32 }} notMerge lazyUpdate />
        </div>
      )}
      <button
        onClick={() => onAnalyze({ key: data.key, label: fullName, value: data.value })}
        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
          data.isAnomaly
            ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:shadow-[0_0_10px_rgba(239,68,68,0.15)]'
            : 'text-brand-600 hover:text-brand-700 hover:shadow-[0_0_12px_rgba(124,58,237,0.3)] hover:bg-brand-50/50'
        }`}
      >
        {data.isAnomaly ? '分析异常 →' : 'AI分析▸'}
      </button>
    </div>
  )
}

function summaryPrompt(snapshot, anomalies) {
  const anomalyText = anomalies.length > 0
    ? anomalies.map((a) => `- ${a.severity === 'red' ? '🔴' : '🟡'} ${a.metricLabel}: ${a.insight}`).join('\n')
    : '今日无异常指标。'
  return `你是一个 SaaS 数据分析助手。基于以下数据，用 3 句话生成今日经营摘要。

数据（日期：${snapshot.date}）：
- MRR: ${(snapshot.financial.mrr.value / 1e4).toFixed(1)} 万元，日环比 ${snapshot.financial.mrr.change >= 0 ? '+' : ''}${snapshot.financial.mrr.change}%
- DAU: ${snapshot.product.dau.value.toLocaleString()} 人
- 客户流失率: ${snapshot.financial.churnRate.value}%
- 今日新增客户: ${snapshot.financial.newCustomers.value} 个
- D7 留存率: ${snapshot.product.d7Retention.value}%
- NRR: ${snapshot.financial.nrr.value}%

异常信息：
${anomalyText}

要求：
1. 第一句总结今日核心经营数据（MRR 和 DAU）
2. 第二句点名异常指标（如有），一句话说清楚问题
3. 第三句给出趋势判断和关注建议
4. 三句话连成一段，自然流畅，不需要编号
5. 仅返回摘要文字，不要其他内容。`
}

function ActivityFeed() {
  const navigate = useNavigate()
  const recent = useMemo(() => {
    try {
      const drafts = JSON.parse(localStorage.getItem('report_drafts') || '[]')
      const mine = drafts.slice(0, 3).map((d) => ({
        id: `draft-${d.id}`,
        type: 'report_generated',
        actor: { name: d.role === 'manager' ? '总经理' : d.role === 'pm' ? '产品经理' : '数据分析师', role: d.role === 'manager' ? '管理者' : d.role === 'pm' ? '产品经理' : '数据分析师', initials: d.role === 'manager' ? '总' : d.role === 'pm' ? '产' : '分' },
        summary: `生成了报告「${d.title}」`,
        reportId: d.id,
        timestamp: d.createdAt,
        relativeTime: d.createdAt,
      }))
      const seen = new Set(mine.map((m) => m.id))
      return [...mine, ...ACTIVITY_FEED.filter((f) => !seen.has(f.id))].slice(0, 5)
    } catch {
      return ACTIVITY_FEED
    }
  }, [])
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm b2b-shadow-card animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">团队动态</h3>
      </div>
      {recent.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">暂无团队动态，开始分析数据后将自动记录</p>
      ) : (
        <div className="space-y-0 relative">
          <div className="absolute left-[17px] top-2 bottom-2 w-px bg-slate-100" />
          {recent.map((a) => {
            const style = ACTIVITY_STYLES[a.type] || ACTIVITY_STYLES.report_generated
            const Icon = style.icon
            return (
              <div key={a.id} className="relative flex gap-3 py-2.5 pl-1">
                <div className={`relative z-10 w-[34px] h-[34px] rounded-full ${style.bg} flex items-center justify-center shrink-0 border-2 border-white`}>
                  <Icon className={`h-3.5 w-3.5 ${style.color}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-500">{a.actor.initials}</span>
                    <span className="text-xs font-medium text-slate-700">{a.actor.name}</span>
                    <span className="text-[10px] text-slate-400">{a.actor.role}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{a.summary}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-400">{a.relativeTime}</span>
                    {a.reportId && <button onClick={() => navigate(`/report/${a.reportId}`)} className="text-[10px] font-medium text-brand-600 hover:text-brand-700 transition-colors">查看报告 →</button>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AiWorkStats({ anomalyCount }) {
  const drafts = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('report_drafts') || '[]').length
    } catch {
      return 0
    }
  }, [])
  const savedHours = Math.round((anomalyCount * 20 + drafts * 30) / 60) || 1
  const items = [
    { icon: ShieldAlert, value: anomalyCount, unit: '个', label: '发现异常', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: FileText, value: drafts, unit: '份', label: '生成报告', color: 'text-brand-600', bg: 'bg-brand-50' },
    { icon: Clock, value: savedHours, unit: '小时', label: '节省时间', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ]
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm b2b-shadow-card p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-3.5 w-3.5 text-brand-500" />
        <h3 className="text-xs font-semibold text-slate-700">AI 本月工作统计</h3>
        <span className="text-[10px] text-slate-400 ml-auto">2026-05</span>
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${it.bg}`}>
              <it.icon className={`h-3.5 w-3.5 ${it.color}`} />
            </div>
            <span className="text-xs text-slate-600 flex-1">{it.label}</span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">{it.value}<span className="text-[10px] font-normal text-slate-400 ml-0.5">{it.unit}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { activeRole } = useAuth()
  const series = useMemo(() => monthlySeries(), [])
  const snapshot = useMemo(() => summarySnapshot(), [])
  const fin = useMemo(() => dailyFinancial(), [])
  const prod = useMemo(() => dailyProduct(), [])
  const weeks = useMemo(() => weeklyData(), [])
  const cities = useMemo(() => cityAnalytics(), [])
  const tiers = useMemo(() => customerTiers(), [])
  const anomalies = useMemo(() => detectAnomalies(fin, prod), [fin, prod])
  const { watchlistValues, sparkData: watchSpark } = useWatchlist(activeRole)

  useEffect(() => {
    setNotifications(anomalies.map((a) => ({
      id: a.id,
      metricLabel: a.metricLabel,
      metricKey: a.metricKey,
      severity: a.severity,
      currentValue: a.currentValue,
      changePercent: a.changePercent,
      insight: a.insight,
      timestamp: a.detectedAt,
    })))
  }, [anomalies])

  const [headline, setHeadline] = useState('')
  useEffect(() => {
    const cacheKey = `analytics_summary_${snapshot.date}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        setHeadline(JSON.parse(cached).headline)
        return
      }
    } catch {}
    const mrrVal = snapshot?.financial?.mrr?.value ?? 0
    const dauVal = snapshot?.product?.dau?.value ?? 0
    const fallback = `昨日 MRR ${(mrrVal / 1e4).toFixed(1)} 万元，DAU ${dauVal.toLocaleString()} 人`
    setHeadline(fallback)
    complete('你是 SaaS 数据分析助手，擅长用简洁中文概括经营数据。', summaryPrompt(snapshot, anomalies), 'deepseek-v4-flash')
      .then((text) => {
        const h = text.trim()
        setHeadline(h)
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ headline: h }))
        } catch {}
      })
      .catch(() => {})
  }, [snapshot, anomalies])

  const [view, setView] = useState('summary')
  const [granularity, setGranularity] = useState('day')
  const [selectedCity, setSelectedCity] = useState('上海')
  const [dictOpen, setDictOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [cityDetail, setCityDetail] = useState(null)
  const [metricOpen, setMetricOpen] = useState(false)
  const [metricTarget, setMetricTarget] = useState(null)

  const selectedCityData = useMemo(() => cities.find((c) => c.city === selectedCity) || cities.find((c) => c.city === '上海'), [cities, selectedCity])

  const roleTitle = activeRole === 'manager' ? '经营核心指标' : activeRole === 'pm' ? '产品核心指标' : '分析核心指标'
  const roleBadge = activeRole === 'manager' ? '管理者' : activeRole === 'pm' ? '产品经理' : '数据分析师'

  const timeData = useMemo(() => {
    const finLast = fin[fin.length - 1]
    const finPrev8 = fin[fin.length - 8]
    const prodLast = prod[prod.length - 1]
    const prodPrev2 = prod[prod.length - 2]
    const prodPrev8 = prod[prod.length - 8]
    const weekLast = weeks[weeks.length - 1]
    const weekPrev = weeks[weeks.length - 2]
    const recentFin = fin.slice(-7)
    const recentWeeks = weeks.slice(-4)
    if (granularity === 'week' && weekLast && weekPrev) {
      return {
        mrrValue: Number((weekLast.mrr / 1e4).toFixed(1)),
        mrrPrev: Number((weekPrev.mrr / 1e4).toFixed(1)),
        dauValue: weekLast.dau,
        dauPrev: weekPrev.dau,
        nrrValue: weekLast.nrr,
        nrrPrev: weekPrev.nrr,
        churnValue: weekLast.churnRate,
        churnPrev: weekPrev.churnRate,
        newCustValue: weekLast.newCustomers,
        newCustPrev: weekPrev.newCustomers,
        d7Value: weekLast.d7Retention,
        d7Prev: weekPrev.d7Retention,
        sparkMRR: recentWeeks.map((w) => Number((w.mrr / 1e4).toFixed(1))),
        sparkDAU: recentWeeks.map((w) => w.dau),
        sparkNRR: recentWeeks.map((w) => w.nrr),
        sparkChurn: recentWeeks.map((w) => w.churnRate),
        sparkNewCust: recentWeeks.map((w) => w.newCustomers),
        sparklineWindow: recentWeeks.map((w) => w.week),
      }
    }
    if (granularity === 'month') {
      const last6 = series.slice(-6)
      return {
        mrrValue: last6[last6.length - 1]?.mrr || 0,
        mrrPrev: last6[last6.length - 2]?.mrr || 0,
        dauValue: prodLast.dau,
        dauPrev: prodPrev2.dau,
        nrrValue: last6[last6.length - 1]?.nrr || 0,
        nrrPrev: last6[last6.length - 2]?.nrr || 0,
        churnValue: last6[last6.length - 1]?.churn || 0,
        churnPrev: last6[last6.length - 2]?.churn || 0,
        newCustValue: last6[last6.length - 1]?.newCustomers || 0,
        newCustPrev: last6[last6.length - 2]?.newCustomers || 0,
        d7Value: prodLast.d7_retention,
        d7Prev: prodPrev2.d7_retention,
        sparkMRR: last6.map((m) => m.mrr),
        sparkDAU: last6.map(() => prodLast.dau),
        sparkNRR: last6.map((m) => m.nrr),
        sparkChurn: last6.map((m) => m.churn),
        sparkNewCust: last6.map((m) => m.newCustomers),
        sparklineWindow: last6.map((m) => m.month.substring(5)),
      }
    }
    return {
      mrrValue: Number((finLast.mrr / 1e4).toFixed(1)),
      mrrPrev: Number((finPrev8.mrr / 1e4).toFixed(1)),
      dauValue: prodLast.dau,
      dauPrev: prodPrev8?.dau ?? prodPrev2.dau,
      nrrValue: finLast.nrr,
      nrrPrev: finPrev8.nrr,
      churnValue: finLast.churn_rate,
      churnPrev: finPrev8.churn_rate,
      newCustValue: finLast.new_customers,
      newCustPrev: finPrev8.new_customers,
      d7Value: prodLast.d7_retention,
      d7Prev: prodPrev8?.d7_retention ?? prodPrev2.d7_retention,
      sparkMRR: recentFin.map((d) => Number((d.mrr / 1e4).toFixed(1))),
      sparkDAU: recentFin.map(() => prodLast.dau),
      sparkNRR: recentFin.map((d) => d.nrr),
      sparkChurn: recentFin.map((d) => d.churn_rate),
      sparkNewCust: recentFin.map((d) => d.new_customers),
      sparklineWindow: recentFin.map((d) => d.date.substring(5)),
    }
  }, [granularity, fin, prod, weeks, series])

  const changeLabel = granularity === 'day' ? '周同比' : granularity === 'week' ? '周环比' : '月环比'

  const mrrNrrOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      textStyle: { color: '#1e293b', fontSize: 13 },
      axisPointer: { type: 'cross', crossStyle: { color: '#94a3b8' }, label: { backgroundColor: '#475569', color: '#ffffff' } },
    },
    legend: { data: ['MRR', 'NRR'], textStyle: { color: '#64748b', fontSize: 12 }, top: 0 },
    toolbox: { right: 10, top: -2, feature: { saveAsImage: { title: '保存为图片', pixelRatio: 2 }, dataView: { title: '数据视图', readOnly: true, lang: ['数据视图', '关闭', '刷新'] } }, iconStyle: { borderColor: '#94a3b8' } },
    grid: { left: '3%', right: '5%', bottom: '12%', top: '14%', containLabel: true },
    dataZoom: [
      { type: 'slider', bottom: 0, height: 20, borderColor: '#e2e8f0', fillerColor: 'rgba(124, 58, 237, 0.08)', handleStyle: { color: '#7c3aed', borderColor: '#7c3aed' }, textStyle: { color: '#94a3b8', fontSize: 10 } },
      { type: 'inside' },
    ],
    xAxis: { type: 'category', data: series.map((m) => m.month.substring(5)), axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#64748b', fontSize: 11 } },
    yAxis: [
      { type: 'value', name: '万元', nameTextStyle: { color: '#94a3b8', fontSize: 11 }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#64748b', fontSize: 11 } },
      { type: 'value', name: '%', min: 90, nameTextStyle: { color: '#94a3b8', fontSize: 11 }, splitLine: { show: false }, axisLabel: { color: '#64748b', fontSize: 11 } },
    ],
    series: [
      {
        name: 'MRR',
        type: 'line',
        data: series.map((m) => m.mrr),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        emphasis: { focus: 'series' },
        lineStyle: { width: 2.5, color: '#7c3aed' },
        itemStyle: { color: '#7c3aed' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(124, 58, 237, 0.12)' }, { offset: 1, color: 'rgba(124, 58, 237, 0.01)' }] } },
        markLine: { silent: true, data: [{ type: 'average', name: '均值' }], lineStyle: { color: '#c4b5fd', type: 'dashed' } },
      },
      {
        name: 'NRR',
        type: 'line',
        yAxisIndex: 1,
        data: series.map((m) => m.nrr),
        smooth: true,
        symbol: 'diamond',
        symbolSize: 4,
        emphasis: { focus: 'series' },
        lineStyle: { width: 2, color: '#f59e0b' },
        itemStyle: { color: '#f59e0b' },
      },
    ],
  }), [series])

  const customersOption = useMemo(() => ({
    tooltip: { trigger: 'axis', backgroundColor: '#ffffff', borderColor: '#e2e8f0', textStyle: { color: '#1e293b', fontSize: 13 }, axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(148, 163, 184, 0.06)' } } },
    legend: { data: ['新增客户', '扩展 MRR'], textStyle: { color: '#64748b', fontSize: 12 }, top: 0 },
    toolbox: { right: 10, top: -2, feature: { saveAsImage: { title: '保存为图片', pixelRatio: 2 }, dataView: { title: '数据视图', readOnly: true, lang: ['数据视图', '关闭', '刷新'] } }, iconStyle: { borderColor: '#94a3b8' } },
    grid: { left: '3%', right: '5%', bottom: '12%', top: '14%', containLabel: true },
    dataZoom: [
      { type: 'slider', bottom: 0, height: 20, borderColor: '#e2e8f0', fillerColor: 'rgba(124, 58, 237, 0.08)', handleStyle: { color: '#7c3aed', borderColor: '#7c3aed' }, textStyle: { color: '#94a3b8', fontSize: 10 } },
      { type: 'inside' },
    ],
    xAxis: { type: 'category', data: series.map((m) => m.month.substring(5)), axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#64748b', fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#64748b', fontSize: 11 } },
    series: [
      { name: '新增客户', type: 'bar', data: series.map((m) => m.newCustomers), emphasis: { focus: 'series' }, itemStyle: { color: '#7c3aed', borderRadius: [4, 4, 0, 0] }, barWidth: '40%' },
      { name: '扩展 MRR', type: 'bar', data: series.map((m) => m.expansionMRR), emphasis: { focus: 'series' }, itemStyle: { color: '#a78bfa', borderRadius: [4, 4, 0, 0] }, barWidth: '40%' },
    ],
  }), [series])

  const openAnalyze = (target) => {
    setMetricTarget(target)
    setMetricOpen(true)
  }

  const timeCards = [
    { key: 'mrr', label: 'MRR', value: timeData.mrrValue, unit: '万元', prev: timeData.mrrPrev, sparkData: timeData.sparkMRR, color: '#7c3aed', isLarge: true, index: 0, changeLabel },
    { key: 'dau', label: 'DAU', value: timeData.dauValue, unit: '人', prev: timeData.dauPrev, sparkData: timeData.sparkDAU, color: '#3b82f6', index: 1, changeLabel },
    { key: 'nrr', label: 'NRR', value: timeData.nrrValue, unit: '%', prev: timeData.nrrPrev, sparkData: timeData.sparkNRR, color: '#10b981', index: 2, changeLabel },
    { key: 'churn_rate', label: '流失率', value: timeData.churnValue, unit: '%', prev: timeData.churnPrev, sparkData: timeData.sparkChurn, color: '#ef4444', index: 3, isAnomaly: timeData.churnValue > 3.5, changeLabel },
    { key: 'new_customers', label: '新增客户', value: timeData.newCustValue, unit: '个', prev: timeData.newCustPrev, sparkData: timeData.sparkNewCust, color: '#f59e0b', index: 4, changeLabel },
    { key: 'd7_retention', label: 'D7 留存', value: timeData.d7Value, unit: '%', prev: timeData.d7Prev, sparkData: Array.from({ length: 7 }, () => timeData.d7Value + (Math.random() - 0.5) * 2), color: '#10b981', index: 5, changeLabel },
  ]

  const regionCards = [
    { key: 'mrr', label: 'MRR', value: Number((selectedCityData.mrr / 1e4).toFixed(1)), unit: '万元', prev: Number((selectedCityData.mrr / 1e4).toFixed(1)) * 0.98, sparkData: [selectedCityData.mrr * 0.95, selectedCityData.mrr * 0.96, selectedCityData.mrr * 0.97, selectedCityData.mrr * 0.98, selectedCityData.mrr * 0.99, selectedCityData.mrr * 0.995, selectedCityData.mrr].map((v) => Number((v / 1e4).toFixed(1))), color: '#7c3aed', isLarge: true, index: 0 },
    { key: 'dau', label: 'DAU', value: selectedCityData.dau, unit: '人', prev: Math.round(selectedCityData.dau * 0.97), sparkData: Array.from({ length: 7 }, (_, i) => Math.round(selectedCityData.dau * (0.94 + i * 0.01))), color: '#3b82f6', index: 1 },
    { key: 'nrr', label: 'NRR', value: selectedCityData.nrr, unit: '%', prev: Number((selectedCityData.nrr - 1.5).toFixed(1)), sparkData: Array.from({ length: 7 }, () => selectedCityData.nrr + (Math.random() - 0.5) * 3), color: '#10b981', index: 2 },
    { key: 'churn_rate', label: '流失率', value: selectedCityData.churnRate, unit: '%', prev: Number((selectedCityData.churnRate + 0.3).toFixed(1)), sparkData: Array.from({ length: 7 }, () => selectedCityData.churnRate + (Math.random() - 0.5) * 0.5), color: '#ef4444', index: 3, isAnomaly: selectedCityData.churnRate > 3.5 },
    { key: 'new_customers', label: '新增客户', value: selectedCityData.newCustomers, unit: '个', prev: Math.max(0, selectedCityData.newCustomers - 1), sparkData: Array.from({ length: 7 }, () => Math.max(0, selectedCityData.newCustomers + Math.floor((Math.random() - 0.5) * 3))), color: '#f59e0b', index: 4 },
    { key: 'd7_retention', label: 'D7 留存', value: selectedCityData.d7Retention, unit: '%', prev: Number((selectedCityData.d7Retention - 1.2).toFixed(1)), sparkData: Array.from({ length: 7 }, () => selectedCityData.d7Retention + (Math.random() - 0.5) * 2), color: '#10b981', index: 5 },
  ]

  const summaryCards = (watchlistValues || []).map((w, i) => ({
    key: w.key,
    label: w.label,
    value: w.value ?? 0,
    unit: w.unit ?? '',
    prev: w.prevValue ?? 0,
    sparkData: typeof watchSpark === 'function' ? (watchSpark(w.key) || []) : [],
    color: (METRIC_ICONS[w.key] || {}).color || '#64748b',
    isLarge: i === 0,
    index: i,
    isAnomaly: Boolean(w.isAnomaly),
  }))

  return (
    <div className="flex gap-6 px-6 py-6 items-start">
      <div className="flex-1 min-w-0 space-y-6">
        <section data-demo-target="hero-section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{roleTitle}</h2>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{roleBadge}</span>
              </div>
              <div data-demo-target="dimension-switcher" className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
                {[{ key: 'summary', label: '汇总' }, { key: 'region', label: '地区' }, { key: 'tier', label: '客户分层' }, { key: 'time', label: '时间' }].map((v) => (
                  <button key={v.key} onClick={() => setView(v.key)} className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${view === v.key ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{v.label}</button>
                ))}
              </div>
              {view === 'time' && (
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
                  {[{ key: 'day', label: '日' }, { key: 'week', label: '周' }, { key: 'month', label: '月' }].map((v) => (
                    <button key={v.key} onClick={() => setGranularity(v.key)} className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${granularity === v.key ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{v.label}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setDictOpen(true)} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-brand-600 transition-colors">
                <BookOpen className="h-3 w-3" /> 统一口径
              </button>
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                <button className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-slate-400 hover:text-emerald-600 hover:bg-white transition-all" title="导出 CSV"><Download className="h-3 w-3" />CSV</button>
                <button className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-slate-400 hover:text-emerald-600 hover:bg-white transition-all" title="导出 Excel"><FileSpreadsheet className="h-3 w-3" />Excel</button>
              </div>
              <span className="text-[10px] text-slate-400">切换角色自动更新</span>
            </div>
          </div>

          {view === 'summary' && (
            <div data-demo-target="anomaly-card-area" className="grid grid-cols-3 gap-4">
              {summaryCards.map((c) => <MetricCard key={c.key} data={c} onAnalyze={openAnalyze} />)}
            </div>
          )}

          {view === 'region' && (
            <>
              <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
                {cities.map((c) => (
                  <button key={c.city} onClick={() => setSelectedCity(c.city)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCity === c.city ? 'bg-brand-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'}`}>
                    <MapPin className="h-3 w-3 inline mr-1" />{c.city}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {regionCards.map((c) => <MetricCard key={c.key} data={c} onAnalyze={openAnalyze} />)}
              </div>
            </>
          )}

          {view === 'tier' && (
            <div className="grid grid-cols-3 gap-4">
              {tiers.map((t, i) => (
                <div key={t.tierKey} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm b2b-shadow-card hover:shadow-md transition-shadow animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                    <div>
                      <span className="text-sm font-semibold text-slate-800">{t.tierName}</span>
                      <p className="text-[10px] text-slate-400">{t.description}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline"><span className="text-[10px] text-slate-400">MRR</span><span className="text-lg font-bold text-slate-900 tabular-nums">¥{(t.mrr / 1e4).toFixed(1)}<span className="text-xs font-normal text-slate-400">万</span></span></div>
                    <div className="flex justify-between items-baseline"><span className="text-[10px] text-slate-400">客户数</span><span className="text-base font-semibold text-slate-800 tabular-nums">{t.customers}<span className="text-xs font-normal text-slate-400">户</span></span></div>
                    <div className="flex justify-between items-baseline"><span className="text-[10px] text-slate-400">NRR</span><span className="text-base font-semibold tabular-nums" style={{ color: t.nrr > 100 ? '#10b981' : '#ef4444' }}>{t.nrr}%</span></div>
                    <div className="flex justify-between items-baseline"><span className="text-[10px] text-slate-400">流失率</span><span className="text-sm font-semibold tabular-nums" style={{ color: t.churnRate > 3.5 ? '#ef4444' : '#64748b' }}>{t.churnRate}%</span></div>
                    <div className="flex justify-between items-baseline"><span className="text-[10px] text-slate-400">DAU</span><span className="text-sm font-semibold text-slate-700 tabular-nums">{t.dau.toLocaleString()}</span></div>
                    <div className="flex justify-between items-baseline"><span className="text-[10px] text-slate-400">D7 留存</span><span className="text-sm font-semibold tabular-nums" style={{ color: t.d7Retention > 45 ? '#10b981' : '#f59e0b' }}>{t.d7Retention}%</span></div>
                    <div className="flex justify-between items-baseline"><span className="text-[10px] text-slate-400">ARPU</span><span className="text-sm font-semibold text-slate-700 tabular-nums">¥{t.arpu.toLocaleString()}</span></div>
                    <div className="flex justify-between items-baseline"><span className="text-[10px] text-slate-400">扩展 MRR</span><span className="text-sm font-semibold text-slate-700 tabular-nums">¥{(t.expansionMRR / 1e4).toFixed(1)}万</span></div>
                  </div>
                  <button onClick={() => openAnalyze({ key: `tier-${t.tierKey}`, label: t.tierName, value: `MRR ¥${(t.mrr / 1e4).toFixed(1)}万` })} className="mt-4 w-full text-center text-xs font-medium text-brand-600 hover:text-brand-700 hover:shadow-[0_0_12px_rgba(124,58,237,0.3)] hover:bg-brand-50/50 px-2.5 py-1.5 rounded-lg transition-all duration-200">AI分析▸</button>
                </div>
              ))}
            </div>
          )}

          {view === 'time' && (
            <div className="grid grid-cols-3 gap-4">
              {timeCards.map((c) => <MetricCard key={c.key} data={c} onAnalyze={openAnalyze} />)}
            </div>
          )}
        </section>

        {view !== 'summary' && (
          <section>
            {view === 'region' && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm b2b-shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700">地区对比 · 核心指标一览<span className="text-[10px] text-slate-400 font-normal ml-2">点击上方城市查看详情</span></h3>
                </div>
                <div className="space-y-3">
                  {cities.map((c) => (
                    <div key={c.city} className="flex items-center gap-4">
                      <button onClick={() => setSelectedCity(c.city)} className={`text-xs w-14 text-right shrink-0 transition-colors ${selectedCity === c.city ? 'text-brand-600 font-semibold' : 'text-slate-600 hover:text-brand-500'}`}>{c.city}</button>
                      <div className="flex-1 flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden relative">
                          <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500" style={{ width: `${(c.mrr / cities[0].mrr) * 100}%` }} />
                          <span className="absolute inset-0 flex items-center px-3 text-[10px] text-slate-700 font-medium">¥{(c.mrr / 1e4).toFixed(1)}万</span>
                        </div>
                        <span className="text-[10px] text-slate-400 w-16 text-right shrink-0">{c.totalCustomers}客户</span>
                        <span className="text-[10px] text-slate-400 w-16 text-right shrink-0">DAU {c.dau.toLocaleString()}</span>
                        <span className="text-[10px] font-medium w-12 text-right shrink-0" style={{ color: c.nrr > 105 ? '#7c3aed' : c.nrr >= 100 ? '#10b981' : '#ef4444' }}>NRR {c.nrr}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {view === 'tier' && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm b2b-shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700">客户分层对比 · 指标雷达<span className="text-[10px] text-slate-400 font-normal ml-2">企业版 / 中端版 / 小微企业</span></h3>
                </div>
                <ReactECharts
                  option={{
                    tooltip: { trigger: 'axis', backgroundColor: '#ffffff', borderColor: '#e2e8f0', textStyle: { color: '#1e293b', fontSize: 13 } },
                    legend: { data: tiers.map((t) => t.tierName), textStyle: { color: '#64748b', fontSize: 12 }, top: 0 },
                    grid: { left: '3%', right: '4%', bottom: '3%', top: '14%', containLabel: true },
                    xAxis: { type: 'category', data: ['MRR(万)', '客户数', 'NRR(%)', '流失率(%)', 'D7留存(%)', 'ARPU(千)'], axisLabel: { color: '#64748b', fontSize: 11 } },
                    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#64748b', fontSize: 11 } },
                    series: tiers.map((t) => ({ name: t.tierName, type: 'bar', data: [Number((t.mrr / 1e4).toFixed(1)), t.customers, t.nrr, t.churnRate, t.d7Retention, Number((t.arpu / 1e3).toFixed(1))], itemStyle: { color: t.color, borderRadius: [4, 4, 0, 0] }, barWidth: '25%' })),
                  }}
                  style={{ height: 300 }}
                  notMerge
                  lazyUpdate
                />
              </div>
            )}
            {view === 'time' && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm b2b-shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700">{granularity === 'day' ? '近 7 日' : granularity === 'week' ? '近 4 周' : '近 6 月'}趋势</h3>
                </div>
                <ReactECharts
                  option={{
                    tooltip: { trigger: 'axis', backgroundColor: '#ffffff', borderColor: '#e2e8f0', textStyle: { color: '#1e293b', fontSize: 13 } },
                    legend: { data: ['MRR', '新增客户'], textStyle: { color: '#64748b', fontSize: 12 }, top: 0 },
                    grid: { left: '3%', right: '5%', bottom: '12%', top: '14%', containLabel: true },
                    dataZoom: [{ type: 'slider', bottom: 0, height: 20, borderColor: '#e2e8f0', fillerColor: 'rgba(124, 58, 237, 0.08)', handleStyle: { color: '#7c3aed', borderColor: '#7c3aed' }, textStyle: { color: '#94a3b8', fontSize: 10 } }, { type: 'inside' }],
                    xAxis: { type: 'category', data: granularity === 'day' ? fin.slice(-7).map((d) => d.date.substring(5)) : granularity === 'week' ? weeks.slice(-4).map((w) => w.week) : series.slice(-6).map((m) => m.month.substring(5)), axisLabel: { color: '#64748b', fontSize: 11 } },
                    yAxis: [
                      { type: 'value', name: '万元', nameTextStyle: { color: '#94a3b8', fontSize: 11 }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#64748b', fontSize: 11 } },
                      { type: 'value', name: '个', nameTextStyle: { color: '#94a3b8', fontSize: 11 }, splitLine: { show: false }, axisLabel: { color: '#64748b', fontSize: 11 } },
                    ],
                    series: [
                      { name: 'MRR', type: 'bar', data: granularity === 'day' ? fin.slice(-7).map((d) => Number((d.mrr / 1e4).toFixed(1))) : granularity === 'week' ? weeks.slice(-4).map((w) => Number((w.mrr / 1e4).toFixed(1))) : series.slice(-6).map((m) => m.mrr), emphasis: { focus: 'series' }, itemStyle: { color: '#7c3aed', borderRadius: [6, 6, 0, 0] }, barWidth: '40%' },
                      { name: '新增客户', type: 'line', yAxisIndex: 1, data: granularity === 'day' ? fin.slice(-7).map((d) => d.new_customers) : granularity === 'week' ? weeks.slice(-4).map((w) => w.newCustomers) : series.slice(-6).map((m) => m.newCustomers), emphasis: { focus: 'series' }, smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2.5, color: '#10b981' }, itemStyle: { color: '#10b981' } },
                    ],
                  }}
                  style={{ height: 280 }}
                  notMerge
                  lazyUpdate
                />
              </div>
            )}
          </section>
        )}

        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InView delay={0}>
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm b2b-shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700">MRR & NRR 趋势（近12个月）</h3>
                  <div className="flex items-center gap-1">
                    <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="导出 CSV"><Download className="h-3 w-3" />CSV</button>
                    <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="导出 Excel"><FileSpreadsheet className="h-3 w-3" />Excel</button>
                  </div>
                </div>
                <ReactECharts option={mrrNrrOption} style={{ height: 300 }} />
              </div>
            </InView>
            <InView delay={100}>
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm b2b-shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700">新增客户 & 扩展 MRR</h3>
                  <div className="flex items-center gap-1">
                    <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="导出 CSV"><Download className="h-3 w-3" />CSV</button>
                    <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="导出 Excel"><FileSpreadsheet className="h-3 w-3" />Excel</button>
                  </div>
                </div>
                <ReactECharts option={customersOption} style={{ height: 300 }} />
              </div>
            </InView>
          </div>
        </section>

        <button data-demo-target="drafts-link" onClick={() => navigate('/drafts')} className="w-full bg-white border-2 border-dashed border-brand-300 rounded-xl p-4 hover:border-brand-500 hover:bg-brand-50/30 transition-all group shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center"><Inbox className="h-4 w-4 text-brand-600" /></div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-slate-900">报告草稿箱</h3>
                <p className="text-xs text-slate-500">查看和管理所有已生成的报告草稿</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-brand-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </button>
        <div className="flex gap-4 text-xs pb-4">
          <button onClick={() => navigate('/drafts')} className="text-slate-400 hover:text-slate-600 transition-colors">报告草稿箱 →</button>
          <button onClick={() => navigate('/data-management')} className="text-slate-400 hover:text-slate-600 transition-colors">数据管理 →</button>
          <button onClick={() => navigate('/semantic-layer')} className="text-slate-400 hover:text-slate-600 transition-colors">语义层管理 →</button>
          <button onClick={() => navigate('/help')} className="text-slate-400 hover:text-slate-600 transition-colors">帮助中心 →</button>
        </div>
      </div>

      <div className="w-[360px] shrink-0 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm b2b-shadow-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-700">异常警报</h3>
            <span className={`text-xs font-bold ml-auto px-2 py-0.5 rounded-full ${anomalies.length > 0 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'}`}>{anomalies.length > 0 ? `${anomalies.length} 项` : '✓ 正常'}</span>
          </div>
          {anomalies.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {anomalies.slice(0, 5).map((a) => (
                <div key={a.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.severity === 'red' ? 'bg-red-500' : 'bg-amber-400'}`} />
                        <span className="text-xs font-semibold text-slate-800 truncate">{a.metricLabel}</span>
                      </div>
                      <p className={`text-sm font-bold tabular-nums ${a.severity === 'red' ? 'text-red-600' : 'text-amber-600'}`}>
                        {a.metricKey.includes('churn') || a.metricKey.includes('nrr') || a.metricKey.includes('retention') ? `${a.currentValue}%` : a.currentValue >= 1e3 ? a.currentValue.toLocaleString() : a.currentValue}
                        <span className="text-[10px] font-normal ml-1">({a.changePercent > 0 ? '+' : ''}{a.changePercent}%)</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{a.insight}</p>
                    </div>
                    <button onClick={() => openAnalyze({ key: a.metricKey, label: a.metricLabel, value: a.currentValue })} className="text-[10px] font-medium text-brand-600 hover:text-brand-700 hover:shadow-[0_0_10px_rgba(124,58,237,0.25)] hover:bg-brand-50/50 px-2 py-1 rounded-md transition-all duration-200">AI分析 →</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-center"><p className="text-xs text-slate-400">当前所有指标正常，无异常警报</p></div>
          )}
        </div>

        <div className="bg-gradient-to-br from-brand-50 to-blue-50 border border-brand-100 rounded-xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3.5 w-3.5 text-brand-500" />
            <h3 className="text-xs font-semibold text-brand-800">今日经营摘要</h3>
            <span className="text-[10px] text-brand-400 ml-auto">{snapshot.date}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{headline || `昨日 MRR ${(((snapshot?.financial?.mrr?.value ?? 0) / 1e4)).toFixed(1)} 万元，DAU ${(snapshot?.product?.dau?.value ?? 0).toLocaleString()} 人`}</p>
        </div>

        <AiWorkStats anomalyCount={anomalies.length} />

        <InView delay={200}>
          <div data-demo-target="world-map-card" className="bg-white rounded-xl border border-slate-200 shadow-sm b2b-shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">客户分布 · 全球<span className="text-[10px] text-slate-400 font-normal ml-2">点击城市查看详情</span></h3>
            </div>
            <div className="p-2">
              <WorldMap height={280} onCityClick={(c) => { const found = cities.find((x) => x.city === c.name); if (found) { setCityDetail(found); setCityOpen(true) } }} />
            </div>
          </div>
        </InView>

        <ActivityFeed />
      </div>

      <MetricDrawer open={metricOpen} onClose={() => setMetricOpen(false)} metric={metricTarget} />
      <CityDrawer open={cityOpen} onClose={() => setCityOpen(false)} city={cityDetail} allCities={cities} />
      <MetricDictionary open={dictOpen} onClose={() => setDictOpen(false)} />
    </div>
  )
}
