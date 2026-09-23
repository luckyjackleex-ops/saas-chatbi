import { useEffect, useRef, useState, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import { Check, Search, Database, ChartColumn, Sparkles, LoaderCircle } from 'lucide-react'
import { singleChart, mergedChart, mergeResults, inferChartType } from '../lib/charts.js'
import { mapCities, nrrColor, nrrLabel } from '../lib/data.js'

function easeOutCubic(x) {
  return x * (2 - x)
}

function roundTo(value, target) {
  if (typeof target !== 'number' || isNaN(target) || target <= 0) return 0
  if (target % 1 === 0) return Math.round(value)
  const digits = String(target).split('.')[1]?.length ?? 0
  const m = 10 ** digits
  return Math.round(value * m) / m
}

function useCountUp(target, duration = 500, delay = 0, enabled = true) {
  const safeTarget = typeof target === 'number' && !isNaN(target) ? target : 0
  const [val, setVal] = useState(0)
  const raf = useRef(0)
  const timeout = useRef(0)
  const prevTarget = useRef(safeTarget)
  const prevEnabled = useRef(enabled)
  useEffect(() => {
    const changed = safeTarget !== prevTarget.current
    const wasDisabled = !prevEnabled.current && enabled
    prevTarget.current = safeTarget
    prevEnabled.current = enabled
    if (!enabled) {
      setVal(safeTarget)
      return
    }
    if (!changed && !wasDisabled) return
    cancelAnimationFrame(raf.current)
    clearTimeout(timeout.current)
    const start = () => {
      let startTime = null
      const frame = (ts) => {
        if (startTime === null) startTime = ts
        const p = Math.min((ts - startTime) / duration, 1)
        setVal(safeTarget * easeOutCubic(p))
        if (p < 1) raf.current = requestAnimationFrame(frame)
        else setVal(safeTarget)
      }
      raf.current = requestAnimationFrame(frame)
    }
    if (delay > 0) timeout.current = window.setTimeout(start, delay)
    else start()
    return () => {
      cancelAnimationFrame(raf.current)
      clearTimeout(timeout.current)
    }
  }, [safeTarget, duration, delay, enabled])
  return roundTo(Math.min(val, safeTarget), safeTarget)
}

export function CountUp({ value, duration = 500, delay = 0, enabled = true, format }) {
  const numVal = typeof value === 'number' && !isNaN(value) ? value : 0
  const v = useCountUp(numVal, duration, delay, enabled)
  return <>{format ? format(v) : String(v)}</>
}

export function InView({ children, delay = 0, once = true }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.unobserve(el)
        } else if (!once) setInView(false)
      },
      { threshold: 0.15, rootMargin: '0px 0px -20px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [once])
  return (
    <div ref={ref} className={`animate-chart-enter ${inView ? 'in-view' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

export function StreamingText({ stream, onComplete }) {
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const buffer = useRef('')
  const shown = useRef(0)
  const finished = useRef(false)
  const stopped = useRef(false)
  const cb = useRef(onComplete)
  useEffect(() => {
    cb.current = onComplete
  }, [onComplete])
  useEffect(() => {
    buffer.current = ''
    shown.current = 0
    finished.current = false
    stopped.current = false
    setText('')
    setDone(false)
    let timer = 0
    const tick = () => {
      if (stopped.current) return
      const full = buffer.current
      const i = shown.current
      if (i < full.length) {
        const remaining = full.length - i
        shown.current = Math.min(i + (remaining > 50 ? 4 : remaining > 20 ? 2 : 1), full.length)
        setText(full.slice(0, shown.current))
      }
      if (finished.current && shown.current >= buffer.current.length) {
        setDone(true)
        cb.current?.()
      } else {
        timer = window.setTimeout(tick, 28)
      }
    }
    timer = window.setTimeout(tick, 28)
    ;(async () => {
      try {
        for await (const chunk of stream) {
          if (stopped.current) break
          buffer.current += chunk
        }
      } catch {
        if (!stopped.current) buffer.current += '\n[流式传输中断，请重试]'
      } finally {
        finished.current = true
      }
    })()
    return () => {
      stopped.current = true
      clearTimeout(timer)
    }
  }, [stream])
  const lines = text.split('\n').filter((l) => l.length > 0)
  return (
    <div className="max-w-none">
      {lines.map((l, i) => (
        <p key={i} className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
          {l}
          {!done && i === lines.length - 1 && <span className="inline-block w-px h-[1em] bg-brand-500 animate-pulse ml-px align-[-1px]" />}
        </p>
      ))}
      {!done && lines.length === 0 && <span className="inline-block w-px h-[1em] bg-brand-500 animate-pulse align-[-1px]" />}
    </div>
  )
}

const STEP_ICONS = { search: Search, database: Database, chart: ChartColumn, sparkles: Sparkles }

export function StepList({ steps }) {
  if (steps.length === 0) return null
  return (
    <div className="space-y-2 py-2">
      {steps.map((s, i) => {
        const Icon = STEP_ICONS[s.icon]
        return (
          <div key={s.id} className="flex items-center gap-3 px-1 transition-all duration-500 animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className={`flex items-center justify-center w-6 h-6 rounded-lg transition-colors duration-300 ${s.status === 'active' ? 'bg-brand-100' : s.status === 'done' ? 'bg-emerald-50' : 'bg-slate-100'}`}>
              {s.status === 'active' ? <LoaderCircle className="h-3.5 w-3.5 text-brand-500 animate-spin" /> : s.status === 'done' ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <span className={s.status === 'active' ? 'text-brand-500' : 'text-slate-300'}><Icon className="h-3.5 w-3.5" /></span>}
            </div>
            <div className="min-w-0 flex-1">
              <span className={`text-sm transition-colors duration-300 ${s.status === 'done' ? 'text-slate-500' : s.status === 'active' ? 'text-slate-800 font-medium' : 'text-slate-300'}`}>{s.label}</span>
              {s.detail && s.status !== 'pending' && <span className={`ml-2 text-xs transition-colors duration-300 ${s.status === 'done' ? 'text-slate-400' : 'text-brand-400'}`}>· {s.detail}</span>}
            </div>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300 ${s.status === 'active' ? 'bg-brand-500 animate-pulse' : s.status === 'done' ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          </div>
        )
      })}
    </div>
  )
}

function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>
    }
    if (part.includes('↑') || part.includes('↓')) {
      return (
        <span key={i}>
          {part.split(/([↑↓])/).map((p, j) => (p === '↑' ? <span key={j} className="text-emerald-600 font-semibold">↑</span> : p === '↓' ? <span key={j} className="text-red-500 font-semibold">↓</span> : p))}
        </span>
      )
    }
    if (part.includes('🔴') || part.includes('🟡')) {
      return (
        <span key={i}>
          {part.split(/(🔴|🟡)/).map((p, j) => (p === '🔴' ? <span key={j} className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mx-0.5 align-middle" /> : p === '🟡' ? <span key={j} className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 mx-0.5 align-middle" /> : p))}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

const NUM = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']

function parseInsight(text) {
  const blocks = []
  let list = []
  const flush = () => {
    if (list.length > 0) {
      blocks.push({ type: 'list-item', items: [...list] })
      list = []
    }
  }
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t) {
      flush()
      continue
    }
    if (t.startsWith('⚠️') || t.startsWith('🔴') || t.startsWith('🟡')) {
      flush()
      blocks.push({ type: 'anomaly', content: t })
      continue
    }
    if (t === '---' || t === '───' || t.startsWith('──')) {
      flush()
      blocks.push({ type: 'separator' })
      continue
    }
    if (t.startsWith('**') || t.startsWith('📊') || t.startsWith('📈') || t.startsWith('💡')) {
      flush()
      blocks.push({ type: 'heading', content: t.replace(/^\*{1,2}|\*{1,2}$/g, '') })
      continue
    }
    if (t.startsWith('###')) {
      flush()
      blocks.push({ type: 'subheading', content: t.replace(/^###\s*/, '') })
      continue
    }
    if (t.startsWith('-') || t.startsWith('•')) {
      list.push(t.replace(/^[-•]\s*/, ''))
      continue
    }
    if (/^[①②③④⑤⑥⑦⑧⑨⑩]/.test(t)) {
      flush()
      blocks.push({ type: 'subheading', content: t })
      continue
    }
    flush()
    blocks.push({ type: 'paragraph', content: t })
  }
  flush()
  return blocks
}

export function InsightMarkdown({ text }) {
  const blocks = useMemo(() => parseInsight(text || ''), [text])
  if (!text || blocks.length === 0) return <p className="text-sm text-slate-400">暂无洞察内容</p>
  return (
    <div className="space-y-0">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading':
            return <h3 key={i} className="text-base font-bold text-slate-900 pt-1 pb-0.5">{b.content ? <Inline text={b.content} /> : null}</h3>
          case 'subheading':
            return <h4 key={i} className="text-sm font-semibold text-slate-700 pt-2 pb-0.5">{b.content ? <Inline text={b.content} /> : null}</h4>
          case 'list-item':
            return (
              <ul key={i} className="space-y-1 py-1">
                {b.items?.map((item, j) => (
                  <li key={j} className="text-sm text-slate-600 leading-relaxed flex gap-2">
                    <span className="text-brand-400 shrink-0 font-medium text-xs mt-0.5">{NUM[j] || '•'}</span>
                    <span><Inline text={item} /></span>
                  </li>
                ))}
              </ul>
            )
          case 'anomaly':
            return <div key={i} className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 my-2"><p className="text-sm text-red-800 leading-relaxed">{b.content ? <Inline text={b.content} /> : null}</p></div>
          case 'separator':
            return <hr key={i} className="border-slate-200 my-2" />
          default:
            return <p key={i} className="text-sm text-slate-600 leading-relaxed py-0.5">{b.content ? <Inline text={b.content} /> : null}</p>
        }
      })}
    </div>
  )
}
