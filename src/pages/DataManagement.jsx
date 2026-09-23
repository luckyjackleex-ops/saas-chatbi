import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Database, Upload, Table2, Search, Download, Trash2, Columns3, ChevronUp, ChevronDown } from 'lucide-react'
import { readLocal, writeLocal } from '../lib/store.js'

function demoTables() {
  const months = ['2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05']
  const fin = months.map((m, i) => {
    const mr = 250 + i * 3 + Math.sin(i * 0.8) * 2
    return {
      月份: m,
      'MRR(万元)': mr.toFixed(1),
      'ARR(万元)': (mr * 12).toFixed(1),
      新增客户: String(35 + Math.floor(Math.random() * 20)),
      流失客户: String(8 + Math.floor(Math.random() * 12)),
      '流失率(%)': i === 7 ? '4.7' : (1.8 + Math.random() * 1.2).toFixed(1),
      'NRR(%)': (98 + Math.random() * 10).toFixed(1),
      'LTV(元)': String(80000 + Math.floor(Math.random() * 20000)),
      'CAC(元)': String(12000 + Math.floor(Math.random() * 5000)),
      '毛利率(%)': (72 + Math.random() * 8).toFixed(1),
    }
  })
  const prod = months.map((m, i) => ({
    月份: m,
    DAU: String(4500 + Math.floor(Math.random() * 1500)),
    MAU: String(28000 + Math.floor(Math.random() * 5000)),
    '粘性(%)': (16 + Math.random() * 4).toFixed(1),
    'D7留存(%)': i >= 8 ? (40 + Math.random() * 4).toFixed(1) : (34 + Math.random() * 3).toFixed(1),
    'D30留存(%)': (22 + Math.random() * 4).toFixed(1),
    '功能A使用率(%)': (45 + Math.random() * 15).toFixed(1),
    '功能B使用率(%)': (30 + Math.random() * 20).toFixed(1),
    '功能C使用率(%)': (20 + Math.random() * 25).toFixed(1),
  }))
  const tiers = [
    { 客户分层: '企业版 (>¥5,000/月)', 客户数: '48', 'MRR(万元)': '142.5', '流失率(%)': '4.7', 'ARPU(元)': '29687', 'NRR(%)': '108.2' },
    { 客户分层: '中端版 (¥1,000-5,000/月)', 客户数: '156', 'MRR(万元)': '112.3', '流失率(%)': '1.8', 'ARPU(元)': '7198', 'NRR(%)': '112.5' },
    { 客户分层: '基础版 (<¥1,000/月)', 客户数: '312', 'MRR(万元)': '35.2', '流失率(%)': '2.9', 'ARPU(元)': '1128', 'NRR(%)': '98.6' },
    { 客户分层: '合作伙伴', 客户数: '24', 'MRR(万元)': '18.5', '流失率(%)': '0.8', 'ARPU(元)': '7708', 'NRR(%)': '125.0' },
  ]
  const regions = [
    { 城市: '北京', 客户数: '234', 'MRR(万元)': '56.0', 'ARR(万元)': '672.0', 'NRR(%)': '108.0', 企业版客户: '38', 中端客户: '89', SMB客户: '107' },
    { 城市: '上海', 客户数: '312', 'MRR(万元)': '78.0', 'ARR(万元)': '936.0', 'NRR(%)': '112.0', 企业版客户: '52', 中端客户: '118', SMB客户: '142' },
    { 城市: '深圳', 客户数: '178', 'MRR(万元)': '42.0', 'ARR(万元)': '504.0', 'NRR(%)': '105.0', 企业版客户: '28', 中端客户: '65', SMB客户: '85' },
    { 城市: '杭州', 客户数: '145', 'MRR(万元)': '34.0', 'ARR(万元)': '408.0', 'NRR(%)': '115.0', 企业版客户: '22', 中端客户: '54', SMB客户: '69' },
    { 城市: '成都', 客户数: '89', 'MRR(万元)': '18.0', 'ARR(万元)': '216.0', 'NRR(%)': '98.0', 企业版客户: '12', 中端客户: '32', SMB客户: '45' },
    { 城市: '广州', 客户数: '156', 'MRR(万元)': '37.0', 'ARR(万元)': '444.0', 'NRR(%)': '110.0', 企业版客户: '24', 中端客户: '58', SMB客户: '74' },
    { 城市: '新加坡', 客户数: '45', 'MRR(万元)': '12.0', 'ARR(万元)': '144.0', 'NRR(%)': '118.0', 企业版客户: '8', 中端客户: '17', SMB客户: '20' },
    { 城市: '东京', 客户数: '28', 'MRR(万元)': '6.8', 'ARR(万元)': '81.6', 'NRR(%)': '95.0', 企业版客户: '4', 中端客户: '10', SMB客户: '14' },
    { 城市: '旧金山', 客户数: '12', 'MRR(万元)': '3.2', 'ARR(万元)': '38.4', 'NRR(%)': '102.0', 企业版客户: '3', 中端客户: '4', SMB客户: '5' },
  ]
  return [
    { name: '经营数据', columns: Object.keys(fin[0]), rows: fin },
    { name: '产品数据', columns: Object.keys(prod[0]), rows: prod },
    { name: '客户分层', columns: Object.keys(tiers[0]), rows: tiers },
    { name: '地区数据', columns: Object.keys(regions[0]), rows: regions },
  ]
}

function parseCsv(text, name) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { name: name || '未命名表', columns: [], rows: [] }
  const columns = lines[0].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cells = []
    let cur = ''
    let inQuote = false
    for (let j = 0; j < lines[i].length; j++) {
      const ch = lines[i][j]
      if (ch === '"') {
        if (inQuote && j + 1 < lines[i].length && lines[i][j + 1] === '"') {
          cur += '"'
          j++
        } else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        cells.push(cur.trim())
        cur = ''
      } else cur += ch
    }
    cells.push(cur.trim())
    if (cells.length === 0) continue
    const row = {}
    columns.forEach((c, n) => {
      row[c] = n < cells.length ? cells[n] : ''
    })
    rows.push(row)
  }
  return { name: name || '未命名表', columns, rows }
}

export default function DataManagement() {
  const navigate = useNavigate()
  const [tables, setTables] = useState(() => readLocal('data_tables') || demoTables())
  const [active, setActive] = useState(() => (readLocal('data_tables') || demoTables())[0]?.name ?? '')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const fileRef = useRef(null)
  const table = tables.find((t) => t.name === active)

  const rows = useMemo(() => {
    if (!table) return []
    let data = [...table.rows]
    if (search) {
      data = data.filter((r) => Object.values(r).some((v) => v.toLowerCase().includes(search.toLowerCase())))
    }
    if (sort) {
      data.sort((a, b) => {
        const av = a[sort.col] ?? ''
        const bv = b[sort.col] ?? ''
        const an = parseFloat(av)
        const bn = parseFloat(bv)
        if (!isNaN(an) && !isNaN(bn)) return sort.dir === 'asc' ? an - bn : bn - an
        return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    }
    return data
  }, [table, search, sort])

  const commit = (next) => {
    setTables(next)
    writeLocal('data_tables', next)
  }

  const onUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCsv(reader.result, file.name.replace(/\.csv$/i, ''))
      commit([...tables, parsed])
      setActive(parsed.name)
      setUploadOpen(false)
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  const doDelete = (name) => {
    const next = tables.filter((t) => t.name !== name)
    commit(next)
    if (active === name) setActive(next[0]?.name ?? '')
    setConfirmDelete(null)
  }

  const exportCsv = () => {
    if (!table) return
    const header = table.columns.join(',')
    const body = table.rows.map((r) => table.columns.map((c) => {
      const v = r[c] ?? ''
      return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
    }).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + header + '\n' + body], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${table.name}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-4 w-4" /> 返回看板
            </button>
            <span className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-violet-500" />
              <h1 className="text-sm font-semibold text-slate-900">数据管理</h1>
            </div>
          </div>
          <button onClick={() => setUploadOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors shadow-sm">
            <Upload className="h-3.5 w-3.5" /> 上传 CSV
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Database className="h-3 w-3" /> 数据表
              <span className="ml-auto text-slate-400 font-normal">{tables.length}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {tables.map((t) => (
              <button key={t.name} onClick={() => setActive(t.name)} className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left ${active === t.name ? 'bg-violet-50 text-violet-700 font-medium border-r-2 border-r-violet-500' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Table2 className={`h-3.5 w-3.5 shrink-0 ${active === t.name ? 'text-violet-500' : 'text-slate-400'}`} />
                <span className="truncate">{t.name}</span>
                <span className="ml-auto text-xs text-slate-400">{t.rows.length}行</span>
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-slate-100"><p className="text-xs text-slate-400 px-1">CSV 上传或预置 Demo 数据</p></div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          {table && (
            <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Columns3 className="h-3.5 w-3.5 text-slate-400" />
                {table.name}
                <span className="text-xs text-slate-400 font-normal">{table.columns.length} 列 · {rows.length} 行</span>
              </div>
              <div className="flex-1" />
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索数据..." className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 w-48" />
              </div>
              <button onClick={exportCsv} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <Download className="h-3.5 w-3.5" /> 导出 CSV
              </button>
              <button onClick={() => setConfirmDelete(table.name)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-auto p-4">
            {table && rows.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider w-10">#</th>
                      {table.columns.map((c) => (
                        <th key={c} onClick={() => setSort(sort?.col === c ? (sort.dir === 'asc' ? { col: c, dir: 'desc' } : null) : { col: c, dir: 'asc' })} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {c}
                            {sort?.col === c && (sort.dir === 'asc' ? <ChevronUp className="h-3 w-3 text-violet-500" /> : <ChevronDown className="h-3 w-3 text-violet-500" />)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td className="px-3 py-2 text-xs text-slate-400 tabular-nums">{i + 1}</td>
                        {table.columns.map((c) => <td key={c} className="px-3 py-2 text-slate-700 whitespace-nowrap tabular-nums">{r[c] ?? ''}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : table ? (
              <div className="flex items-center justify-center h-64 text-sm text-slate-400">没有匹配的数据</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                <Database className="h-8 w-8 text-slate-200 mb-3" />
                <p className="text-sm">选择左侧数据表查看</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setUploadOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">上传 CSV 文件</h3>
            <p className="text-xs text-slate-500 mb-4">第一行作为列名，支持逗号分隔。文件会保存到本地。</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={onUpload} className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
            <div className="flex justify-end mt-4">
              <button onClick={() => setUploadOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">取消</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><Trash2 className="h-5 w-5 text-red-500" /></div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">确认删除</h3>
                <p className="text-xs text-slate-500 mt-0.5">将删除数据表 "{confirmDelete}"，此操作不可撤销。</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">取消</button>
              <button onClick={() => doDelete(confirmDelete)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
