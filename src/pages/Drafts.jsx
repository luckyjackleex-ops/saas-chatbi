import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Inbox, Eye, PenLine, Download, Trash2, Save, X } from 'lucide-react'
import { useDrafts } from '../lib/hooks.js'
import { exportHtmlToPdf } from '../lib/export.js'

export default function Drafts() {
  const navigate = useNavigate()
  const { allDrafts, updateDraft, deleteDraft, clearAll } = useDrafts()
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')

  const startEdit = (draft) => {
    setEditing(draft.id)
    setEditText(draft.editedContent || draft.insights || '')
  }

  const saveEdit = (id) => {
    updateDraft(id, { editedContent: editText })
    setEditing(null)
  }

  const exportPdf = (draft) => {
    const html = (draft.editedContent || draft.insights)
      .split('\n')
      .map((line) => `<p style="margin-bottom:8px">${line}</p>`)
      .join('')
    exportHtmlToPdf(html, draft.title)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-4 w-4" /> 返回看板
            </button>
            <span className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-violet-500" />
              <h1 className="text-sm font-semibold text-slate-900">报告草稿箱</h1>
            </div>
          </div>
          {allDrafts.length > 0 && (
            <button onClick={() => { if (confirm('确定清空所有草稿？')) clearAll() }} className="text-xs text-slate-400 hover:text-red-500 transition-colors">清空全部</button>
          )}
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {allDrafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Inbox className="h-10 w-10 text-slate-200 mb-4" />
            <p className="text-sm">暂无草稿，去 ChatBI 或 Dashboard 分析数据后会自动存入这里</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allDrafts.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{d.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{d.createdAt} · {d.role === 'manager' ? '管理者' : d.role === 'pm' ? '产品经理' : '数据分析师'}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">ID: {d.id}</span>
                </div>
                {editing === d.id ? (
                  <div className="mt-2">
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full min-h-[120px] p-3 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 resize-y" />
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => saveEdit(d.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors">
                        <Save className="h-3 w-3" /> 保存
                      </button>
                      <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors">
                        <X className="h-3 w-3" /> 取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 mb-4 whitespace-pre-wrap">{d.editedContent || d.insights || '（暂无内容）'}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => navigate(`/report/${d.id}`)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-medium transition-colors">
                        <Eye className="h-3.5 w-3.5" /> 查看报告
                      </button>
                      <button onClick={() => startEdit(d)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors">
                        <PenLine className="h-3.5 w-3.5" /> 编辑
                      </button>
                      <button onClick={() => exportPdf(d)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors">
                        <Download className="h-3.5 w-3.5" /> 导出 PDF
                      </button>
                      <button onClick={() => { if (confirm('确定删除这份草稿？')) deleteDraft(d.id) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-colors ml-auto">
                        <Trash2 className="h-3.5 w-3.5" /> 删除
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
