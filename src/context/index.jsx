import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const USERS = {
  manager: { password: 'demo123', role: 'manager', displayName: '张总 · VP' },
  pm: { password: 'demo123', role: 'pm', displayName: '李产品 · 产品经理' },
  analyst: { password: 'demo123', role: 'analyst', displayName: '王分析 · 数据分析师' },
}

export const ROLES = [
  { role: 'manager', displayName: '张总 · VP', initials: '张', label: '管理者视角' },
  { role: 'pm', displayName: '李产品 · 产品经理', initials: '李', label: '产品经理视角' },
  { role: 'analyst', displayName: '王分析 · 数据分析师', initials: '王', label: '数据分析师视角' },
]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('analytics_user')
    return raw ? JSON.parse(raw) : null
  })
  const [activeRole, setActiveRoleState] = useState(() => {
    const raw = localStorage.getItem('analytics_active_role')
    if (raw && ['manager', 'pm', 'analyst'].includes(raw)) return raw
    const u = localStorage.getItem('analytics_user')
    return u ? JSON.parse(u).role : 'manager'
  })

  const setActiveRole = (role) => {
    setActiveRoleState(role)
    localStorage.setItem('analytics_active_role', role)
  }

  const login = (username, password) => {
    const record = USERS[username.toLowerCase()]
    if (!record || record.password !== password) return { success: false, error: '用户名或密码错误' }
    const u = { username: username.toLowerCase(), role: record.role, displayName: record.displayName }
    setUser(u)
    setActiveRoleState(record.role)
    localStorage.setItem('analytics_user', JSON.stringify(u))
    localStorage.setItem('analytics_active_role', record.role)
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('analytics_user')
    localStorage.removeItem('analytics_active_role')
  }

  return (
    <AuthContext.Provider value={{ user, activeRole, setActiveRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

const TOUR_STEPS = [
  { targetId: 'hero-section', title: '经营核心指标看板', description: '这里展示你最关心的业务指标。系统每天自动扫描数据，异常指标会标红并带有脉冲提示。', position: 'bottom' },
  { targetId: 'anomaly-card-area', title: '异常自动发现', description: '看到红色边框和脉冲点的指标了吗？点击卡片上的「分析异常 →」按钮，AI 将自动下钻分析原因。', position: 'top' },
  { targetId: 'dimension-switcher', title: '多维度切换', description: '点击「地区」「客户分层」「时间」可以切换不同分析视角，所有指标卡片会联动更新。', position: 'bottom' },
  { targetId: 'world-map-card', title: '客户分布地图', description: '世界地图展示全球客户分布。光点颜色表示该地区的业务健康度（绿=健康，红=流失风险）。点击城市可查看详情。', position: 'top' },
  { targetId: 'drafts-link', title: '报告草稿箱', description: '所有 AI 分析结果都会自动生成报告并保存到草稿箱。面试时可以展示"从发现异常到生成报告"的完整闭环。', position: 'top' },
  { targetId: 'done', title: '演示结束', description: '以上就是 AI Analytics 的核心工作流。关闭演示模式后可以自由探索各个功能模块。', position: 'top' },
]

const DemoTourContext = createContext(null)

export function DemoTourProvider({ children }) {
  const [enabled, setEnabled] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const total = TOUR_STEPS.length
  const goNext = useCallback(() => setCurrentStep((s) => (s + 1 >= total ? s : s + 1)), [total])
  const goPrev = useCallback(() => setCurrentStep((s) => (s - 1 < 0 ? s : s - 1)), [])
  const skip = useCallback(() => {
    setEnabled(false)
    setCurrentStep(0)
  }, [])
  const value = {
    enabled,
    setEnabled: useCallback((v) => {
      setEnabled(v)
      setCurrentStep(0)
    }, []),
    currentStep,
    totalSteps: total,
    currentStepDef: enabled && currentStep < total ? TOUR_STEPS[currentStep] : null,
    goNext,
    goPrev,
    skip,
  }
  return <DemoTourContext.Provider value={value}>{children}</DemoTourContext.Provider>
}

export function useDemoTour() {
  const ctx = useContext(DemoTourContext)
  if (!ctx) throw new Error('useDemoTour must be used within DemoTourProvider')
  return ctx
}

export function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('analytics_dark_mode') === 'true')
  useEffect(() => {
    const root = document.documentElement
    if (dark) root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('analytics_dark_mode', String(dark))
  }, [dark])
  return { dark, toggle: useCallback(() => setDark((d) => !d), []) }
}
