import { useEffect, useRef, useState, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import { LoaderCircle } from 'lucide-react'
import { singleChart, mergedChart, mergeResults, inferChartType } from '../lib/charts.js'
import { mapCities, nrrColor, nrrLabel } from '../lib/data.js'

const LEGEND = [
  { color: '#7c3aed', label: '>105%' },
  { color: '#10b981', label: '100-105%' },
  { color: '#f59e0b', label: '95-100%' },
  { color: '#ef4444', label: '<95%' },
]

function mapTooltip(p) {
  if (!p.data || !p.data.value) return p.name
  const customers = p.data.value[2]
  const arr = p.data.value[3]
  const nrr = p.data.value[4]
  const arrText = arr >= 1e4 ? (arr / 1e4).toFixed(1) + ' 万' : arr.toLocaleString()
  const color = nrrColor(nrr)
  const parts = []
  parts.push('<div style="font-size:13px;line-height:1.8">')
  parts.push('<strong style="font-size:14px">' + p.name + '</strong><br/>')
  parts.push('客户数：<strong>' + customers + '</strong> 个<br/>')
  parts.push('ARR：<strong>' + arrText + '</strong><br/>')
  parts.push('NRR：<strong style="color:' + color + '">' + nrr + '%</strong>')
  parts.push('<span style="color:' + color + ';margin-left:4px;font-size:11px">' + nrrLabel(nrr) + '</span>')
  parts.push('</div>')
  return parts.join('')
}

export function WorldMap({ cities = mapCities, height = 400, onCityClick }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [tried, setTried] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      for (const url of ['/world.json']) {
        if (cancelled) return
        setTried(url)
        try {
          const res = await fetch(url)
          if (!res.ok) continue
          const json = await res.json()
          if (!cancelled) {
            echarts.registerMap('world', json)
            setLoaded(true)
            return
          }
        } catch {
          continue
        }
      }
      if (!cancelled) setFailed(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const option = useMemo(() => {
    const data = cities.map((c) => ({
      name: c.name,
      value: [c.lng, c.lat, c.customers, c.arr, c.nrr],
      itemStyle: { color: nrrColor(c.nrr), shadowBlur: 14, shadowColor: nrrColor(c.nrr) + '99' },
    }))
    if (loaded) {
      return {
        backgroundColor: '#f8fafc',
        tooltip: {
          trigger: 'item',
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          textStyle: { color: '#1e293b', fontSize: 13 },
          formatter: mapTooltip,
        },
        geo: {
          map: 'world',
          roam: true,
          zoom: 2.3,
          center: [110, 32],
          scaleLimit: { min: 1, max: 8 },
          itemStyle: { areaColor: '#f1f5f9', borderColor: '#cbd5e1', borderWidth: 0.6 },
          emphasis: { disabled: true },
          label: { show: false },
        },
        series: [
          {
            type: 'scatter',
            coordinateSystem: 'geo',
            data,
            symbolSize: (v) => Math.sqrt(v[2]) * 2 + 5,
            label: { show: true, formatter: '{b}', position: 'right', fontSize: 10, color: '#475569', distance: 5, textShadowBlur: 4, textShadowColor: '#fff' },
            emphasis: { scale: 2.5, itemStyle: { shadowBlur: 24, shadowColor: 'rgba(124, 58, 237, 0.6)' }, label: { fontSize: 13, fontWeight: 'bold' } },
            zlevel: 1,
          },
        ],
      }
    }
    return {
      backgroundColor: '#f8fafc',
      xAxis: { type: 'value', show: false, min: -180, max: 180 },
      yAxis: { type: 'value', show: false, min: -90, max: 90 },
      series: [{ type: 'scatter', coordinateSystem: 'cartesian2d', data, symbolSize: (v) => Math.sqrt(v[2]) * 2.5 + 6, itemStyle: { opacity: 0.5 } }],
    }
  }, [cities, loaded])

  const events = useMemo(() => {
    if (!onCityClick) return undefined
    return { click: (p) => { const c = cities.find((x) => x.name === p.name); if (c) onCityClick(c) } }
  }, [cities, onCityClick])

  if (!loaded && !failed) {
    return (
      <div className="flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200" style={{ height }}>
        <div className="text-center">
          <LoaderCircle className="h-6 w-6 text-brand-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">加载世界地图...</p>
          <p className="text-[10px] text-slate-300 mt-1">{tried.split('/').pop()}</p>
        </div>
      </div>
    )
  }
  if (failed) {
    return (
      <div className="relative bg-slate-50 rounded-lg border border-slate-200 overflow-hidden" style={{ height }}>
        <div className="absolute top-2 left-3 z-10 bg-white/90 rounded-md px-2 py-1 border border-slate-200 text-[10px] text-slate-500">地图加载失败，显示简化视图</div>
        <ReactECharts ref={ref} option={option} style={{ height, width: '100%' }} onEvents={events} notMerge lazyUpdate />
        <div className="absolute bottom-2 right-3 flex gap-2 bg-white/90 rounded-md px-2.5 py-1.5 border border-slate-200">
          {LEGEND.map((l) => (
            <div key={l.color} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[10px] text-slate-400">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="relative bg-slate-50 rounded-lg border border-slate-200 overflow-hidden" style={{ height }}>
      <ReactECharts ref={ref} option={option} style={{ height, width: '100%' }} onEvents={events} notMerge lazyUpdate opts={{ renderer: 'canvas' }} />
      <div className="absolute bottom-3 right-3 flex items-center gap-3 bg-white/90 rounded-lg px-3 py-1.5 border border-slate-200 shadow-sm">
        <span className="text-[10px] text-slate-400 mr-1">NRR</span>
        {LEGEND.map((l) => (
          <div key={l.color} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color, boxShadow: `0 0 6px ${l.color}80` }} />
            <span className="text-[10px] text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>
      <div className="absolute top-2 left-3 text-[10px] text-slate-400 bg-white/80 rounded-md px-2 py-0.5">滚轮缩放 · 拖拽平移</div>
    </div>
  )
}

export function ChartResult({ results, height = 380 }) {
  if (!results.length) return null
  const { merged, standalone } = mergeResults(results)
  const single = merged.length === 0 && standalone.length === 1
  const oneMerged = merged.length === 1 && standalone.length === 0
  if (single || oneMerged) {
    if (oneMerged) {
      const opt = mergedChart(merged[0])
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-slate-700">{merged[0].label}</h3></div>
          <ReactECharts option={opt} style={{ height }} notMerge lazyUpdate />
        </div>
      )
    }
    const r = standalone[0]
    const opt = singleChart(r, inferChartType([r]))
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">{r.metricLabel}</h3>
          <span className="text-xs text-slate-400">{r.unit}</span>
        </div>
        <ReactECharts option={opt} style={{ height }} notMerge lazyUpdate />
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {merged.map((m, i) => (
        <div key={`merged-${i}`} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-slate-700">{m.label}</h3></div>
          <ReactECharts option={mergedChart(m)} style={{ height: height - 40 }} notMerge lazyUpdate />
        </div>
      ))}
      {standalone.map((r, i) => (
        <div key={`standalone-${i}`} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">{r.metricLabel}</h3>
            <span className="text-xs text-slate-400">{r.unit}</span>
          </div>
          <ReactECharts option={singleChart(r, inferChartType([r]))} style={{ height: height - 40 }} notMerge lazyUpdate />
        </div>
      ))}
    </div>
  )
}
