import {
  ChartColumn,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  Activity,
  Layers,
  Search,
  Database,
  Sparkles,
  MessageSquare,
  Lightbulb,
  Globe,
  Bell,
  LayoutDashboard,
  Microscope,
  Code,
  ShieldAlert,
  FileText,
} from 'lucide-react'

// 指标定义（语义层核心）
export const METRICS = {
  mrr: {
    key: 'mrr',
    label: '月度经常性收入',
    aliases: ['收入', 'MRR', '月收入', '营收', 'revenue', '月费收入', '订阅收入'],
    unit: '万元',
    category: '经营',
    chartType: 'line',
    dimensions: ['month', 'customer_tier', 'channel', 'region'],
  },
  arr: {
    key: 'arr',
    label: '年化经常性收入',
    aliases: ['ARR', '年收入', '年化收入', '年度收入'],
    unit: '万元',
    category: '经营',
    chartType: 'line',
    dimensions: ['month'],
  },
  churn_rate: {
    key: 'churn_rate',
    label: '客户流失率',
    aliases: ['流失率', 'churn', '客户流失', '流失', 'churn rate'],
    unit: '%',
    category: '经营',
    chartType: 'line',
    dimensions: ['month', 'customer_tier', 'region', 'plan_type'],
    alert: { direction: 'up', threshold: 5, message: '流失率超过 5%，需要关注' },
  },
  nrr: {
    key: 'nrr',
    label: '净收入留存率',
    aliases: ['NRR', '净留存', '收入留存', 'net revenue retention'],
    unit: '%',
    category: '经营',
    chartType: 'line',
    dimensions: ['month', 'customer_tier'],
  },
  ltv: {
    key: 'ltv',
    label: '客户生命周期价值',
    aliases: ['LTV', '客户价值', '生命周期价值', 'life time value'],
    unit: '元',
    category: '经营',
    chartType: 'bar',
    dimensions: ['customer_tier', 'channel'],
  },
  cac: {
    key: 'cac',
    label: '客户获取成本',
    aliases: ['CAC', '获客成本', '获取成本', '获客'],
    unit: '元',
    category: '经营',
    chartType: 'bar',
    dimensions: ['channel', 'month'],
  },
  new_customers: {
    key: 'new_customers',
    label: '新增客户数',
    aliases: ['新客', '新增客户', '新客户', '获客数', 'new customers'],
    unit: '个',
    category: '经营',
    chartType: 'bar',
    dimensions: ['month', 'channel', 'region'],
  },
  churned_customers: {
    key: 'churned_customers',
    label: '流失客户数',
    aliases: ['流失客户', '流失数', 'churned customers'],
    unit: '个',
    category: '经营',
    chartType: 'bar',
    dimensions: ['month', 'customer_tier'],
  },
  gross_margin: {
    key: 'gross_margin',
    label: '毛利率',
    aliases: ['毛利率', '毛利', 'gross margin'],
    unit: '%',
    category: '经营',
    chartType: 'line',
    dimensions: ['month'],
  },
  avg_revenue_per_user: {
    key: 'avg_revenue_per_user',
    label: '人均月收入',
    aliases: ['人均收入', 'ARPU', '单客收入', 'average revenue per user'],
    unit: '元',
    category: '经营',
    chartType: 'line',
    dimensions: ['month', 'customer_tier'],
  },
  expansion_mrr: {
    key: 'expansion_mrr',
    label: '扩展 MRR',
    aliases: ['扩展收入', '增购收入', 'expansion', '升级收入'],
    unit: '万元',
    category: '经营',
    chartType: 'bar',
    dimensions: ['month', 'customer_tier'],
  },
  dau: {
    key: 'dau',
    label: '日活跃用户数',
    aliases: ['DAU', '日活', '日活跃', 'daily active users'],
    unit: '人',
    category: '产品',
    chartType: 'line',
    dimensions: ['month'],
  },
  mau: {
    key: 'mau',
    label: '月活跃用户数',
    aliases: ['MAU', '月活', '月活跃', 'monthly active users'],
    unit: '人',
    category: '产品',
    chartType: 'line',
    dimensions: ['month'],
  },
  stickiness: {
    key: 'stickiness',
    label: '用户粘性',
    aliases: ['粘性', 'DAU/MAU', 'stickiness', '活跃率'],
    unit: '%',
    category: '产品',
    chartType: 'line',
    dimensions: ['month'],
  },
  d7_retention: {
    key: 'd7_retention',
    label: '7 日留存率',
    aliases: ['7日留存', '周留存', 'D7留存', '7 day retention', '留存'],
    unit: '%',
    category: '产品',
    chartType: 'line',
    dimensions: ['month', 'channel'],
  },
  d30_retention: {
    key: 'd30_retention',
    label: '30 日留存率',
    aliases: ['30日留存', '月留存', 'D30留存', '30 day retention'],
    unit: '%',
    category: '产品',
    chartType: 'line',
    dimensions: ['month'],
  },
}

export const DIMENSIONS = {
  month: { key: 'month', label: '月份', values: [] },
  customer_tier: { key: 'customer_tier', label: '客户分层', values: ['enterprise', 'mid_market', 'smb'] },
  channel: { key: 'channel', label: '渠道', values: ['自然流量', '付费投放', '合作伙伴', '客户推荐'] },
  region: { key: 'region', label: '地区', values: ['华东', '华南', '华北', '西南', '海外'] },
  plan_type: { key: 'plan_type', label: '产品版本', values: ['企业版', '专业版', '基础版'] },
}

// 指标图标 / 颜色 / 描述（Dashboard 卡片用）
export const METRIC_ICONS = {
  mrr: { icon: DollarSign, color: '#7c3aed', desc: '月度经常性收入，反映 SaaS 业务核心收入水平' },
  arr: { icon: DollarSign, color: '#3b82f6', desc: '年化经常性收入 = MRR × 12，反映年度收入规模' },
  nrr: { icon: TrendingUp, color: '#10b981', desc: '净收入留存率，>100% 表示存量客户收入在增长' },
  churn_rate: { icon: TrendingDown, color: '#ef4444', desc: '客户流失率，月度流失客户占总客户比例' },
  new_customers: { icon: UserPlus, color: '#f59e0b', desc: '当月新签约的付费客户数量' },
  dau: { icon: Users, color: '#3b82f6', desc: '日活跃用户数，衡量产品每日使用规模' },
  d7_retention: { icon: Activity, color: '#10b981', desc: '新用户注册后第 7 天仍在使用的比例' },
  stickiness: { icon: Activity, color: '#f59e0b', desc: 'DAU / MAU 比值，衡量用户粘性和使用频率' },
  total_customers: { icon: Users, color: '#6366f1', desc: '当前总付费客户数，反映业务规模' },
  arpu: { icon: DollarSign, color: '#14b8a6', desc: '每用户平均收入 = MRR ÷ 客户数，反映客户质量' },
  d30_retention: { icon: Activity, color: '#8b5cf6', desc: '新用户注册后第 30 天仍在使用的比例' },
  expansion_mrr: { icon: TrendingUp, color: '#22c55e', desc: '存量客户升级/增购带来的 MRR 增量' },
}

// 指标词典（统一口径抽屉）
export const METRIC_DICTIONARY = [
  { key: 'mrr', label: 'MRR', fullName: '月度经常性收入 (Monthly Recurring Revenue)', formula: '当月所有付费客户的月费总和 = Σ(客户月费)', business: '衡量 SaaS 业务核心收入水平，是最重要的经营指标。MRR 增长 = 新客户 MRR + 扩展 MRR - 流失 MRR - 收缩 MRR', unit: '万元' },
  { key: 'arr', label: 'ARR', fullName: '年化经常性收入 (Annual Recurring Revenue)', formula: 'MRR × 12', business: '年度收入规模的快照指标，常用于估值和年度规划', unit: '万元' },
  { key: 'nrr', label: 'NRR', fullName: '净收入留存率 (Net Revenue Retention)', formula: '(期初 MRR + 扩展 MRR - 收缩 MRR - 流失 MRR) ÷ 期初 MRR × 100%', business: '衡量存量客户收入增长能力。>100% 表示老客户收入在增长（负流失），<100% 表示老客户收入在萎缩', unit: '%' },
  { key: 'churn_rate', label: '流失率', fullName: '客户流失率 (Churn Rate)', formula: '当月流失客户数 ÷ (月初总客户数) × 100%', business: '衡量客户留存能力。SaaS 行业健康值 < 3%/月。流失率上升意味着产品价值或服务出了问题', unit: '%' },
  { key: 'new_customers', label: '新增客户', fullName: '新增付费客户数', formula: '当月新签约并完成首次付费的客户数量', business: '衡量获客能力。需要结合 CAC 来看，获客成本过高则增长质量不佳', unit: '个' },
  { key: 'dau', label: 'DAU', fullName: '日活跃用户数 (Daily Active Users)', formula: '当日至少完成一次核心操作（登录/使用功能）的独立用户数', business: '衡量产品每日使用规模，反映用户对产品的依赖程度。周末通常会下降', unit: '人' },
  { key: 'd7_retention', label: 'D7 留存', fullName: '7日留存率', formula: '新注册用户中，第 7 天仍活跃的人数 ÷ 新注册总人数 × 100%', business: '衡量新用户 onboarding 效果。低 D7 留存意味着首次体验不好，用户来了就走', unit: '%' },
  { key: 'stickiness', label: '粘性', fullName: '用户粘性 (Stickiness)', formula: 'DAU ÷ MAU × 100%', business: '衡量用户使用频率和依赖度。典型 SaaS 粘性在 20-30%。越高说明用户越离不开产品', unit: '%' },
  { key: 'arpu', label: 'ARPU', fullName: '每用户平均收入', formula: 'MRR ÷ 总付费客户数', business: '衡量客户质量和定价策略。ARPU 增长可能来自涨价、客户升级或低端客户流失', unit: '元' },
  { key: 'd30_retention', label: 'D30 留存', fullName: '30日留存率', formula: '新注册用户中，第 30 天仍活跃的人数 ÷ 新注册总人数 × 100%', business: '衡量用户长期留存。是产品市场匹配 (PMF) 的关键指标，反映真正的产品价值', unit: '%' },
  { key: 'ltv', label: 'LTV', fullName: '客户生命周期价值 (Lifetime Value)', formula: 'ARPU × 平均客户生命周期（月）= ARPU × (1/流失率)', business: '衡量客户终生价值。LTV/CAC > 3 被认为是健康的 SaaS 指标', unit: '元' },
  { key: 'cac', label: 'CAC', fullName: '客户获取成本 (Customer Acquisition Cost)', formula: '总销售和营销费用 ÷ 新增客户数', business: '衡量获客效率。CAC 需要和 LTV 配合看，LTV/CAC > 3 才健康', unit: '元' },
  { key: 'expansion_mrr', label: '扩展 MRR', fullName: '扩展 MRR (Expansion MRR)', formula: '存量客户升级套餐或增购模块带来的 MRR 增量（不含新客户）', business: '衡量 upsell/cross-sell 效果，是推动 NRR 的核心因素', unit: '万元' },
]

// 行业基准
export const BENCHMARK = {
  nrr: { value: 100, label: '行业中位数', higherIsBetter: true },
  churn_rate: { value: 3, label: '行业健康线', higherIsBetter: false },
  d7_retention: { value: 40, label: '行业均值', higherIsBetter: true },
  stickiness: { value: 20, label: '行业均值', higherIsBetter: true },
  d30_retention: { value: 25, label: '行业均值', higherIsBetter: true },
}

// 关注指标
export const WATCHLIST_METRICS = [
  { key: 'mrr', label: 'MRR', unit: '万元', roles: ['manager', 'pm', 'analyst'] },
  { key: 'churn_rate', label: '客户流失率', unit: '%', roles: ['manager', 'pm', 'analyst'] },
  { key: 'nrr', label: 'NRR', unit: '%', roles: ['manager', 'pm', 'analyst'] },
  { key: 'arr', label: 'ARR', unit: '万元', roles: ['manager'] },
  { key: 'dau', label: 'DAU', unit: '人', roles: ['pm', 'analyst'] },
  { key: 'd7_retention', label: 'D7 留存率', unit: '%', roles: ['pm', 'analyst'] },
  { key: 'new_customers', label: '新增客户', unit: '个', roles: ['manager', 'pm', 'analyst'] },
  { key: 'stickiness', label: '粘性', unit: '%', roles: ['pm'] },
]

export const WATCHLIST_DEFAULTS = {
  manager: ['mrr', 'churn_rate', 'nrr', 'arr'],
  pm: ['dau', 'd7_retention', 'churn_rate', 'new_customers'],
  analyst: ['dau', 'd7_retention', 'churn_rate', 'mrr'],
}

// ChatBI 角色配置
export const ROLE_CONFIG = {
  manager: {
    label: '管理者',
    icon: null,
    color: 'violet',
    cssColor: '#7c3aed',
    guideScenarios: [
      { question: '这个月经营数据怎么样？', desc: '查看 KPI 和趋势' },
      { question: '最近 3 个月 MRR 的趋势如何？', desc: '趋势分析与预测' },
      { question: '哪个客户分层的流失率最高？', desc: '下钻分析根因' },
      { question: '生成经营分析周报', desc: '一键导出报告' },
    ],
    recommendedQuestions: [
      '这个月经营数据怎么样？',
      '最近 3 个月 MRR 的趋势如何？',
      '哪个客户分层的流失率最高？',
      '对比这个月和上个月的收入变化',
      '生成经营分析周报',
    ],
    placeholder: '输入你的问题，比如"这个月 MRR 怎么样？"',
    followUpPlaceholder: '继续提问，比如"各客户分层的收入分布如何？"',
    emptyTitle: '开始提问，探索你的数据',
    emptyDesc: '试试上面推荐的问题，或者输入你想了解的数据指标',
    reportLabel: '生成报告',
    reportTitle: '经营分析报告',
    pdfFilename: '经营分析报告',
    pdfDivId: 'chatbi-manager-content',
    features: { kpiCards: true, comparison: false, sqlPreview: false, dataTable: false, editableInsights: false, attribution: false, shareLink: false },
  },
  pm: {
    label: '产品经理',
    icon: null,
    color: 'blue',
    cssColor: '#3b82f6',
    guideScenarios: [
      { question: '新注册流程上线后，用户 7 日留存有没有变化？', desc: '对比分析' },
      { question: '最近 DAU 的趋势如何？', desc: '活跃度趋势' },
      { question: '不同渠道来的用户留存有差异吗？', desc: '分维度对比' },
      { question: '转化漏斗哪个环节流失最严重？', desc: '漏斗分析' },
    ],
    recommendedQuestions: [
      '新注册流程上线后，用户 7 日留存有没有变化？',
      '最近 DAU 的趋势如何？',
      '哪个功能的用户使用率最高？',
      '不同渠道来的用户留存有差异吗？',
      '转化漏斗哪个环节流失最严重？',
    ],
    placeholder: '输入问题，如"新注册流程上线后 7 日留存有没有变化？"',
    followUpPlaceholder: '继续提问，如"按渠道拆分留存数据看看"',
    emptyTitle: '开始分析你的产品数据',
    emptyDesc: '试试询问功能上线效果、用户留存变化或转化漏斗',
    reportLabel: '生成复盘报告',
    reportTitle: '产品分析报告',
    pdfFilename: '产品分析报告',
    pdfDivId: 'chatbi-pm-content',
    features: { kpiCards: false, comparison: true, sqlPreview: false, dataTable: false, editableInsights: false, attribution: false, shareLink: false },
  },
  analyst: {
    label: '数据分析师',
    icon: null,
    color: 'emerald',
    cssColor: '#10b981',
    guideScenarios: [
      { question: '帮我拉过去一个季度的 MRR、新增客户、流失率和 NRR', desc: '多指标取数' },
      { question: '对第 8 周流失率异常做归因分析', desc: '归因下钻' },
      { question: '按客户分层展示各指标数据', desc: '分维度取数' },
      { question: '生成经营分析周报', desc: '一键报告' },
    ],
    recommendedQuestions: [
      '帮我拉过去一个季度的 MRR、新增客户、流失率和 NRR',
      '对第 8 周流失率异常做归因分析',
      '生成经营分析周报',
      '按客户分层展示各指标数据',
      '最近 6 个月的 DAU 和留存趋势',
    ],
    placeholder: '输入取数需求或分析问题，如"拉过去一个季度的 MRR 数据"',
    followUpPlaceholder: '继续取数或分析...',
    emptyTitle: '用自然语言替代手写 SQL',
    emptyDesc: '试试上面的推荐查询，或者输入你的取数需求',
    reportLabel: '生成报告',
    reportTitle: '数据分析报告',
    pdfFilename: '数据分析报告',
    pdfDivId: 'chatbi-analyst-content',
    features: { kpiCards: false, comparison: false, sqlPreview: true, dataTable: true, editableInsights: true, attribution: true, shareLink: true },
  },
}

// 输入联想场景
export const SCENARIOS = [
  { keywords: ['mrr', '收入', '经营', 'arr', 'nrr'], questions: ['这个月经营数据怎么样？', '最近 3 个月 MRR 的趋势如何？', '对比这个月和上个月的收入变化'] },
  { keywords: ['dau', '活跃', '用户', '使用'], questions: ['最近 DAU 的趋势如何？', '哪个功能的用户使用率最高？', '最近 6 个月的 DAU 和留存趋势'] },
  { keywords: ['流失', 'churn', 'churn_rate', '客户'], questions: ['哪个客户分层的流失率最高？', '流失率为什么上升？', '对第 8 周流失率异常做归因分析'] },
  { keywords: ['留存', 'retention', 'd7', 'd30'], questions: ['新注册流程上线后 7 日留存有没有变化？', '不同渠道来的用户留存有差异吗？', '最近 6 个月的 DAU 和留存趋势'] },
  { keywords: ['报告', '周报', 'report'], questions: ['生成经营分析周报', '生成产品分析周报', '生成数据分析报告'] },
  { keywords: ['漏斗', '转化', 'conversion'], questions: ['转化漏斗哪个环节流失最严重？', '各渠道的转化率对比'] },
  { keywords: ['分层', 'tier', '客户'], questions: ['按客户分层展示各指标数据', '哪个客户分层的流失率最高？', '各客户分层的收入分布如何？'] },
  { keywords: ['归因', 'attribution', '原因', '为什么'], questions: ['对第 8 周流失率异常做归因分析', '流失率为什么上升？', 'MRR 为什么上涨？'] },
]

// 归因下钻维度
export const ATTRIBUTION_DIMS = [
  { key: 'customer_tier', label: '按客户分层下钻' },
  { key: 'channel', label: '按渠道下钻' },
  { key: 'region', label: '按地区下钻' },
]

// 团队动态（模拟）
export const ACTIVITY_FEED = [
  { id: 'act-1', type: 'anomaly_detected', actor: { name: '王分析', role: '数据分析师', initials: '王' }, summary: '发现企业版客户流失率异常上升至 4.7%，已生成归因分析报告', reportId: 'mock-report-1', timestamp: '2026-05-25T08:30:00', relativeTime: '2 小时前' },
  { id: 'act-2', type: 'report_generated', actor: { name: '张总', role: 'VP', initials: '张' }, summary: '生成了本周经营分析周报，MRR 环比增长 3.2%', reportId: 'mock-report-2', timestamp: '2026-05-24T15:30:00', relativeTime: '昨天 15:30' },
  { id: 'act-3', type: 'analysis_completed', actor: { name: '李产品', role: '产品经理', initials: '李' }, summary: '完成了新注册流程 A/B 实验分析，D7 留存率提升 6.2pp', reportId: 'mock-report-3', timestamp: '2026-05-24T10:15:00', relativeTime: '昨天 10:15' },
  { id: 'act-4', type: 'anomaly_detected', actor: { name: '王分析', role: '数据分析师', initials: '王' }, summary: '检测到 D7 留存率连续 2 周缓慢下降，建议产品关注', timestamp: '2026-05-23T14:00:00', relativeTime: '2 天前' },
  { id: 'act-5', type: 'report_generated', actor: { name: '张总', role: 'VP', initials: '张' }, summary: '生成月度经营分析报告，NRR 整体健康但成都区域需关注', reportId: 'mock-report-4', timestamp: '2026-05-22T09:00:00', relativeTime: '3 天前' },
]

export const ACTIVITY_STYLES = {
  report_generated: { icon: FileText, bg: 'bg-brand-50', color: 'text-brand-500' },
  anomaly_detected: { icon: ShieldAlert, bg: 'bg-red-50', color: 'text-red-500' },
  analysis_completed: { icon: TrendingUp, bg: 'bg-emerald-50', color: 'text-emerald-500' },
}

// 帮助中心内容
export const QUICK_START = [
  { num: 1, title: '登录', desc: '使用预设 Demo 账号登录系统' },
  { num: 2, title: '选择角色', desc: '在 Dashboard 选择你的分析视角' },
  { num: 3, title: '输入问题', desc: '用自然语言描述你想了解的数据' },
  { num: 4, title: '查看结果', desc: '图表 + AI 洞察 + 策略建议一键呈现' },
]

export const ROLE_GUIDES = [
  {
    role: '管理者视角',
    icon: TrendingUp,
    color: 'violet',
    path: '/manager',
    intro: '适合 CEO、VP、总监等管理者，聚焦经营数据全景和决策支持。',
    examples: [
      { q: '这个月经营数据怎么样？', r: '返回 MRR/ARR/NRR/流失率 KPI + 趋势图 + AI 解读' },
      { q: '哪个客户分层流失率最高？', r: '下钻分析各客户层级流失差异并定位根因' },
      { q: '生成经营分析周报', r: '自动生成包含图表、洞察、建议的完整报告' },
      { q: '最近 3 个月 MRR 趋势如何？', r: '折线图展示 MRR 变化，标注关键拐点' },
    ],
  },
  {
    role: '产品经理视角',
    icon: ChartColumn,
    color: 'blue',
    path: '/pm',
    intro: '适合产品经理，聚焦功能效果评估、用户行为分析和对比实验。',
    examples: [
      { q: '新注册流程上线后 7 日留存有没有变化？', r: '对比分析 + t 检验 + 显著性结论' },
      { q: '最近 DAU 的趋势如何？', r: 'DAU/MAU 趋势图 + 粘性分析' },
      { q: '不同渠道来的用户留存有差异吗？', r: '按渠道维度拆分留存率对比' },
      { q: '转化漏斗哪个环节流失最严重？', r: '转化率逐层分析，定位流失环节' },
    ],
  },
  {
    role: '数据分析师视角',
    icon: Microscope,
    color: 'emerald',
    path: '/analyst',
    intro: '适合数据分析师，聚焦高效取数、归因分析和报告编辑导出。',
    examples: [
      { q: '帮我拉过去一个季度的 MRR、新增客户、流失率和 NRR', r: '多指标取数 + 图表表格并排展示 + SQL 预览' },
      { q: '对第 8 周流失率异常做归因分析', r: '多维度逐层下钻，定位异常根因' },
      { q: '生成经营分析周报', r: '一键生成报告，可编辑 AI 洞察后导出 PDF' },
      { q: '按客户分层展示各指标数据', r: '按维度分组聚合，支持排序过滤' },
    ],
  },
]

export const FAQ = [
  { q: '数据是真实的吗？', a: '当前 V1 Demo 使用 12 个月模拟数据（2025-06 至 2026-05）。数据设计有真实起伏和异常点（如第 8 个月企业版流失率异常上升），用于验证分析能力。' },
  { q: '可以连接真实数据库吗？', a: 'V2 计划支持连接真实数据源（PostgreSQL、MySQL、ClickHouse 等），通过语义层映射实现零 SQL 查询。' },
  { q: '支持哪些图表类型？', a: '折线图（趋势分析）、柱状图（分组对比）、饼图（占比分布）、散点图（相关性），系统会根据查询意图和数据特征自动选择最合适的图表类型。' },
  { q: 'AI 分析使用什么模型？', a: '意图识别和洞察生成使用 DeepSeek V4 Flash（快速响应），策略建议使用 DeepSeek V4 Pro（深度推理）。所有 AI 调用均为流式输出，首字延迟 < 3 秒。' },
  { q: '语义层是什么？', a: '语义层是业务指标和底层数据的映射层。比如用户说"收入"，系统通过语义层知道这对应 MRR 指标。语义层中的指标、别名、维度都可以在"语义层管理"页面中配置。' },
  { q: '支持多少种指标？', a: `当前内置 ${Object.keys(METRICS).length} 个 SaaS 行业标准指标，涵盖经营类（MRR、ARR、NRR、LTV、CAC、流失率等）和产品类（DAU、MAU、留存率、粘性等），以及 5 个分析维度。` },
]

export { Search, Database, Sparkles, MessageSquare, Lightbulb, Globe, Bell, LayoutDashboard, Code, Layers }
