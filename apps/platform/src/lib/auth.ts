export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  gender?: string
  isCompany?: boolean
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('user_token')
}

export function getAuthUser(): User | null {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user_user')
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

/** Aktualizuje uloženého používateľa (napr. po načítaní profilu) – aby trackClick mal aktuálne gender/isCompany */
export function setAuthUser(updates: Partial<User>) {
  if (typeof window === 'undefined') return
  const current = getAuthUser()
  const merged = current ? { ...current, ...updates } : { ...updates } as User
  localStorage.setItem('user_user', JSON.stringify(merged))
}

export function isAuthenticated(): boolean {
  const token = getAuthToken()
  const user = getAuthUser()
  return !!token && !!user
}

export function logout() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('user_token')
  localStorage.removeItem('user_user')
  window.location.href = '/'
}
