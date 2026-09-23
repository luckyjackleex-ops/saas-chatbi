import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChartColumn, MessageSquare, TrendingUp, Sparkles, FileText, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react'
import { useAuth } from '../context/index.jsx'

const DEMO_ACCOUNTS = [
  { role: '总经理', user: 'manager', pwd: 'demo123' },
  { role: '产品经理', user: 'pm', pwd: 'demo123' },
  { role: '数据分析师', user: 'analyst', pwd: 'demo123' },
]

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('manager')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const submit = () => {
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    setTimeout(() => {
      const res = login(username.trim(), password)
      if (res.success) navigate('/')
      else {
        setError(res.error ?? '登录失败')
        setLoading(false)
      }
    }, 400)
  }

  const fill = (user) => {
    setUsername(user)
    setPassword('demo123')
    setError('')
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-[42%] bg-zinc-950 flex-col justify-between p-10 relative overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-10">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgb(148, 163, 184) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-[0_4px_12px_rgba(139,92,246,0.3)]">
              <ChartColumn className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">AI Analytics</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">SaaS 公司的<br /><span className="text-violet-400">AI 数据分析师</span></h1>
          <p className="mt-4 text-base text-zinc-400 leading-relaxed max-w-sm">用自然语言提问，拿到从图表、洞察到建议和报告的完整分析结果。开箱即用，专为 SaaS 场景内置行业指标体系。</p>
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <MessageSquare className="h-3.5 w-3.5 text-violet-500" /><span>自然语言查询</span><span className="text-zinc-700">→</span>
            <TrendingUp className="h-3.5 w-3.5 text-violet-500" /><span>智能图表</span><span className="text-zinc-700">→</span>
            <Sparkles className="h-3.5 w-3.5 text-violet-500" /><span>AI 洞察</span><span className="text-zinc-700">→</span>
            <FileText className="h-3.5 w-3.5 text-violet-500" /><span>策略建议</span>
          </div>
        </div>
        <p className="relative text-xs text-zinc-600">Demo Project · AI PM Portfolio</p>
      </div>
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600 shadow-lg shadow-violet-200 mb-3">
              <ChartColumn className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">AI Analytics Platform</h1>
            <p className="text-sm text-slate-500 mt-1">SaaS 公司的 AI 数据分析师</p>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">欢迎回来</h2>
          <p className="text-sm text-slate-500 mb-8">使用 Demo 账号登录体验</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
              <input
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                disabled={loading}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  disabled={loading}
                  className="w-full h-11 px-3.5 pr-10 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-all text-sm"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button
              onClick={submit}
              disabled={loading}
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-violet-200 active:scale-[0.99]"
            >
              {loading ? '验证中...' : <>登录<ArrowRight className="h-4 w-4" /></>}
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400">Demo 账号</span></div>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-xs font-semibold text-slate-700">快速体验 — 点击填入</span>
              </div>
              <div className="space-y-1">
                {DEMO_ACCOUNTS.map((a) => (
                  <button key={a.user} onClick={() => fill(a.user)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-colors group">
                    <span>{a.role}</span>
                    <span className="font-mono text-slate-400 group-hover:text-violet-500">{a.user} / demo123</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
