// 时间工具
export function monthRange(start, end) {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  const out = []
  let y = sy
  let m = sm
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return out
}

// 确定性伪随机数（与原始站点一致）
export function seeded(n) {
  const t = Math.sin(n * 9301 + 49297) * 49297
  return t - Math.floor(t)
}

function dayRange(start, end) {
  const out = []
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    out.push(`${y}-${m}-${d}`)
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

// 月度经营数据（2024-07 ~ 2026-06）
export function monthlyFinancial() {
  const months = monthRange('2024-07', '2026-06')
  return months.map((month, n) => {
    const r = (e) => seeded(n * 13 + e)
    const i = n / months.length
    const a = Math.sin(((n - 3) * Math.PI) / 6) * 18000
    const o = -Math.abs(Math.sin(((n - 7) * Math.PI) / 6)) * 8000
    const s = 2200000 + i * 780000 + a + o + Math.sin(n * 0.55) * 12000
    const c = n >= 14 ? 45000 + (n - 14) * 3000 : 0
    const l = n >= 20 ? (n - 19) * 8000 : 0
    const u = Math.round(s + c + l)
    const d = Math.round(u * (0.018 + i * 0.015 + r(1) * 0.025))
    const f = Math.round(u * (0.004 + r(2) * 0.012))
    const p = 38 + Math.floor(n * 2.5 + r(3) * 4)
    const m = Math.round(u * (0.42 + i * 0.08) + r(4) * 25000)
    const h = 105 + Math.floor(n * 3.5 + r(5) * 7)
    const g = Math.round(u * 0.36 + r(6) * 18000)
    const _ = 250 + Math.floor(n * 4.5 + r(7) * 12)
    const v = Math.round(u * (0.22 - i * 0.06) + r(8) * 8000)
    const y = p + h + _
    const b = Math.round(y * (0.035 + r(9) * 0.025))
    const x = n === 10
    const S = 2 - i * 0.8
    const C = x ? 5.1 : n === 20 ? 1.3 : S + (r(11) - 0.5) * 0.3
    const w = 3.2 - i * 0.5
    const T = x ? 4.6 : w + (r(12) - 0.5) * 0.4
    const E = 5.5 - i * 0.3 + (r(13) - 0.5) * 0.5
    const D = Number(((C * p + T * h + E * _) / y).toFixed(2))
    const O = Math.round((y * D) / 100)
    const k = Number(
      (100 + ((d - f) / u) * 100 - D * 0.25 - (r(14) - 0.5) * 1.5).toFixed(1),
    )
    const A = u / y
    const j = 12 / Math.max(D / 100, 0.01)
    const M = Math.round(A * j)
    const N = Math.round(M * (0.25 + r(16) * 0.08))
    const P = Number((73 + r(17) * 5).toFixed(1))
    const F = Math.round(u / y)
    return {
      month,
      mrr: u,
      arr: Math.round(u * 12 * (0.96 + r(19) * 0.08)),
      new_customers: b,
      churned_customers: O,
      churn_rate: D,
      nrr: k,
      ltv: M,
      cac: N,
      gross_margin: P,
      avg_revenue_per_user: F,
      expansion_mrr: d,
      contraction_mrr: f,
      customer_tiers: {
        enterprise: { count: p, mrr: m },
        mid_market: { count: h, mrr: g },
        smb: { count: _, mrr: v },
      },
    }
  })
}

// 月度产品数据
export function monthlyProduct() {
  return monthRange('2024-07', '2026-06').map((month, t) => {
    const n = (e) => seeded(t * 17 + e)
    const r = Math.abs(Math.sin(((t - 2) * Math.PI) / 6)) * 300
    const i = t >= 15 && t <= 17 ? 600 + (t - 15) * 300 : 0
    const a = t >= 20 ? 1200 + (t - 20) * 400 : 0
    const o = 9000 + t * 520 + Math.sin(t * 0.5) * 600 - r + a + i
    const s = Math.round(o)
    const c = Math.round(s * (0.2 + t * 0.003 + n(1) * 0.05))
    const l = Number(((c / s) * 100).toFixed(1))
    const u = 34.5 + t * 0.25 + (n(3) - 0.5) * 1
    const d = 40.8 + (t - 20) * 0.6 + (n(3) - 0.5) * 1.2
    const f = Number((t >= 20 ? d : u).toFixed(1))
    const p = Number((60 + (f - 34) * 1.7 + (n(2) - 0.5) * 2.5).toFixed(1))
    const m = Number((f * 0.7 + (n(4) - 0.5) * 1.8).toFixed(1))
    return {
      month,
      dau: c,
      mau: s,
      stickiness: l,
      d7_retention: f,
      d30_retention: m,
      d1_retention: p,
      feature_usage: {
        项目管理: Math.round(s * (0.42 + t * 0.005 + n(5) * 0.08)),
        数据分析: Math.round(s * (0.28 + t * 0.008 + n(6) * 0.06)),
        团队协作: Math.round(s * (0.5 + n(7) * 0.08)),
        自动化工作流: Math.round(s * (0.2 + t * 0.005 + n(8) * 0.06)),
        报表导出: Math.round(s * (0.35 + n(9) * 0.06)),
        API集成: Math.round(s * (0.14 + t * 0.003 + n(10) * 0.04)),
      },
      funnel: {
        visit_to_signup: Number((17.5 + n(11) * 3.5).toFixed(1)),
        signup_to_activation: Number((40 + t * 0.3 + n(12) * 6).toFixed(1)),
        activation_to_payment: Number(
          t >= 20
            ? (9.2 + n(13) * 1.6).toFixed(1)
            : (5.8 + Math.min(t / 20, 1) * 1.2 + n(13) * 1.2).toFixed(1),
        ),
      },
      retention: { d1: p, d7: f, d30: m },
    }
  })
}

// 日度经营数据（近 180 天，截至 2026-05-26）
export function dailyFinancial() {
  const end = new Date('2026-05-26')
  const start = new Date(end)
  start.setDate(start.getDate() - 179)
  const days = dayRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0])
  return days.map((date, t) => {
    const n = (e) => seeded(t * 47 + e)
    const r = t / days.length
    const dow = new Date(date).getDay()
    const weekend = dow === 0 || dow === 6
    const s = Math.sin(r * Math.PI * 2.5) * 6000
    const c = 2840000 + r * 140000 + s
    const l = Math.round(c * (weekend ? 0.994 : 1))
    const u = /-2[89]|-30|-31$/.test(date)
    const d = date === '2026-03-15' || date === '2026-05-10'
    const f = Math.round((20 + n(1) * 8) * (u ? 1.7 : 1) * (d ? 2.2 : 1) * (weekend ? 0.55 : 1))
    const p = Number((2.6 - r * 0.3 + n(2) * 0.6 + (u ? -0.15 : 0)).toFixed(2))
    const m = Math.round(p * 3.2 + n(3) * 2)
    const h = Math.round(l * (0.001 + n(4) * 0.0012))
    const g = Math.round(l * (0.00025 + n(5) * 0.0004))
    const _ = Number(
      (100 + ((h - g) / l) * 100 - p * 0.4 + (n(14) - 0.5) * 0.8).toFixed(1),
    )
    const v = Math.round(l * 12)
    const y = Math.round(f * (0.18 + r * 0.05 + n(6) * 0.06))
    const b = Math.round(f * (0.12 + n(7) * 0.05))
    const x = Math.round(f * (0.08 + r * 0.03 + n(8) * 0.03))
    return {
      date,
      mrr: l,
      new_customers: f,
      churned_customers: m,
      churn_rate: p,
      expansion_mrr: h,
      contraction_mrr: g,
      nrr: _,
      arr: v,
      channels: { paid: y, organic: f - y - b - x, referral: b, partner: x },
    }
  })
}

// 日度产品数据
export function dailyProduct() {
  const end = new Date('2026-05-26')
  const start = new Date(end)
  start.setDate(start.getDate() - 179)
  const days = dayRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0])
  return days.map((date, t) => {
    const n = (e) => seeded(t * 53 + e)
    const r = t / days.length
    const dow = new Date(date).getDay()
    const weekend = dow === 0 || dow === 6
    const s = 16000 + r * 5000 + Math.sin(r * Math.PI * 2) * 400
    const c = Math.round(s)
    const l = Math.round(c * (0.24 + r * 0.02 + n(1) * 0.03) * (weekend ? 0.82 : 1))
    const u = Number(((l / c) * 100).toFixed(1))
    const d = Number(
      (date >= '2026-02-15' ? 42.5 + n(2) * 1.8 : 37.5 + n(2) * 1.2).toFixed(1),
    )
    return {
      date,
      dau: l,
      mau: c,
      stickiness: u,
      d7_retention: d,
      d30_retention: Number((d * 0.71 + n(3) * 0.9).toFixed(1)),
      new_signups: Math.round((130 + n(4) * 35) * (weekend ? 0.65 : 1)),
      featureDetail: {
        dashboard: Math.round(l * (0.55 + n(5) * 0.08)),
        reports: Math.round(l * (0.32 + n(6) * 0.06)),
        collaboration: Math.round(l * (0.48 + n(7) * 0.07)),
        automation: Math.round(l * (0.22 + r * 0.06 + n(8) * 0.05)),
      },
    }
  })
}

// 快照汇总
export function summarySnapshot() {
  const fin = dailyFinancial()
  const prod = dailyProduct()
  const n = fin[fin.length - 1]
  const r = fin[fin.length - 8]
  const i = prod[prod.length - 1]
  const a = prod[prod.length - 8]
  return {
    date: n.date,
    financial: {
      mrr: { value: n.mrr, change: r ? Number((((n.mrr - r.mrr) / r.mrr) * 100).toFixed(1)) : 0 },
      arr: { value: n.arr, prev: r?.arr || n.arr },
      newCustomers: { value: n.new_customers, prev: r?.new_customers || n.new_customers },
      churnRate: { value: n.churn_rate, change: r ? Number((n.churn_rate - r.churn_rate).toFixed(1)) : 0 },
      nrr: { value: n.nrr, prev: r?.nrr || n.nrr },
    },
    product: {
      dau: { value: i.dau, prev: a?.dau || i.dau },
      stickiness: { value: i.stickiness, prev: a?.stickiness || i.stickiness },
      d7Retention: { value: i.d7_retention, prev: a?.d7_retention || i.d7_retention },
      newSignups: { value: i.new_signups, prev: a?.new_signups || i.new_signups },
    },
    last7Days: fin.slice(-7).map((e) => ({
      date: e.date.substring(5),
      mrr: Math.round((e.mrr / 1e4) * 10) / 10,
      newCustomers: e.new_customers,
    })),
    last30Days: fin.slice(-30).map((e) => ({
      date: e.date.substring(5),
      mrr: Math.round((e.mrr / 1e4) * 10) / 10,
      churnRate: e.churn_rate,
    })),
  }
}

// 城市
const cityWeights = [
  { name: '北京', lng: 116.4, lat: 39.9, weight: 1 },
  { name: '上海', lng: 121.47, lat: 31.23, weight: 1.3 },
  { name: '深圳', lng: 114.07, lat: 22.62, weight: 0.75 },
  { name: '杭州', lng: 120.15, lat: 30.28, weight: 0.6 },
  { name: '广州', lng: 113.26, lat: 23.13, weight: 0.65 },
  { name: '成都', lng: 104.07, lat: 30.67, weight: 0.4 },
  { name: '武汉', lng: 114.3, lat: 30.6, weight: 0.28 },
  { name: '南京', lng: 118.78, lat: 32.07, weight: 0.35 },
  { name: '西安', lng: 108.93, lat: 34.27, weight: 0.22 },
  { name: '重庆', lng: 106.55, lat: 29.57, weight: 0.3 },
  { name: '长沙', lng: 112.97, lat: 28.23, weight: 0.2 },
  { name: '厦门', lng: 118.08, lat: 24.48, weight: 0.18 },
  { name: '青岛', lng: 120.38, lat: 36.07, weight: 0.16 },
  { name: '新加坡', lng: 103.82, lat: 1.35, weight: 0.15 },
  { name: '东京', lng: 139.69, lat: 35.69, weight: 0.08 },
]

// 地图城市数据（世界地图用）
export const mapCities = [
  { name: '北京', lng: 116.4, lat: 39.9, customers: 234, arr: 5600000, nrr: 108 },
  { name: '上海', lng: 121.47, lat: 31.23, customers: 312, arr: 7800000, nrr: 112 },
  { name: '深圳', lng: 114.07, lat: 22.62, customers: 178, arr: 4200000, nrr: 105 },
  { name: '杭州', lng: 120.15, lat: 30.28, customers: 145, arr: 3400000, nrr: 115 },
  { name: '广州', lng: 113.26, lat: 23.13, customers: 156, arr: 3700000, nrr: 110 },
  { name: '成都', lng: 104.07, lat: 30.67, customers: 89, arr: 1800000, nrr: 98 },
  { name: '武汉', lng: 114.3, lat: 30.6, customers: 65, arr: 1420000, nrr: 103 },
  { name: '南京', lng: 118.78, lat: 32.07, customers: 78, arr: 1680000, nrr: 109 },
  { name: '西安', lng: 108.93, lat: 34.27, customers: 48, arr: 980000, nrr: 96 },
  { name: '重庆', lng: 106.55, lat: 29.57, customers: 68, arr: 1350000, nrr: 101 },
  { name: '长沙', lng: 112.97, lat: 28.23, customers: 42, arr: 860000, nrr: 100 },
  { name: '厦门', lng: 118.08, lat: 24.48, customers: 38, arr: 750000, nrr: 107 },
  { name: '青岛', lng: 120.38, lat: 36.07, customers: 35, arr: 680000, nrr: 104 },
  { name: '新加坡', lng: 103.82, lat: 1.35, customers: 45, arr: 1200000, nrr: 118 },
  { name: '东京', lng: 139.69, lat: 35.69, customers: 28, arr: 680000, nrr: 95 },
]

// 城市分析数据
export function cityAnalytics() {
  const total = cityWeights.reduce((s, c) => s + c.weight, 0)
  return cityWeights.map((t) => {
    const n = t.weight / total
    const r = 0.85 + seeded(t.lng * 7 + t.lat * 13) * 0.3
    const i = Math.round(1350 * n * r)
    const a = Math.round(2980000 * n * r)
    const o = Math.round(5200 * n * r)
    const s = Math.round(25 * n * r)
    const c = Number((2.6 * (1 + (0.5 - seeded(t.lng * 3)) * 0.4)).toFixed(1))
    const l = Number((43.2 * (0.9 + seeded(t.lat * 5) * 0.2)).toFixed(1))
    const u = Number((31.5 * (0.9 + seeded(t.lng * 2) * 0.2)).toFixed(1))
    const d = Number((107.8 + (seeded(t.lat * 11) - 0.5) * 16).toFixed(1))
    const f = 0.1 + n * 0.15
    const p = 0.25 + n * 0.1
    const m = 1 - f - p
    return {
      city: t.name,
      lng: t.lng,
      lat: t.lat,
      mrr: a,
      arr: Math.round(a * 12),
      nrr: d,
      churnRate: c,
      newCustomers: s,
      totalCustomers: i,
      dau: o,
      d7Retention: l,
      d30Retention: u,
      arpu: Math.round(a / i),
      enterpriseCustomers: Math.round(i * f),
      midMarketCustomers: Math.round(i * p),
      smbCustomers: Math.round(i * m),
    }
  })
}

// 客户分层
export function customerTiers() {
  return [
    {
      tierKey: 'enterprise',
      tierName: '企业版',
      description: '月费 > ¥5,000',
      color: '#7c3aed',
      customers: 215,
      mrr: 1492000,
      arr: 17904000,
      nrr: 109.5,
      churnRate: 1.8,
      arpu: 6940,
      dau: 1560,
      d7Retention: 49.2,
      d30Retention: 39.5,
      newCustomers: 4,
      expansionMRR: 35000,
    },
    {
      tierKey: 'mid_market',
      tierName: '中端版',
      description: '月费 ¥1,000-5,000',
      color: '#3b82f6',
      customers: 490,
      mrr: 1146000,
      arr: 13752000,
      nrr: 113.8,
      churnRate: 2.2,
      arpu: 2339,
      dau: 2184,
      d7Retention: 44.1,
      d30Retention: 32.8,
      newCustomers: 12,
      expansionMRR: 22000,
    },
    {
      tierKey: 'smb',
      tierName: '小微企业',
      description: '月费 < ¥1,000',
      color: '#10b981',
      customers: 645,
      mrr: 342000,
      arr: 4104000,
      nrr: 97.2,
      churnRate: 5.5,
      arpu: 530,
      dau: 1456,
      d7Retention: 36.5,
      d30Retention: 23.2,
      newCustomers: 9,
      expansionMRR: 4800,
    },
  ]
}

// 周度汇总
export function weeklyData() {
  const fin = dailyFinancial()
  const prod = dailyProduct()
  const map = new Map()
  function weekStart(d) {
    const t = new Date(d)
    const n = t.getDay()
    const r = t.getDate() - n + (n === 0 ? -6 : 1)
    return new Date(t.setDate(r)).toISOString().split('T')[0]
  }
  for (const d of fin) {
    const w = weekStart(d.date)
    if (!map.has(w)) map.set(w, { fin: [], prod: [] })
    map.get(w).fin.push(d)
  }
  for (const d of prod) {
    const w = weekStart(d.date)
    if (map.has(w)) map.get(w).prod.push(d)
  }
  return Array.from(map.entries())
    .map(([w, { fin, prod }]) => {
      const fn = fin.length || 1
      const pn = prod.length || 1
      const a = Math.round(fin.reduce((s, e) => s + e.mrr, 0) / fn)
      const d = new Date(w)
      d.setDate(d.getDate() + 6)
      return {
        week: w.substring(5),
        startDate: w,
        endDate: d.toISOString().split('T')[0],
        mrr: a,
        arr: Math.round(a * 12),
        nrr: Number((fin.reduce((s, e) => s + e.nrr, 0) / fn).toFixed(1)),
        churnRate: Number((fin.reduce((s, e) => s + e.churn_rate, 0) / fn).toFixed(2)),
        newCustomers: fin.reduce((s, e) => s + e.new_customers, 0),
        dau: Math.round(prod.reduce((s, e) => s + e.dau, 0) / pn),
        d7Retention: Number((prod.reduce((s, e) => s + e.d7_retention, 0) / pn).toFixed(1)),
        d30Retention: Number((prod.reduce((s, e) => s + e.d30_retention, 0) / pn).toFixed(1)),
        stickiness: Number((prod.reduce((s, e) => s + e.stickiness, 0) / pn).toFixed(1)),
      }
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export function nrrColor(v) {
  return v > 105 ? '#7c3aed' : v >= 100 ? '#10b981' : v >= 95 ? '#f59e0b' : '#ef4444'
}

export function nrrLabel(v) {
  return v > 105 ? '健康增长' : v >= 100 ? '稳定' : v >= 95 ? '需关注' : '流失风险'
}
