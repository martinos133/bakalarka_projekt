export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
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

export function logout() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}
