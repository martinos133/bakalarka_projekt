export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string | null
  role: string
  adminPermissions?: string[] | null
}

/** Zlúči údaje do `admin_user` (napr. po úprave profilu alebo /auth/me). */
export function setAuthUser(partial: Partial<User>) {
  if (typeof window === 'undefined') return
  const current = getAuthUser()
  if (!current) return
  localStorage.setItem('admin_user', JSON.stringify({ ...current, ...partial }))
  window.dispatchEvent(new Event('admin-auth-sync'))
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_token')
}

export function getAuthUser(): User | null {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('admin_user')
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  const token = getAuthToken()
  const user = getAuthUser()
  return !!token && !!user && user.role === 'ADMIN'
}

export function hasPermission(permission: string): boolean {
  const user = getAuthUser()
  if (!user || user.role !== 'ADMIN') return false
  if (!user.adminPermissions || !Array.isArray(user.adminPermissions)) return true
  return user.adminPermissions.includes(permission)
}

export function isOwnerAdmin(): boolean {
  const user = getAuthUser()
  if (!user || user.role !== 'ADMIN') return false
  return !user.adminPermissions || !Array.isArray(user.adminPermissions) || user.adminPermissions.length === 0
}

export function logout() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}
