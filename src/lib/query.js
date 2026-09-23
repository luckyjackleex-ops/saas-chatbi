import { METRICS } from './metrics.js'
import { monthRange, monthlyFinancial, monthlyProduct } from './data.js'

const FIN = monthlyFinancial()
const PROD = monthlyProduct()

export function toWan(v) {
  return Number((v / 1e4).toFixed(2))
}

export function categoryOf(key) {
  return METRICS[key]?.category ?? '经营'
}

export function inRange(month, range) {
  return month >= range.start && month <= range.end
}

export function valueAt(record, key) {
  if (key === 'd7_retention') return record.retention?.d7 ?? null
  if (key === 'd30_retention') return record.retention?.d30 ?? null
  return key in record ? record[key] : null
}

export function expandRange(range) {
  const months = monthRange('2025-06', '2026-05')
  const s = months.indexOf(range.start)
  const e = months.indexOf(range.end)
  if (s === -1 || e === -1) return range
  if (e - s <= 2) {
    const ns = Math.max(0, s - 3)
    const ne = Math.min(months.length - 1, e + 3)
    return { start: months[ns], end: months[ne] }
  }
  return range
}

function momYoy(key, month, dataset) {
  const rec = dataset.find((d) => d.month === month)
  if (!rec) return { mom: null, yoy: null }
  const current = valueAt(rec, key)
  if (typeof current !== 'number') return { mom: null, yoy: null }
  const [y, m] = month.split('-').map(Number)
  let pm = m - 1
  let py = y
  if (pm < 1) {
    pm = 12
    py--
  }
  const prevMonth = `${py}-${String(pm).padStart(2, '0')}`
  const prevRec = dataset.find((d) => d.month === prevMonth)
  let mom = null
  if (prevRec) {
    const pv = valueAt(prevRec, key)
    if (typeof pv === 'number' && pv !== 0) mom = { value: pv, change: Number((((current - pv) / pv) * 100).toFixed(1)) }
  }
  let yoy = null
  if (y === 2026) {
    const lastYear = `2025-${String(m).padStart(2, '0')}`
    const lr = dataset.find((d) => d.month === lastYear)
    if (lr) {
      const lv = valueAt(lr, key)
      if (typeof lv === 'number' && lv !== 0) yoy = { value: lv, change: Number((((current - lv) / lv) * 100).toFixed(1)) }
    }
  }
  return { mom, yoy }
}

// 执行结构化查询，返回 results 数组
export function executeQuery(query) {
  const out = []
  const range = expandRange(query.timeRange)
  const chartType = query.chartType
  for (const key of query.metrics) {
    const metric = METRICS[key]
    if (!metric) continue
    const category = categoryOf(key)
    const dataset = (category === '经营' ? FIN : PROD).filter((d) => inRange(d.month, range))
    const dimension = query.dimensions.length > 0 ? query.dimensions[0] : 'month'
    if (dimension === 'customer_tier') {
      const acc = { enterprise: 0, mid_market: 0, smb: 0 }
      let count = 0
      for (const d of dataset) {
        const tiers = d.customer_tiers
        if (tiers) {
          for (const [tk, tv] of Object.entries(tiers)) {
            if (['mrr', 'arr', 'expansion_mrr', 'contraction_mrr'].includes(key)) acc[tk] += tv.mrr
            else if (['churn_rate', 'churned_customers', 'new_customers'].includes(key)) acc[tk] += tv.count
            else acc[tk] += tv.mrr
          }
          count++
        }
      }
      const labels = { enterprise: '企业版', mid_market: '中端', smb: '小微企业' }
      out.push({
        metric: key,
        metricLabel: metric.label,
        dimension,
        data: Object.entries(acc).map(([k, v]) => ({
          label: labels[k] || k,
          value: metric.unit === '万元' ? toWan(count > 0 ? v / count : v) : count > 0 ? Number((v / count).toFixed(2)) : v,
        })),
        chartType: chartType || metric.chartType,
        unit: metric.unit,
      })
    } else {
      const data = dataset.map((d) => {
        let v = 0
        const val = valueAt(d, key)
        if (typeof val === 'number') v = val
        return { label: d.month, value: metric.unit === '万元' ? toWan(v) : Number(v.toFixed(2)), month: d.month }
      })
      const comparison = momYoy(key, query.timeRange.end, category === '经营' ? FIN : PROD)
      out.push({
        metric: key,
        metricLabel: metric.label,
        dimension,
        data,
        chartType: chartType || metric.chartType,
        unit: metric.unit,
        comparison,
      })
    }
  }
  return out
}

// KPI 卡片（ChatBI 管理者视角）
export function kpiCards() {
  const latest = FIN[FIN.length - 1]
  const prev = FIN[FIN.length - 2]
  function pct(a, b) {
    return b === 0 ? 0 : Number((((a - b) / b) * 100).toFixed(1))
  }
  return [
    { label: 'MRR', value: toWan(latest.mrr).toFixed(1), unit: '万元', change: pct(latest.mrr, prev.mrr), sparkline: FIN.map((d) => toWan(d.mrr)) },
    { label: 'ARR', value: toWan(latest.arr).toFixed(0), unit: '万元', change: pct(latest.arr, prev.arr), sparkline: FIN.map((d) => toWan(d.arr) / 10) },
    { label: 'NRR', value: latest.nrr.toFixed(1), unit: '%', change: pct(latest.nrr, prev.nrr), sparkline: FIN.map((d) => d.nrr) },
    { label: '流失率', value: latest.churn_rate.toFixed(1), unit: '%', change: pct(latest.churn_rate, prev.churn_rate), sparkline: FIN.map((d) => d.churn_rate) },
  ]
}

export function monthlySeries() {
  return FIN.map((d) => ({
    month: d.month,
    mrr: toWan(d.mrr),
    arr: toWan(d.arr),
    nrr: d.nrr,
    churn: d.churn_rate,
    newCustomers: d.new_customers,
    expansionMRR: toWan(d.expansion_mrr),
  }))
}

// 指标 sparkline 数据
export function sparkData(key, fin, prod) {
  const f = (fin || []).slice(-7)
  const p = (prod || []).slice(-7)
  switch (key) {
    case 'mrr': return f.map((d) => Number(((d?.mrr ?? 0) / 1e4).toFixed(1)))
    case 'arr': return f.map((d) => Number(((d?.arr ?? 0) / 1e4).toFixed(0)))
    case 'nrr': return f.map((d) => Number((d?.nrr ?? 0).toFixed?.(1) ?? (d?.nrr ?? 0)))
    case 'churn_rate': return f.map((d) => Number((d?.churn_rate ?? 0).toFixed?.(1) ?? (d?.churn_rate ?? 0)))
    case 'new_customers': return f.map((d) => d?.new_customers ?? 0)
    case 'dau': return p.map((d) => d?.dau ?? 0)
    case 'd7_retention': return p.map((d) => d?.d7_retention ?? d?.retention?.d7 ?? 0)
    case 'stickiness': return p.map((d) => d?.stickiness ?? 0)
    default: return []
  }
}
