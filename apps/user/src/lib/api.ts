const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorMessage = `API error: ${response.statusText}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      // Ak sa nepodarí parsovať JSON, použijeme statusText
    }
    const error = new Error(errorMessage)
    ;(error as any).status = response.status
    throw error
  }

  return response.json()
}

export const api = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(res => {
      if (!res.ok) {
        return res.json().then(err => {
          throw new Error(err.message || 'Registrácia zlyhala')
        })
      }
      return res.json()
    }),

  login: (data: { email: string; password: string }) =>
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(res => {
      if (!res.ok) {
        return res.json().then(err => {
          throw new Error(err.message || 'Prihlásenie zlyhalo')
        })
      }
      return res.json()
    }),

  getMe: () => fetchWithAuth('/auth/me'),
}
