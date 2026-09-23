import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  Inbox,
  Database,
  Layers,
  Lightbulb,
  HelpCircle,
  ChevronLeft,
  LogOut,
  RefreshCw,
  Bell,
  Sun,
  Moon,
  Play,
  ChevronDown,
} from 'lucide-react'
import { useAuth, useDemoTour, useDarkMode, ROLES } from '../context/index.jsx'
import { getNotifications, subscribeNotifications } from '../lib/store.js'

const MAIN_NAV = [
  { path: '/', label: '数据看板', icon: LayoutDashboard, exact: true },
  { path: '/chatbi', label: 'ChatBI', icon: MessageSquare },
]
const TOOL_NAV = [
  { path: '/drafts', label: '报告草稿箱', icon: Inbox },
  { path: '/data-management', label: '数据管理', icon: Database },
  { path: '/semantic-layer', label: '语义层管理', icon: Layers },
]

export function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const isActive = (path, exact) => (exact ? location.pathname === path : location.pathname.startsWith(path))
  const doLogout = () => {
    logout()
    navigate('/login')
  }
  const roleLabel = user?.role === 'manager' ? '总经理' : user?.role === 'pm' ? '产品经理' : '数据分析师'
  return (
    <aside
      className="h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0 transition-all duration-200"
      style={{ width: collapsed ? 64 : 240 }}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
        {!collapsed ? (
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">AI Analytics</span>
          </button>
        ) : (
          <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </button>
        )}
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="p-3 space-y-1">
        {!collapsed && <p className="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">分析视角</p>}
        {MAIN_NAV.map(({ path, label, icon: Icon, exact }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-[0.97] ${
              isActive(path, exact) ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      <div className="px-3"><div className="border-t border-zinc-800" /></div>

      <nav className="p-3 space-y-1">
        {!collapsed && <p className="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">工具</p>}
        {TOOL_NAV.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-[0.97] ${
              isActive(path) ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/50' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      <div className="px-3"><div className="border-t border-zinc-800" /></div>

      <nav className="p-3 space-y-1">
        <button
          onClick={() => navigate('/onboarding')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
            isActive('/onboarding') ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/50' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
          }`}
          title={collapsed ? '新手引导' : undefined}
        >
          <Lightbulb className="h-4 w-4 shrink-0" />
          {!collapsed && <span>新手引导</span>}
        </button>
        <button
          onClick={() => navigate('/help')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
            isActive('/help') ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/50' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
          }`}
          title={collapsed ? '帮助中心' : undefined}
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          {!collapsed && <span>帮助中心</span>}
        </button>
      </nav>

      <div className="flex-1" />

      <div className="p-3 border-t border-zinc-800">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">{user?.displayName?.charAt(0) || '?'}</span>
            <button onClick={doLogout} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors" title="退出登录">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">{user?.displayName?.charAt(0) || '?'}</span>
              <div>
                <p className="text-xs font-medium text-zinc-300 leading-tight">{user?.displayName}</p>
                <p className="text-[10px] text-zinc-500 leading-tight">{roleLabel}</p>
              </div>
            </div>
            <button onClick={doLogout} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors" title="退出登录">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

function RoleSwitcher() {
  const { activeRole, setActiveRole } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const current = ROLES.find((r) => r.role === activeRole) || ROLES[0]
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors">
        <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">{current.initials}</span>
        <span className="font-medium">{current.displayName}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-slate-200 b2b-shadow-dropdown py-1.5 z-50 animate-fade-in">
          <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">切换演示角色</p>
          {ROLES.map((r) => (
            <button
              key={r.role}
              onClick={() => {
                setActiveRole(r.role)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${activeRole === r.role ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${activeRole === r.role ? 'bg-brand-200 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{r.initials}</span>
              <div className="text-left">
                <p className="font-medium text-sm leading-tight">{r.displayName}</p>
                <p className="text-xs text-slate-400 leading-tight">{r.label}</p>
              </div>
              {activeRole === r.role && <span className="ml-auto w-2 h-2 rounded-full bg-brand-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState(getNotifications)
  const ref = useRef(null)
  const navigate = useNavigate()
  useEffect(() => subscribeNotifications(() => setList(getNotifications())), [])
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  const timeAgo = (ts) => {
    try {
      const t = new Date(ts)
      const hours = Math.round((Date.now() - t.getTime()) / 3600000)
      if (hours < 1) return '刚刚'
      if (hours < 24) return `${hours} 小时前`
      if (hours < 48) return '昨天'
      return t.toLocaleDateString('zh-CN')
    } catch {
      return ts
    }
  }
  const count = list.length
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className={`relative p-2 rounded-lg transition-all ${open ? 'text-slate-600 bg-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`} title="通知">
        <Bell className="h-3.5 w-3.5" />
        {count > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">{count > 9 ? '9+' : count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-xl z-50 animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-700">异常通知</h3>
            <span className="text-[10px] text-slate-400">{count} 项</span>
          </div>
          {list.length > 0 ? (
            <div className="max-h-72 overflow-y-auto">
              {list.map((n) => (
                <div key={n.id} className="px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.severity === 'red' ? 'bg-red-500' : 'bg-amber-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800 truncate">{n.metricLabel}</span>
                        <span className={`text-xs font-bold tabular-nums shrink-0 ${n.severity === 'red' ? 'text-red-600' : 'text-amber-600'}`}>
                          {n.currentValue}
                          {n.metricKey.includes('nrr') || n.metricKey.includes('churn') || n.metricKey.includes('retention') || n.metricKey.includes('stickiness') ? '%' : ''}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">环比 {n.changePercent > 0 ? '+' : ''}{n.changePercent}%</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{n.insight}</p>
                      <span className="text-[10px] text-slate-300 mt-1 block">{timeAgo(n.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center"><p className="text-xs text-slate-400">当前所有指标正常 ✓</p></div>
          )}
          <div className="border-t border-slate-100 px-4 py-2">
            <button onClick={() => { setOpen(false); navigate('/') }} className="w-full text-center text-[10px] text-brand-600 hover:text-brand-700 font-medium py-1">查看全部 →</button>
          </div>
        </div>
      )}
    </div>
  )
}

function DarkModeToggle() {
  const { dark, toggle } = useDarkMode()
  return (
    <button onClick={toggle} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all" title={dark ? '切换到亮色模式' : '切换到暗色模式'}>
      {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  )
}

function DemoModeToggle() {
  const { enabled, setEnabled } = useDemoTour()
  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${enabled ? 'bg-brand-100 text-brand-700 border border-brand-300' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-transparent'}`}
      title={enabled ? '关闭演示模式' : '开启演示模式'}
    >
      <Play className="h-3 w-3" />
      演示
    </button>
  )
}

function breadcrumb(pathname) {
  const map = {
    '/': 'Dashboard',
    '/manager': '管理者视角',
    '/pm': '产品经理视角',
    '/analyst': '数据分析师视角',
    '/drafts': '报告草稿箱',
    '/data-management': '数据管理',
    '/semantic-layer': '语义层管理',
    '/help': '帮助中心',
  }
  if (pathname === '/') return ['Dashboard']
  if (pathname.startsWith('/report/')) return ['Dashboard', '报告详情']
  const t = map[pathname]
  return t ? ['Dashboard', t] : ['Dashboard']
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const crumbs = breadcrumb(location.pathname)
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400">
          {crumbs.map((c, i) => (
            <span key={c} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-300">/</span>}
              {i === 0 ? (
                <button onClick={() => navigate('/')} className="hover:text-slate-600 transition-colors">{c}</button>
              ) : (
                <span className="text-slate-500 font-medium">{c}</span>
              )}
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400 mr-2">最后更新于 30 秒前</span>
        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-[0.92]" title="刷新数据"><RefreshCw className="h-3.5 w-3.5" /></button>
        <NotificationBell />
        <DarkModeToggle />
        <DemoModeToggle />
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <RoleSwitcher />
        <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold ml-1">{user?.displayName?.charAt(0) || '?'}</span>
      </div>
    </header>
  )
}
