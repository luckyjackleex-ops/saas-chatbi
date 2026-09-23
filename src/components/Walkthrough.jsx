import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDemoTour } from '../context/index.jsx'

function useTargetRect(targetId) {
  const [rect, setRect] = useState(null)
  const update = useCallback(() => {
    if (!targetId || targetId === 'done') {
      setRect(null)
      return
    }
    const el = document.querySelector(`[data-demo-target="${targetId}"]`)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [targetId])
  useEffect(() => {
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [update])
  return rect
}

function positionFor(rect, position) {
  if (!rect) return {}
  const vw = window.innerWidth
  const vh = window.innerHeight
  const clampX = (x) => Math.max(20, Math.min(x, vw - 320 - 20))
  const clampY = (y) => Math.max(20, Math.min(y, vh - 200))
  let top, left
  if (position === 'top') {
    top = rect.top - 16
    left = clampX(rect.left + rect.width / 2 - 320 / 2)
    if (top < 20) top = rect.bottom + 16
    return { top: clampY(top), left }
  }
  if (position === 'bottom') {
    top = rect.bottom + 16
    left = clampX(rect.left + rect.width / 2 - 320 / 2)
    if (top + 200 > vh - 20) top = rect.top - 16
    return { top: clampY(top), left }
  }
  left = rect.right + 16
  top = clampY(rect.top + rect.height / 2 - 100)
  if (left + 320 > vw - 20) left = rect.left - 320 - 16
  return { top, left: clampX(left) }
}

export function Walkthrough() {
  const { enabled, currentStepDef: step, currentStep, totalSteps, goNext, goPrev, skip } = useDemoTour()
  const targetId = step?.targetId ?? null
  const rect = useTargetRect(enabled ? targetId : null)
  const isDone = targetId === 'done'

  useEffect(() => {
    document.querySelector('.demo-spotlight')?.classList.remove('demo-spotlight')
    if (!enabled || !step || isDone) return
    const el = document.querySelector(`[data-demo-target="${targetId}"]`)
    el?.classList.add('demo-spotlight')
    return () => el?.classList.remove('demo-spotlight')
  }, [enabled, step, isDone, targetId])

  if (!enabled || !step) return null
  const pos = positionFor(rect, step.position)
  const dim = 'rgba(0, 0, 0, 0.45)'

  return createPortal(
    <>
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10000 }}>
        {!isDone && rect ? (
          <>
            <div className="absolute left-0 right-0" style={{ top: 0, height: rect.top, background: dim }} />
            <div className="absolute left-0 right-0" style={{ top: rect.bottom, height: `calc(100vh - ${rect.bottom}px)`, background: dim }} />
            <div className="absolute" style={{ top: rect.top, left: 0, width: rect.left, height: rect.height, background: dim }} />
            <div className="absolute" style={{ top: rect.top, left: rect.right, width: `calc(100vw - ${rect.right}px)`, height: rect.height, background: dim }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: dim }} />
        )}
      </div>
      <div
        className="fixed bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-80 pointer-events-auto animate-fade-in"
        style={{ zIndex: 10001, maxWidth: 320, ...(isDone ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } : pos) }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{currentStep + 1} / {totalSteps}</span>
          <span className="text-xs font-semibold text-slate-900">{step.title}</span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{step.description}</p>
        <div className="flex items-center justify-between">
          <button onClick={skip} className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1">
            <X className="h-3 w-3" />
            退出演示
          </button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button onClick={goPrev} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
                上一步
              </button>
            )}
            {currentStep < totalSteps - 1 ? (
              <button onClick={goNext} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors">
                下一步
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button onClick={skip} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors">完成</button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
