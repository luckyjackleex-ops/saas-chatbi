import { useNavigate } from 'react-router-dom'
import { Lightbulb, ShieldAlert, TrendingUp, FileText, Globe, Bell, Users, LayoutDashboard, ChartColumn, Microscope, ArrowRight } from 'lucide-react'

const WORKFLOW = [
  {
    step: 1,
    title: '看异常',
    desc: '系统每天自动扫描核心指标，异常数据标红提醒，无需手动提问即可发现潜在问题。',
    detail: 'Dashboard 顶部的"异常警报"区域会自动展示 Z-score 检测到的异常指标，按严重程度排序（红色=紧急，黄色=关注）。点击任意异常卡片的 [分析原因 →] 按钮可启动 AI 自动分析。',
    icon: ShieldAlert,
    color: 'red',
  },
  {
    step: 2,
    title: '点分析',
    desc: '点击任意指标的 [分析▸] 按钮，AI 自动下钻分析，从 Dashboard 侧滑面板完成全部分析。',
    detail: '在"我的关注指标"和"月度关键指标"区域，每个指标卡片都有 [分析▸] 按钮。点击后右侧滑出分析面板，AI 自动查询数据、渲染图表、生成洞察，全程无需跳转页面。',
    icon: TrendingUp,
    color: 'blue',
  },
  {
    step: 3,
    title: '拿报告',
    desc: '分析完成后一键生成报告，自动存入草稿箱，支持 PDF 导出和团队共享。',
    detail: '分析面板底部点击"生成报告并保存"，报告会自动存入左侧菜单的"报告草稿箱"。在草稿箱中可以查看、编辑、导出 PDF。同时团队动态中会展示报告生成记录。',
    icon: FileText,
    color: 'violet',
  },
]

const FEATURES = [
  { icon: Globe, title: '世界地图', desc: '查看全球客户分布，NRR 颜色编码一目了然，点击城市查看详情' },
  { icon: Bell, title: '异常监测', desc: '自定义监测 3-5 个核心指标，异常自动推送，周末效应智能过滤' },
  { icon: Users, title: '角色切换', desc: '顶部工具栏下拉框一键切换角色视角，无需重新登录' },
  { icon: LayoutDashboard, title: '三个分析视角', desc: '管理者（经营分析）/ 产品经理（功能复盘）/ 数据分析师（智能取数）' },
  { icon: ChartColumn, title: '图表洞察', desc: '流式 AI 洞察 + 结构化文字渲染，图表内嵌异常标注' },
  { icon: Microscope, title: '对比分析', desc: '产品经理视角支持 AB 实验对比 + 统计显著性检验' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const go = (q) => navigate(`/manager?q=${encodeURIComponent(q)}`)
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">新手引导</h1>
        </div>
        <p className="text-slate-500 text-sm">花 2 分钟了解 AI Analytics 的核心工作流，快速上手数据驱动决策。</p>
      </div>

      <section className="mb-10">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-5">核心工作流</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WORKFLOW.map((w) => (
            <div key={w.step} className={`rounded-xl border p-5 ${w.color === 'red' ? 'border-red-200 bg-red-50' : w.color === 'blue' ? 'border-blue-200 bg-blue-50' : 'border-brand-200 bg-brand-50'}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`w-7 h-7 rounded-full ${w.color === 'red' ? 'bg-red-100 text-red-700' : w.color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-brand-100 text-brand-700'} flex items-center justify-center text-xs font-bold`}>{w.step}</span>
                <w.icon className={`h-5 w-5 ${w.color === 'red' ? 'text-red-500' : w.color === 'blue' ? 'text-blue-500' : 'text-brand-500'}`} />
                <h3 className="text-base font-semibold text-slate-800">{w.title}</h3>
              </div>
              <p className="text-sm text-slate-600 mb-3">{w.desc}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{w.detail}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <span>① 每天早上打开 Dashboard</span>
            <ArrowRight className="h-3 w-3" />
            <span>② 发现异常 → 点分析</span>
            <ArrowRight className="h-3 w-3" />
            <span>③ 生成报告 → 决策</span>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-5">功能一览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{f.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-5">快速体验</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-600 mb-4">选择一个问题，直接进入对应视角开始分析：</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button onClick={() => go('这个月经营数据怎么样？')} className="text-left bg-violet-50 border border-violet-100 rounded-xl p-4 hover:border-violet-300 hover:bg-violet-100 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-violet-800">管理者视角</span>
                <ArrowRight className="h-4 w-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-violet-600 mt-1">"这个月经营数据怎么样？"</p>
            </button>
            <button onClick={() => go('新注册流程上线后 7 日留存有没有变化？')} className="text-left bg-blue-50 border border-blue-100 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-100 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">产品经理视角</span>
                <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-blue-600 mt-1">"新注册流程上线后 7 日留存有没有变化？"</p>
            </button>
            <button onClick={() => go('哪个客户分层的流失率最高？')} className="text-left bg-emerald-50 border border-emerald-100 rounded-xl p-4 hover:border-emerald-300 hover:bg-emerald-100 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-800">数据分析师视角</span>
                <ArrowRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-emerald-600 mt-1">"哪个客户分层的流失率最高？"</p>
            </button>
            <button onClick={() => go('生成经营分析周报')} className="text-left bg-slate-50 border border-slate-100 rounded-xl p-4 hover:border-slate-300 hover:bg-slate-100 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">通用</span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-slate-500 mt-1">"生成经营分析周报"</p>
            </button>
          </div>
        </div>
      </section>

      <div className="text-center pb-8">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-sm transition-colors">
          回到 Dashboard 开始使用
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
