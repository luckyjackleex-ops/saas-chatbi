import { jStat } from 'jstat'

export function tTest(a, b) {
  const n = a.length
  const m = b.length
  if (n < 2 || m < 2) return { t: 0, p: 1, df: 0 }
  const meanA = a.reduce((s, x) => s + x, 0) / n
  const meanB = b.reduce((s, x) => s + x, 0) / m
  const varA = a.reduce((s, x) => s + (x - meanA) ** 2, 0) / (n - 1)
  const varB = b.reduce((s, x) => s + (x - meanB) ** 2, 0) / (m - 1)
  const se = Math.sqrt(varA / n + varB / m)
  if (se === 0) return { t: 0, p: 1, df: 0 }
  const t = (meanA - meanB) / se
  const num = (varA / n + varB / m) ** 2
  const den = (varA / n) ** 2 / (n - 1) + (varB / m) ** 2 / (m - 1)
  const df = den === 0 ? n + m - 2 : num / den
  const p = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df))
  return { t, p, df }
}

export function compareResults(a, b) {
  const groupA = { label: a.metricLabel + ' (前)', data: a.data.map((d) => d.value) }
  const groupB = { label: b.metricLabel + ' (后)', data: b.data.map((d) => d.value) }
  const { t, p } = tTest(groupA.data, groupB.data)
  const significant = p < 0.05
  let interpretation
  if (significant && t > 0) interpretation = `差异显著（p = ${p.toFixed(4)} < 0.05），${a.metricLabel}在对比期间显著上升。`
  else if (significant && t < 0) interpretation = `差异显著（p = ${p.toFixed(4)} < 0.05），${a.metricLabel}在对比期间显著下降。`
  else interpretation = `差异不显著（p = ${p.toFixed(4)} > 0.05），两组数据的${a.metricLabel}没有统计学上的显著差异。`
  return {
    groupA,
    groupB,
    tStatistic: Number(t.toFixed(3)),
    pValue: Number(p.toFixed(4)),
    significant,
    interpretation,
  }
}

export function comparisonChart(result) {
  const x = result.groupA.data.map((_, i) => `第${i + 1}期`)
  return {
    tooltip: { trigger: 'axis', backgroundColor: '#18181b', borderColor: '#27272a', textStyle: { color: '#fafafa' } },
    legend: { data: [result.groupA.label, result.groupB.label], textStyle: { color: '#a1a1aa' }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
    xAxis: { type: 'category', data: x, axisLine: { lineStyle: { color: '#27272a' } }, axisLabel: { color: '#a1a1aa', fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#1f1f22' } }, axisLabel: { color: '#a1a1aa', fontSize: 11 } },
    series: [
      { name: result.groupA.label, type: 'line', data: result.groupA.data, smooth: true, lineStyle: { width: 2, color: '#f59e0b' }, itemStyle: { color: '#f59e0b' } },
      { name: result.groupB.label, type: 'line', data: result.groupB.data, smooth: true, lineStyle: { width: 2, color: '#8b5cf6' }, itemStyle: { color: '#8b5cf6' } },
    ],
  }
}
