import { api } from './api'
import { getAuthUser } from './auth'

let sessionId: string | null = null

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  if (sessionId) return sessionId
  const key = 'platform_session_id'
  let sid = localStorage.getItem(key)
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    localStorage.setItem(key, sid)
  }
  sessionId = sid
  return sid
}

export function trackClick(targetType: string, targetId: string, eventType = 'CLICK') {
  const user = getAuthUser()
  const payload: Parameters<typeof api.recordClick>[0] = {
    eventType,
    targetType,
    targetId,
    sessionId: getOrCreateSessionId(),
  }
  if (user) {
    payload.userId = user.id
    const u = user as { gender?: string; isCompany?: boolean }
    if (u.gender) payload.gender = u.gender
    if (u.isCompany !== undefined) payload.isCompany = u.isCompany
  }
  const isDev = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'
  if (isDev) console.log('[trackClick] Odosielam klik:', targetType, targetId)
  api.recordClick(payload).then(() => {
    if (isDev) console.log('[trackClick] OK')
  }).catch((err) => {
    if (isDev) console.warn('[trackClick] Zlyhalo:', err?.message || err, '– skontroluj API (NEXT_PUBLIC_API_URL) a či beží API server.')
  })
}
