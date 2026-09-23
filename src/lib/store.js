const DRAFT_KEY = 'report_drafts'

export function readDrafts() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function writeDrafts(drafts) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
}

// 通知（异常）pub/sub
let notifications = []
const listeners = new Set()

export function setNotifications(list) {
  notifications = list
  listeners.forEach((fn) => fn())
}

export function getNotifications() {
  return notifications
}

export function subscribeNotifications(fn) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

// 语义层 / 数据表持久化
export function readLocal(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
