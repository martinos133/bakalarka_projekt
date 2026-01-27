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

export async function fetchAPI(url: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
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
  // Public endpoints
  getPopularServices: () => fetchAPI('/advertisements/popular/services'),
  getAdvertisement: (id: string) => fetchAPI(`/advertisements/${id}`),
  getCategories: () => fetchAPI('/categories/active'),
  getCategoryBySlug: (slug: string) => fetchAPI(`/categories/slug/${slug}`),
  getAdvertisementsByCategory: (slug: string) => fetchAPI(`/advertisements/category/${slug}`),

  // Auth endpoints
  register: (data: any) => fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  login: (data: { email: string; password: string }) => fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // User profile endpoints
  getMyProfile: () => fetchWithAuth('/users/me/profile'),
  updateMyProfile: (data: any) => fetchWithAuth('/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  changePassword: (oldPassword: string, newPassword: string) => fetchWithAuth('/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ oldPassword, newPassword }),
  }),

  // Advertisement endpoints
  getMyAdvertisements: () => fetchWithAuth('/advertisements/me/my-advertisements'),
  createAdvertisement: (data: any) => fetchWithAuth('/advertisements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateAdvertisement: (id: string, data: any) => fetchWithAuth(`/advertisements/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteAdvertisement: (id: string) => fetchWithAuth(`/advertisements/${id}`, {
    method: 'DELETE',
  }),

  // Report endpoints
  createReport: (data: { advertisementId: string; reason: string; description?: string }) => fetchWithAuth('/reports', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Message endpoints
  getMessages: (status?: string, type?: string) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (type) params.append('type', type)
    return fetchWithAuth(`/messages?${params.toString()}`)
  },
  getMessage: (id: string) => fetchWithAuth(`/messages/${id}`),
  getUnreadCount: () => fetchWithAuth('/messages/unread/count'),
  markAsRead: (id: string) => fetchWithAuth(`/messages/${id}/read`, {
    method: 'PATCH',
  }),
  markAsArchived: (id: string) => fetchWithAuth(`/messages/${id}/archive`, {
    method: 'PATCH',
  }),
  createInquiry: (data: { advertisementId: string; subject: string; content: string }) => fetchWithAuth('/messages/inquiry', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}

export default api
