import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  Search,
  Send,
  LoaderCircle,
  Lightbulb,
  ChevronUp,
  ChevronDown,
  X,
  Check,
} from 'lucide-react'
import { SCENARIOS } from '../lib/metrics.js'
import { generateSuggestions, generateSuggestionsFallback } from '../lib/llm.js'
import { StreamingText } from './charts.jsx'

// 输入框（带联想）
export function ChatInput({ onSubmit, isProcessing, placeholder = '输入你的问题' }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const suggestions = useMemo(() => {
    if (!value.trim()) return []
    const lower = value.toLowerCase()
    const seen = new Set()
    const out = []
    for (const group of SCENARIOS) {
      if (group.keywords.some((k) => lower.includes(k))) {
        for (const q of group.questions) {
          if (!seen.has(q) && q.toLowerCase().includes(lower)) {
            seen.add(q)
            out.push(q)
          }
        }
      }
    }
    for (const group of SCENARIOS) {
      for (const q of group.questions) {
        if (!seen.has(q) && q.includes(value)) {
          seen.add(q)
          out.push(q)
        }
      }
    }
    return out.slice(0, 5)
  }, [value])
  const submit = (e) => {
    e.preventDefault()
    if (value.trim() && !isProcessing) {
      onSubmit(value.trim())
      setValue('')
      setFocused(false)
    }
  }
  const pick = (q) => {
    setValue('')
    setFocused(false)
    onSubmit(q)
  }
  return (
    <form onSubmit={submit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setFocused(e.target.value.trim().length > 0)
          }}
          onFocus={() => {
            if (value.trim()) setFocused(true)
          }}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setFocused(false)
              e.target.blur()
            }
          }}
          placeholder={placeholder}
          disabled={isProcessing}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 pr-14 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all text-base shadow-sm"
        />
        <button
          type="submit"
          disabled={!value.trim() || isProcessing}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg h-10 w-10 flex items-center justify-center transition-all duration-200 active:scale-90 shadow-sm hover:shadow-md"
        >
          {isProcessing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
        {focused && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 bottom-full mb-1 bg-white rounded-lg border border-slate-200 shadow-lg z-20 overflow-hidden animate-fade-in">
            {suggestions.map((q, i) => (
              <button
                key={q}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(q)
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors border-b border-slate-50 last:border-0 flex items-center gap-2"
              >
                <span className="text-[10px] text-slate-400 shrink-0">💬</span>
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </form>
  )
}

// 简单输入框（侧滑面板内）
export function SimpleInput({ onSubmit, isProcessing, placeholder = '输入你的问题' }) {
  const [value, setValue] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (value.trim() && !isProcessing) {
      onSubmit(value.trim())
      setValue('')
    }
  }
  return (
    <form onSubmit={submit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={isProcessing}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 pr-14 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all text-base shadow-sm"
        />
        <button
          type="submit"
          disabled={!value.trim() || isProcessing}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg h-10 w-10 flex items-center justify-center transition-all duration-200 active:scale-90 shadow-sm hover:shadow-md"
        >
          {isProcessing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
    </form>
  )
}

// 数据表格
export function DataTable({ result }) {
  const [sort, setSort] = useState(null)
  const [query, setQuery] = useState('')
  const rows = useMemo(() => {
    let data = [...result.data]
    if (query) data = data.filter((d) => d.label.toLowerCase().includes(query.toLowerCase()))
    if (sort === 'asc') data.sort((a, b) => a.value - b.value)
    else if (sort === 'desc') data.sort((a, b) => b.value - a.value)
    return data
  }, [result.data, sort, query])
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">{result.metricLabel}</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-violet-500/50 w-36"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th
                className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                onClick={() => setSort(sort === 'asc' ? 'desc' : sort === 'desc' ? null : 'asc')}
              >
                <div className="flex items-center gap-1.5">
                  {result.dimension === 'month' ? '月份' : '分类'}
                  {sort === 'asc' ? <ChevronUp className="h-3 w-3" /> : sort === 'desc' ? <ChevronDown className="h-3 w-3" /> : null}
                </div>
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">数值 ({result.unit})</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-2.5 text-slate-700">{d.label}</td>
                <td className="px-4 py-2.5 text-right text-slate-900 font-mono text-sm tabular-nums">{d.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <div className="p-8 text-center text-sm text-slate-400">没有匹配的数据</div>}
    </div>
  )
}

// 策略建议面板
export function StrategySuggestion({ context }) {
  const [open, setOpen] = useState(false)
  const [stream, setStream] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [fallback, setFallback] = useState(null)
  const [started, setStarted] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (started) return
    setStarted(true)
    setGenerating(true)
    setStream(generateSuggestions(context))
  }, [context, started])

  const onComplete = useCallback(async () => {
    setGenerating(false)
    setGenerated(true)
    if (!bodyRef.current) return
    const text = bodyRef.current.innerText.trim()
    if (text.length < 20) {
      try {
        setFallback(await generateSuggestionsFallback(context))
      } catch {
        setFallback(text || '策略建议生成失败，请重试。')
      }
    }
  }, [context])

  return (
    <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => {
          if (!generated && generating) return
          setOpen(!open)
        }}
        disabled={generating && !generated}
        className="w-full flex items-center justify-between p-4 hover:bg-amber-50/50 transition-colors text-left disabled:cursor-default"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">策略建议</span>
              {generating && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <LoaderCircle className="h-3 w-3 animate-spin" />
                  生成中...
                </span>
              )}
              {generated && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Check className="h-3 w-3" />
                  已生成
                </span>
              )}
            </div>
            {!generated && !generating && <p className="text-[10px] text-slate-400 mt-0.5">准备生成策略建议</p>}
            {generating && <p className="text-[10px] text-amber-500 mt-0.5">正在生成策略建议，请稍后...</p>}
            {generated && !open && <p className="text-[10px] text-slate-400 mt-0.5">点击展开查看策略建议</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {generating && (
            <div className="w-20 h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          )}
          {generated && !open && <span className="text-xs font-medium text-amber-600 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">展开查看</span>}
          {open ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
        </div>
      </button>
      {generating && (
        <div className="h-0.5 bg-amber-100">
          <div className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 animate-pulse" style={{ width: '100%' }} />
        </div>
      )}
      {open && stream && (
        <div className="px-4 pb-4 border-t border-amber-100 pt-4">
          <div ref={bodyRef}>
            <StreamingText stream={stream} onComplete={onComplete} />
          </div>
          {fallback && <div className="mt-2 whitespace-pre-wrap text-slate-700 leading-relaxed text-sm">{fallback}</div>}
        </div>
      )}
    </div>
  )
}

// 场景引导
export function ScenarioGuide({ scenarios, onSelect }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('guide-dismissed') === 'true')
  if (dismissed) return null
  return (
    <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 rounded-xl p-5 mb-6 relative animate-fade-in">
      <button
        onClick={() => {
          setDismissed(true)
          localStorage.setItem('guide-dismissed', 'true')
        }}
        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-violet-500" />
        <span className="text-sm font-semibold text-violet-800">试试这样问</span>
      </div>
      <div className="space-y-2">
        {scenarios.map((s) => (
          <button key={s.question} onClick={() => onSelect(s.question)} className="block w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-white/60 hover:text-violet-700 transition-colors">
            <span className="font-medium">{s.question}</span>
            <span className="text-slate-400 ml-2">— {s.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
