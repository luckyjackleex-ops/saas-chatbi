function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function std(arr, m) {
  if (arr.length < 2) return 0
  return Math.sqrt(arr.reduce((s, n) => s + (n - m) ** 2, 0) / (arr.length - 1))
}

function isWeekend(date) {
  const d = new Date(date).getDay()
  return d === 0 || d === 6
}

function risingForWeeks(arr, weeks) {
  if (arr.length < weeks) return false
  const tail = arr.slice(-weeks)
  let up = 0
  for (let i = 1; i < tail.length; i++) if (tail[i] >= tail[i - 1] - 0.01) up++
  return up >= tail.length - 1
}

// 异常检测（基于日度数据）
export function detectAnomalies(fin, prod) {
  const out = []
  const last = fin[fin.length - 1]
  const prev = fin[fin.length - 2]
  const prodLast = prod[prod.length - 1]
  const prodPrev = prod[prod.length - 2]
  const weekend = isWeekend(last.date)
  const churnSeries = fin.map((d) => d.churn_rate)
  const churnMean = mean(churnSeries)
  const churnStd = std(churnSeries, churnMean)

  if (churnStd > 0 && !weekend) {
    const z = (last.churn_rate - churnMean) / churnStd
    if (z > 2.5) {
      const change = prev ? Number((((last.churn_rate - prev.churn_rate) / prev.churn_rate) * 100).toFixed(1)) : 0
      out.push({
        id: 'anom-churn',
        metricLabel: '客户流失率',
        metricKey: 'churn_rate',
        severity: 'red',
        currentValue: last.churn_rate,
        threshold: Number((churnMean + 2.5 * churnStd).toFixed(2)),
        changePercent: change,
        detectedAt: last.date,
        insight: `Z-score ${z.toFixed(1)}，显著高于历史均值 ${churnMean.toFixed(2)}%`,
        suggestedAction: '下钻分析客户分层流失数据，定位流失客户群',
      })
    }
  }

  const dauSeries = prod.map((d) => d.dau)
  const dauMean = mean(dauSeries)
  const dauStd = std(dauSeries, dauMean)
  if (dauStd > 0 && !weekend) {
    const z = (prodLast.dau - dauMean) / dauStd
    if (z < -2.5) {
      const change = prodPrev ? Number((((prodLast.dau - prodPrev.dau) / prodPrev.dau) * 100).toFixed(1)) : 0
      out.push({
        id: 'anom-dau',
        metricLabel: 'DAU',
        metricKey: 'dau',
        severity: 'yellow',
        currentValue: prodLast.dau,
        threshold: Math.round(dauMean - 2.5 * dauStd),
        changePercent: change,
        detectedAt: last.date,
        insight: `DAU 显著低于历史均值 ${Math.round(dauMean)}，Z-score ${z.toFixed(1)}`,
        suggestedAction: '检查是否有版本发布问题或服务可用性问题',
      })
    }
  }

  if (risingForWeeks(churnSeries, 14)) {
    const tail = churnSeries.slice(-14)
    const first = tail[0]
    const lastV = tail[tail.length - 1]
    if (!out.some((a) => a.id === 'anom-churn-trend')) {
      out.push({
        id: 'anom-churn-trend',
        metricLabel: '客户流失率（趋势）',
        metricKey: 'churn_rate_trend',
        severity: 'yellow',
        currentValue: lastV,
        threshold: 3.5,
        changePercent: Number((((lastV - first) / first) * 100).toFixed(1)),
        detectedAt: last.date,
        insight: `流失率已连续 2 周上升，从 ${first.toFixed(2)}% 升至 ${lastV.toFixed(2)}%`,
        suggestedAction: '关注客户健康度评分，启动客户成功主动干预',
      })
    }
  }

  if (last.nrr < 100) {
    out.push({
      id: 'anom-nrr',
      metricLabel: 'NRR（净收入留存）',
      metricKey: 'nrr',
      severity: 'red',
      currentValue: last.nrr,
      threshold: 100,
      changePercent: prev ? Number((last.nrr - prev.nrr).toFixed(1)) : 0,
      detectedAt: last.date,
      insight: 'NRR 低于 100%，意味着现有客户的收入正在收缩',
      suggestedAction: '立即审查扩展收入和收缩收入的变化趋势，找出收缩客户群',
    })
  }

  if (!weekend && prev) {
    const candidates = [
      { key: 'mrr', label: 'MRR', current: last.mrr, prev: prev.mrr },
      { key: 'new_customers', label: '新增客户', current: last.new_customers, prev: prev.new_customers },
      { key: 'churn_rate', label: '流失率', current: last.churn_rate, prev: prev.churn_rate },
      { key: 'nrr', label: 'NRR', current: last.nrr, prev: prev.nrr },
      { key: 'dau', label: 'DAU', current: prodLast.dau, prev: prodPrev.dau },
      { key: 'd7_retention', label: 'D7 留存', current: prodLast.d7_retention, prev: prodPrev.d7_retention },
    ]
    for (const c of candidates) {
      if (c.prev === 0) continue
      const pct = Number((((c.current - c.prev) / c.prev) * 100).toFixed(1))
      if (Math.abs(pct) > 15) {
        if ((c.key === 'churn_rate' && out.some((a) => a.id === 'anom-churn')) ||
          (c.key === 'nrr' && out.some((a) => a.id === 'anom-nrr')) ||
          (c.key === 'dau' && out.some((a) => a.id === 'anom-dau'))) continue
        out.push({
          id: `anom-change-${c.key}`,
          metricLabel: c.label,
          metricKey: c.key,
          severity: 'yellow',
          currentValue: c.current,
          threshold: c.prev,
          changePercent: pct,
          detectedAt: last.date,
          insight: `${c.label} 日环比 ${pct > 0 ? '+' : ''}${pct}%，超过 ±15% 阈值`,
          suggestedAction: `查看${c.label}明细数据，确认是否正常业务波动`,
        })
      }
    }
  }

  return out.sort((a, b) =>
    a.severity === b.severity ? Math.abs(b.changePercent) - Math.abs(a.changePercent) : a.severity === 'red' ? -1 : 1,
  )
}
