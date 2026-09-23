export const PALETTE = [
  '#7c3aed',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
]

const ABSOLUTE = new Set(['mrr', 'arr', 'dau', 'mau', 'expansion_mrr', 'avg_revenue_per_user'])
const BAR = new Set(['new_customers', 'churned_customers', 'cac', 'ltv', 'churn_rate'])
const LINE = new Set(['nrr', 'd7_retention', 'd30_retention', 'stickiness', 'gross_margin'])

export function inferChartType(results) {
  if (results.length === 0) return 'bar'
  const first = results[0]
  if (
    first.dimension &&
    ['customer_tier', 'channel', 'region', 'plan_type'].includes(first.dimension) &&
    first.data.length <= 6
  )
    return 'pie'
  const key = first.metric || ''
  if (ABSOLUTE.has(key)) return 'area'
  if (BAR.has(key)) return 'bar'
  if (LINE.has(key)) return 'line'
  return first.chartType || 'line'
}

function yAxis(values, unit) {
  let min = Math.min(...values)
  let max = Math.max(...values)
  const span = max - min
  const mid = (min + max) / 2
  const ratio = mid > 0 ? span / mid : 1
  let lo, hi
  if (span === 0) {
    lo = min * 0.9
    hi = max * 1.1
  } else if (ratio < 0.2) {
    lo = min - span * 0.4
    hi = max + span * 0.4
  } else {
    lo = min - span * 0.1
    if (lo < 0 && min >= 0) lo = 0
    hi = max + span * 0.1
  }
  return {
    type: 'value',
    name: unit,
    min: Number(lo.toFixed(2)),
    max: Number(hi.toFixed(2)),
    nameTextStyle: { color: '#94a3b8', fontSize: 11 },
    splitLine: { lineStyle: { color: '#f1f5f9' } },
    axisLabel: { color: '#64748b', fontSize: 11 },
  }
}

export function mergeResults(results) {
  if (results.length <= 1) return { merged: [], standalone: results }
  const merged = []
  const used = new Set()
  for (let i = 0; i < results.length; i++) {
    if (used.has(i)) continue
    const group = [results[i]]
    used.add(i)
    for (let j = i + 1; j < results.length; j++) {
      if (used.has(j)) continue
      const a = results[i]
      const b = results[j]
      const sameDim = a.dimension === b.dimension
      const sameLen = a.data.length === b.data.length
      const notTier = a.dimension !== 'customer_tier' && b.dimension !== 'customer_tier'
      if (sameDim && sameLen && notTier) {
        group.push(b)
        used.add(j)
      }
    }
    if (group.length > 1) merged.push({ results: group, label: group.map((r) => r.metricLabel).join(' / ') })
  }
  const standalone = results.filter((r, i) => !used.has(i) && !merged.some((m) => m.results.includes(results[i])))
  for (let i = 0; i < results.length; i++) if (!used.has(i)) standalone.push(results[i])
  return { merged, standalone }
}

export function singleChart(result, type) {
  const t = type ?? inferChartType([result])
  const labels = result.data.map((d) => d.label)
  const values = result.data.map((d) => d.value)
  const tooltip = {
    trigger: 'axis',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    textStyle: { color: '#1e293b', fontSize: 13 },
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    formatter: (params) => {
      const p = Array.isArray(params) ? params[0] : params
      return `<div style="font-size:13px">${p.name}<br/><strong>${p.value.toLocaleString()} ${result.unit}</strong></div>`
    },
  }
  if (t === 'pie') {
    return {
      tooltip: { trigger: 'item', backgroundColor: '#ffffff', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      series: [
        {
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 6, borderColor: '#ffffff', borderWidth: 3 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' }, scaleSize: 8 },
          data: result.data.map((d, i) => ({ name: d.label, value: d.value, itemStyle: { color: PALETTE[i % PALETTE.length] } })),
        },
      ],
    }
  }
  if (t === 'bar') {
    return {
      tooltip,
      grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
      color: PALETTE,
      xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false }, axisLabel: { color: '#64748b', fontSize: 11, rotate: labels.length > 8 ? 30 : 0 } },
      yAxis: yAxis(values, result.unit),
      series: [{ type: 'bar', data: values.map((v, i) => ({ value: v, itemStyle: { color: PALETTE[i % PALETTE.length], borderRadius: [6, 6, 0, 0] } })), barWidth: '50%' }],
    }
  }
  if (t === 'area') {
    return {
      tooltip,
      grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
      color: PALETTE,
      xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false }, axisLabel: { color: '#64748b', fontSize: 11 } },
      yAxis: yAxis(values, result.unit),
      series: [{ type: 'line', data: values, smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2.5, color: PALETTE[0] }, itemStyle: { color: PALETTE[0] }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: PALETTE[0] + '35' }, { offset: 1, color: PALETTE[0] + '05' }] } } }],
    }
  }
  return {
    tooltip,
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    color: PALETTE,
    xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false }, axisLabel: { color: '#64748b', fontSize: 11 } },
    yAxis: yAxis(values, result.unit),
    series: [{ type: 'line', data: values, smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2.5, color: PALETTE[0] }, itemStyle: { color: PALETTE[0] }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(124, 58, 237, 0.15)' }, { offset: 1, color: 'rgba(124, 58, 237, 0.02)' }] } } }],
  }
}

export function mergedChart(merged) {
  const labels = merged.results[0].data.map((d) => d.label)
  const multiUnit = new Set(merged.results.map((r) => r.unit)).size > 1
  const yAxes = multiUnit
    ? [
        { type: 'value', name: merged.results[0].unit, nameTextStyle: { color: '#94a3b8', fontSize: 11 }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#64748b', fontSize: 11 } },
        { type: 'value', name: merged.results[1]?.unit || '', nameTextStyle: { color: '#94a3b8', fontSize: 11 }, splitLine: { show: false }, axisLabel: { color: '#64748b', fontSize: 11 } },
      ]
    : [
        { type: 'value', name: merged.results.map((r) => r.unit).join(' / '), nameTextStyle: { color: '#94a3b8', fontSize: 11 }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#64748b', fontSize: 11 } },
      ]
  const series = merged.results.map((r, i) => ({
    name: r.metricLabel,
    type: 'line',
    data: r.data.map((d) => d.value),
    smooth: true,
    symbol: 'circle',
    symbolSize: 4,
    yAxisIndex: multiUnit && i > 0 ? 1 : 0,
    lineStyle: { width: 2.5, color: PALETTE[i % PALETTE.length] },
    itemStyle: { color: PALETTE[i % PALETTE.length] },
  }))
  return {
    tooltip: { trigger: 'axis', backgroundColor: '#ffffff', borderColor: '#e2e8f0', textStyle: { color: '#1e293b', fontSize: 13 } },
    legend: { data: merged.results.map((r) => r.metricLabel), textStyle: { color: '#64748b', fontSize: 12 }, top: 0 },
    grid: { left: '3%', right: multiUnit ? '5%' : '4%', bottom: '3%', top: '14%', containLabel: true },
    xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false }, axisLabel: { color: '#64748b', fontSize: 11 } },
    yAxis: yAxes,
    color: PALETTE,
    series,
  }
}

export function sparklineOption(values, color, height = 40) {
  const min = Math.min(...values) * 0.95
  const max = Math.max(...values) * 1.05
  return {
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: 'category', data: values.map((_, i) => i), show: false },
    yAxis: { type: 'value', show: false, min, max },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 1.5, color },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '30' }, { offset: 1, color: color + '05' }] } },
      },
    ],
  }
}
