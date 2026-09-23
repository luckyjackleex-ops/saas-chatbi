import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap, MessageSquare, FileText, HelpCircle, ExternalLink, BookOpen } from 'lucide-react'
import { QUICK_START, ROLE_GUIDES, FAQ, METRICS } from '../lib/metrics.js'

const CHART_LABEL = { line: '折线图', bar: '柱状图', pie: '饼图', scatter: '散点图' }

export default function Help() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-4 w-4" /> 返回看板
            </button>
            <span className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-500" />
              <h1 className="text-sm font-semibold text-slate-900">帮助中心</h1>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2"><Zap className="h-5 w-5 text-violet-500" />快速入门</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {QUICK_START.map((s) => (
              <div key={s.num} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative">
                <span className="absolute top-2 right-3 text-3xl font-bold text-slate-100 select-none">{s.num}</span>
                <h3 className="text-sm font-semibold text-slate-900 relative z-10">{s.title}</h3>
                <p className="text-xs text-slate-500 mt-1 relative z-10">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-violet-500" />角色使用场景</h2>
          <div className="space-y-4">
            {ROLE_GUIDES.map((r) => (
              <div key={r.role} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.color === 'violet' ? 'bg-violet-50' : r.color === 'blue' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                      <r.icon className={`h-4 w-4 ${r.color === 'violet' ? 'text-violet-600' : r.color === 'blue' ? 'text-blue-600' : 'text-emerald-600'}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{r.role}</h3>
                      <p className="text-xs text-slate-500">{r.intro}</p>
                    </div>
                    <button onClick={() => navigate(r.path)} className="ml-auto text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                      进入 <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {r.examples.map((e) => (
                      <div key={e.q} className="flex gap-3 text-xs bg-slate-50 rounded-lg p-2.5">
                        <span className="text-violet-600 font-medium shrink-0">Q:</span>
                        <span className="text-slate-700">{e.q}</span>
                        <span className="text-slate-400 mx-1">→</span>
                        <span className="text-slate-500">{e.r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2"><FileText className="h-5 w-5 text-violet-500" />支持的指标</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">指标</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Key</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">分类</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">单位</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">图表</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">别名示例</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(METRICS).map(([key, m]) => (
                    <tr key={key} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 text-slate-900 font-medium">{m.label}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{key}</td>
                      <td className="px-4 py-2.5"><span className={`text-xs px-1.5 py-0.5 rounded font-medium ${m.category === '经营' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'}`}>{m.category}</span></td>
                      <td className="px-4 py-2.5 text-slate-500">{m.unit}</td>
                      <td className="px-4 py-2.5 text-slate-500">{CHART_LABEL[m.chartType]}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs">{m.aliases.slice(0, 4).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2"><HelpCircle className="h-5 w-5 text-violet-500" />常见问题</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <div key={f.q} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">Q: {f.q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
