import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Search, Brain, MessageSquare, ArrowRightLeft, ChartColumn, Lightbulb, Layers, X, ShieldAlert } from 'lucide-react'
import { METRICS, DIMENSIONS } from '../lib/metrics.js'
import { readLocal, writeLocal } from '../lib/store.js'

const CATEGORIES = ['全部', '经营', '产品']
const CHART_TYPES = ['line', 'bar', 'pie', 'scatter']
const CHART_LABEL = { line: '折线图', bar: '柱状图', pie: '饼图', scatter: '散点图' }

const EMPTY = { key: '', label: '', aliases: [], unit: '', category: '经营', chartType: 'line', dimensions: [] }

function readMetrics() {
  return readLocal('semantic_metrics') || METRICS
}

function Guide() {
  const [show, setShow] = useState(() => localStorage.getItem('sl-guide') !== 'dismissed')
  if (!show) return null
  return (
    <div className="bg-gradient-to-r from-violet-50 via-white to-blue-50 border border-violet-200 rounded-xl p-5 mb-6 relative animate-fade-in">
      <button onClick={() => { setShow(false); localStorage.setItem('sl-guide', 'dismissed') }} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"><X className="h-4 w-4" /></button>
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-5 w-5 text-violet-500" />
        <span className="text-base font-bold text-violet-800">什么是语义层？</span>
      </div>
      <p className="text-sm text-slate-600 mb-4 leading-relaxed">
        语义层是<span className="font-medium text-slate-700">业务语言与底层数据之间的翻译桥梁</span>。 当用户在搜索框输入自然语言（如"这个月收入怎么样"），系统通过语义层将"收入"自动匹配到 MRR 指标、 将"这个月"解析为 2026-05，然后查询正确的数据并生成图表。
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white/70 rounded-lg p-3 border border-violet-100">
          <div className="flex items-center gap-1.5 mb-1.5"><MessageSquare className="h-3.5 w-3.5 text-violet-500" /><span className="text-xs font-semibold text-violet-700">用户说的话</span></div>
          <p className="text-xs text-slate-500">"这个月 MRR 怎么样？"<br />"哪个渠道流失率最高？"</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 border border-violet-100">
          <div className="flex items-center gap-1.5 mb-1.5"><ArrowRightLeft className="h-3.5 w-3.5 text-violet-500" /><span className="text-xs font-semibold text-violet-700">语义层匹配</span></div>
          <p className="text-xs text-slate-500">"MRR" → mrr 指标<br />"渠道" → channel 维度</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 border border-violet-100">
          <div className="flex items-center gap-1.5 mb-1.5"><ChartColumn className="h-3.5 w-3.5 text-violet-500" /><span className="text-xs font-semibold text-violet-700">查询 & 图表</span></div>
          <p className="text-xs text-slate-500">按 channel 维度查 mrr<br />自动选折线图展示</p>
        </div>
      </div>
      <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-3 border border-amber-100">
        <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700">
          <p className="font-medium mb-0.5">如何使用本页面？</p>
          <ul className="space-y-0.5 text-amber-600">
            <li>· <strong>查看</strong>下方所有指标的别名、单位、图表类型和可用维度</li>
            <li>· <strong>编辑</strong>指标，增删别名（同义词），让系统更好理解用户的不同说法</li>
            <li>· <strong>添加</strong>自定义指标，扩展语义层的覆盖范围</li>
            <li>· <strong>搜索 & 筛选</strong>快速定位目标指标</li>
            <li>· 修改后<span className="font-medium">自动保存</span>到本地，刷新不丢失</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function SemanticLayer() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState(readMetrics)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')
  const [modal, setModal] = useState(null)
  const [draft, setDraft] = useState(EMPTY)
  const [alias, setAlias] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = Object.entries(metrics).filter(([, m]) => {
    const matchSearch = !search || m.label.includes(search) || m.key.includes(search.toLowerCase()) || m.aliases.some((a) => a.includes(search))
    const matchCat = category === '全部' || m.category === category
    return matchSearch && matchCat
  })

  const commit = (next) => {
    setMetrics(next)
    writeLocal('semantic_metrics', next)
  }

  const openCreate = () => {
    setDraft({ ...EMPTY })
    setAlias('')
    setModal({ mode: 'create' })
  }

  const openEdit = (key) => {
    setDraft({ ...metrics[key] })
    setAlias('')
    setModal({ mode: 'edit', key })
  }

  const save = () => {
    if (!draft.key.trim() || !draft.label.trim()) return
    const next = { ...metrics }
    if (modal?.mode === 'edit') delete next[modal.key]
    next[draft.key] = { ...draft }
    commit(next)
    setModal(null)
  }

  const remove = (key) => {
    const next = { ...metrics }
    delete next[key]
    commit(next)
    setConfirmDelete(null)
  }

  const addAlias = () => {
    if (alias.trim() && !draft.aliases.includes(alias.trim())) {
      setDraft({ ...draft, aliases: [...draft.aliases, alias.trim()] })
      setAlias('')
    }
  }

  const toggleDim = (key) => {
    setDraft({ ...draft, dimensions: draft.dimensions.includes(key) ? draft.dimensions.filter((d) => d !== key) : [...draft.dimensions, key] })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-4 w-4" /> 返回看板
            </button>
            <span className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-500" />
              <h1 className="text-sm font-semibold text-slate-900">语义层管理</h1>
            </div>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors shadow-sm">
            <Plus className="h-3.5 w-3.5" /> 添加指标
          </button>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Guide />
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索指标名称、别名..." className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 shadow-sm" />
          </div>
          <div className="flex gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === c ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{c}</button>
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-auto">共 {filtered.length} 个指标</span>
        </div>

        <div className="space-y-3">
          {filtered.map(([key, m]) => (
            <div key={key} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ChartColumn className="h-4 w-4 text-violet-500" />
                    <h3 className="text-sm font-semibold text-slate-900">{m.label}</h3>
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{key}</code>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${m.category === '经营' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'}`}>{m.category}</span>
                    {m.alert && <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"><ShieldAlert className="h-3 w-3" />告警</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>单位：<span className="font-medium text-slate-700">{m.unit}</span></span>
                    <span>图表：<span className="font-medium text-slate-700">{CHART_LABEL[m.chartType]}</span></span>
                    <span>维度：<span className="font-medium text-slate-700">{m.dimensions.map((d) => DIMENSIONS[d]?.label || d).join('、') || '无'}</span></span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.aliases.map((a) => <span key={a} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{a}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => openEdit(key)} className="text-xs font-medium text-violet-600 hover:text-violet-700 px-2.5 py-1.5 rounded-lg hover:bg-violet-50 transition-colors">编辑</button>
                  <button onClick={() => setConfirmDelete(key)} className="text-xs font-medium text-red-400 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors">删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">{modal.mode === 'edit' ? '编辑指标' : '添加指标'}</h3>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-4 w-4 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">指标 Key（唯一标识）</label>
                  <input type="text" value={draft.key} disabled={modal.mode === 'edit'} onChange={(e) => setDraft({ ...draft, key: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">指标名称</label>
                  <input type="text" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">单位</label>
                  <input type="text" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">分类</label>
                  <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-violet-500">
                    <option value="经营">经营</option>
                    <option value="产品">产品</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">图表类型</label>
                  <select value={draft.chartType} onChange={(e) => setDraft({ ...draft, chartType: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-violet-500">
                    {CHART_TYPES.map((t) => <option key={t} value={t}>{CHART_LABEL[t]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">别名（同义词）</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {draft.aliases.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded">
                      {a}
                      <button onClick={() => setDraft({ ...draft, aliases: draft.aliases.filter((x) => x !== a) })}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAlias())} placeholder="输入别名后回车添加" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-violet-500" />
                  <button onClick={addAlias} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium">添加</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">可用维度</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(DIMENSIONS).map(([k, d]) => (
                    <button key={k} onClick={() => toggleDim(k)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${draft.dimensions.includes(k) ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{d.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">取消</button>
                <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-sm">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><ShieldAlert className="h-5 w-5 text-red-500" /></div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">确认删除</h3>
                <p className="text-xs text-slate-500 mt-0.5">将删除指标 "{metrics[confirmDelete]?.label ?? confirmDelete}"，此操作不可撤销。</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">取消</button>
              <button onClick={() => remove(confirmDelete)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
