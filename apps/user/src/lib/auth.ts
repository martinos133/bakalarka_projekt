export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
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

export function isAuthenticated(): boolean {
  const token = getAuthToken()
  const user = getAuthUser()
  return !!token && !!user
}

export function logout() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('user_token')
  localStorage.removeItem('user_user')
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
