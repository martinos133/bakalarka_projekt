const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  
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
    throw new Error(`API error: ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  getStats: () => fetchWithAuth('/admin/stats'),
  getChartData: (period: '7d' | '30d' | '3m' = '30d') => 
    fetchWithAuth(`/admin/chart?period=${period}`),
  getUsers: () => fetchWithAuth('/admin/users'),
  getAdvertisements: () => fetchWithAuth('/admin/advertisements'),
  createAdvertisement: (data: any) => 
    fetchWithAuth('/advertisements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdvertisement: (id: string, data: any) =>
    fetchWithAuth(`/advertisements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteAdvertisement: (id: string) =>
    fetchWithAuth(`/advertisements/${id}`, {
      method: 'DELETE',
    }),
  getAdvertisement: (id: string) =>
    fetchWithAuth(`/advertisements/${id}`),
}

export default api
