import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { parseQuery, streamInsight } from './llm.js'
import { executeQuery, sparkData } from './query.js'
import { readDrafts, writeDrafts, readLocal, writeLocal } from './store.js'
import { WATCHLIST_METRICS, WATCHLIST_DEFAULTS } from './metrics.js'
import { monthlyFinancial, monthlyProduct } from './data.js'

const STEP_INTERVAL = 400

export function useQueryPipeline() {
  const [phase, setPhase] = useState('idle')
  const [progress, setProgress] = useState('')
  const [steps, setSteps] = useState([])
  const [results, setResults] = useState([])
  const [insightsStream, setInsightsStream] = useState(null)
  const [error, setError] = useState(null)
  const [clarification, setClarification] = useState(null)
  const insightGen = useRef(null)
  const timer = useRef(null)

  function animateSteps(stepList, from) {
    setSteps(stepList)
    let n = from
    const tick = () => {
      if (n <= stepList.length) {
        setSteps((prev) =>
          prev.map((s, i) => (i < n ? { ...s, status: 'done' } : i === n ? { ...s, status: 'active' } : s)),
        )
        n++
        timer.current = window.setTimeout(tick, STEP_INTERVAL)
      }
    }
    tick()
  }

  const executeQueryPipeline = useCallback(async (question, context) => {
    if (timer.current) clearTimeout(timer.current)
    setPhase('recognizing')
    setProgress('正在理解你的问题...')
    setError(null)
    setClarification(null)
    setInsightsStream(null)
    insightGen.current = null
    try {
      animateSteps(
        [
          { id: 'recognize', icon: 'search', label: '识别指标', detail: '', status: 'pending' },
          { id: 'query', icon: 'database', label: '查询数据', detail: '', status: 'pending' },
          { id: 'analyze', icon: 'chart', label: '分析趋势', detail: '', status: 'pending' },
          { id: 'insight', icon: 'sparkles', label: '生成洞察', detail: '', status: 'pending' },
        ],
        0,
      )
      const query = await parseQuery(question, context)
      if (query.confidence != null && query.confidence < 0.7 && query.clarifying_question) {
        setClarification({
          question: query.clarifying_question,
          originalQuery: question,
          intentContext: JSON.stringify({ metrics: query.metrics, dimensions: query.dimensions, timeRange: query.timeRange }),
        })
        setPhase('idle')
        setSteps([])
        return { needsClarification: true, question: query.clarifying_question }
      }
      const metricNames = (query.metrics || []).slice(0, 3).join('、')
      setSteps((prev) => prev.map((s, i) => (i === 0 ? { ...s, status: 'done', detail: metricNames || '已识别' } : s)))
      setPhase('querying')
      setProgress('正在查询数据...')
      setSteps((prev) => prev.map((s, i) => (i === 1 ? { ...s, status: 'active' } : s)))
      const res = executeQuery(query)
      setResults(res)
      let detail = ''
      if (query.timeRange?.start && query.timeRange?.end) detail = `${query.timeRange.start} 至 ${query.timeRange.end}`
      if (res.length > 0) detail += detail ? `，${res.length} 条记录` : `${res.length} 条记录`
      setSteps((prev) => prev.map((s, i) => (i === 1 ? { ...s, status: 'done', detail: detail || '查询完成' } : s)))
      setPhase('generating')
      setProgress('正在生成洞察...')
      setSteps((prev) =>
        prev.map((s, i) => (i === 2 ? { ...s, status: 'done', detail: '环比变化 + 异常检测' } : i === 3 ? { ...s, status: 'active' } : s)),
      )
      const gen = streamInsight(res, question)
      insightGen.current = gen
      setInsightsStream(gen)
      setPhase('complete')
      setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })))
      return { needsClarification: false }
    } catch (e) {
      setError(
        e instanceof Error && e.message?.includes('fetch')
          ? '网络连接失败，请检查网络后重试。'
          : '抱歉，处理你的问题时出现了错误。请稍后重试。',
      )
      setPhase('idle')
      setSteps([])
      return { needsClarification: false }
    }
  }, [])

  const respondToClarification = useCallback(
    async (text) => {
      if (clarification) {
        return executeQueryPipeline(
          `原始问题：${clarification.originalQuery}\n用户补充说明：${text}\n意向上下文：${clarification.intentContext}\n请结合以上信息重新解析用户意图。`,
        )
      }
    },
    [clarification, executeQueryPipeline],
  )

  const dismissClarification = useCallback(() => setClarification(null), [])

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setPhase('idle')
    setSteps([])
    setResults([])
    setInsightsStream(null)
    setError(null)
    setClarification(null)
  }, [])

  return {
    phase,
    progress,
    steps,
    results,
    insightsStream,
    error,
    clarification,
    executeQueryPipeline,
    respondToClarification,
    dismissClarification,
    reset,
  }
}

export function useDrafts(role) {
  const [drafts, setDrafts] = useState(readDrafts)
  const addDraft = useCallback((draft) => {
    setDrafts((prev) => {
      const next = [draft, ...prev]
      writeDrafts(next)
      return next
    })
  }, [])
  const updateDraft = useCallback((id, patch) => {
    setDrafts((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
      writeDrafts(next)
      return next
    })
  }, [])
  const deleteDraft = useCallback((id) => {
    setDrafts((prev) => {
      const next = prev.filter((d) => d.id !== id)
      writeDrafts(next)
      return next
    })
  }, [])
  const clearAll = useCallback(() => {
    setDrafts([])
    localStorage.removeItem('report_drafts')
  }, [])
  return {
    drafts: role ? drafts.filter((d) => d.role === role) : drafts,
    allDrafts: drafts,
    addDraft,
    updateDraft,
    deleteDraft,
    clearAll,
  }
}

function watchlistValue(key, finLast, finPrev, prodLast, prodPrev) {
  const finMap = { mrr: finLast.mrr, churn_rate: finLast.churn_rate, nrr: finLast.nrr, arr: finLast.arr, new_customers: finLast.new_customers }
  const prodMap = { dau: prodLast.dau, d7_retention: prodLast.d7_retention, stickiness: prodLast.stickiness }
  if (key in finMap) {
    const prev = finPrev ? finMap[key] : finMap[key]
    return { value: key === 'mrr' || key === 'arr' ? finMap[key] / 1e4 : finMap[key], prev: (key === 'mrr' || key === 'arr') && finPrev ? prev / 1e4 : prev }
  }
  if (key in prodMap) {
    const prev = prodPrev ? prodMap[key] : prodMap[key]
    return { value: prodMap[key], prev }
  }
  return null
}

export function useWatchlist(activeRole) {
  const fin = useMemo(() => monthlyFinancial(), [])
  const prod = useMemo(() => monthlyProduct(), [])
  const [store, setStore] = useState(() => readLocal('analytics_watchlist') || {})
  const watchedKeys = useMemo(() => store[activeRole] || WATCHLIST_DEFAULTS[activeRole] || ['mrr', 'churn_rate'], [store, activeRole])
  const availableMetrics = useMemo(() => WATCHLIST_METRICS.filter((m) => m.roles.includes(activeRole)), [activeRole])
  const finLast = fin[fin.length - 1]
  const finPrev = fin.length > 1 ? fin[fin.length - 2] : null
  const prodLast = prod[prod.length - 1]
  const prodPrev = prod.length > 1 ? prod[prod.length - 2] : null
  const dailyFin = useMemo(() => monthlyFinancial(), [])
  const dailyProd = useMemo(() => monthlyProduct(), [])

  const watchlistValues = useMemo(
    () =>
      watchedKeys.map((key) => {
        const meta = WATCHLIST_METRICS.find((m) => m.key === key)
        const v = watchlistValue(key, finLast, finPrev, prodLast, prodPrev)
        if (!v)
          return { key, label: meta?.label || key, value: 0, unit: meta?.unit || '', changePercent: 0, prevValue: 0, isAnomaly: false }
        const pct = v.prev === 0 ? 0 : Number((((v.value - v.prev) / v.prev) * 100).toFixed(1))
        const anomaly = (key === 'churn_rate' && v.value > 3.5) || (key === 'nrr' && v.value < 100)
        return { key, label: meta?.label || key, value: Number(v.value.toFixed(1)), unit: meta?.unit || '', changePercent: pct, prevValue: Number(v.prev.toFixed(1)), isAnomaly: anomaly }
      }),
    [watchedKeys, finLast, finPrev, prodLast, prodPrev],
  )

  const updateWatchlist = useCallback(
    (keys) => {
      const sliced = keys.slice(0, 5)
      setStore((prev) => {
        const next = { ...prev, [activeRole]: sliced }
        writeLocal('analytics_watchlist', next)
        return next
      })
    },
    [activeRole],
  )

  const addMetric = useCallback((key) => {
    if (watchedKeys.length >= 5 || watchedKeys.includes(key)) return
    updateWatchlist([...watchedKeys, key])
  }, [watchedKeys, updateWatchlist])

  const removeMetric = useCallback((key) => {
    updateWatchlist(watchedKeys.filter((k) => k !== key))
  }, [watchedKeys, updateWatchlist])

  const resetToDefaults = useCallback(() => {
    updateWatchlist(WATCHLIST_DEFAULTS[activeRole] || ['mrr', 'churn_rate'])
  }, [activeRole, updateWatchlist])

  return { watchedKeys, watchlistValues, availableMetrics, updateWatchlist, addMetric, removeMetric, resetToDefaults, sparkData: (key) => sparkData(key, dailyFin, dailyProd) }
}

export function useChatHistory(key) {
  const [messages, setMessages] = useState(() => {
    if (!key) return []
    try {
      const raw = localStorage.getItem('analytics_chat_' + key)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Date.now() - parsed.savedAt > 180000 ? (localStorage.removeItem('analytics_chat_' + key), []) : parsed.messages
    } catch {
      return []
    }
  })
  const [contextSummary, setContextSummary] = useState('')
  const lastKey = useRef(key)

  useEffect(() => {
    if (lastKey.current !== key) {
      lastKey.current = key
      try {
        const raw = localStorage.getItem('analytics_chat_' + key)
        setMessages(raw ? JSON.parse(raw).messages || [] : [])
      } catch {
        setMessages([])
      }
      setContextSummary('')
    }
  }, [key])

  useEffect(() => {
    if (!key) return
    if (messages.length === 0) localStorage.removeItem('analytics_chat_' + key)
    else localStorage.setItem('analytics_chat_' + key, JSON.stringify({ messages, savedAt: Date.now() }))
  }, [messages, key])

  const addMessage = useCallback((msg) => {
    setMessages((prev) => {
      const next = [...prev, msg]
      setContextSummary(
        next
          .slice(-6)
          .filter((m) => m.role === 'assistant' && m.results)
          .map((m) => `上次查询了 ${m.results?.map((r) => r.metricLabel).join('、')}`)
          .join('；'),
      )
      return next
    })
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setContextSummary('')
    if (key) localStorage.removeItem('analytics_chat_' + key)
  }, [key])

  return { messages, contextSummary, addMessage, clearMessages }
}
