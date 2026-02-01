const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  try {
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
  } catch (error: any) {
    // Ak je to network error (Failed to fetch)
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error(`Nepodarilo sa pripojiť k API serveru na ${API_URL}. Skontrolujte, či API server beží.`)
    }
    throw error
  }
}

export const api = {
  getStats: () => fetchWithAuth('/admin/stats'),
  getChartData: (period: '7d' | '30d' | '3m' = '30d') => 
    fetchWithAuth(`/admin/chart?period=${period}`),
  getUsers: () => fetchWithAuth('/users'),
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
  getCategories: () => fetchWithAuth('/categories'),
  getActiveCategories: () => fetchWithAuth('/categories/active'),
  createCategory: (data: any) =>
    fetchWithAuth('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: any) =>
    fetchWithAuth(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    fetchWithAuth(`/categories/${id}`, {
      method: 'DELETE',
    }),
  updateCategoryOrder: (categoryIds: string[], parentId?: string) =>
    fetchWithAuth('/categories/order', {
      method: 'PUT',
      body: JSON.stringify({ categoryIds, parentId }),
    }),
  getCategory: (id: string) =>
    fetchWithAuth(`/categories/${id}`),
  getFilters: (categoryId?: string) =>
    fetchWithAuth(categoryId ? `/filters?categoryId=${categoryId}` : '/filters'),
  getActiveFilters: (categoryId?: string) =>
    fetchWithAuth(categoryId ? `/filters/active?categoryId=${categoryId}` : '/filters/active'),
  createFilter: (data: any) =>
    fetchWithAuth('/filters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFilter: (id: string, data: any) =>
    fetchWithAuth(`/filters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteFilter: (id: string) =>
    fetchWithAuth(`/filters/${id}`, {
      method: 'DELETE',
    }),
  getFilter: (id: string) =>
    fetchWithAuth(`/filters/${id}`),
  getUser: (id: string) => fetchWithAuth(`/users/${id}`),
  banUser: (id: string, data: any) =>
    fetchWithAuth(`/users/${id}/ban`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getUserStats: (id: string) => fetchWithAuth(`/users/${id}/stats`),
  getPendingAdvertisements: () => fetchWithAuth('/advertisements/pending/all'),
  approveAdvertisement: (id: string) =>
    fetchWithAuth(`/advertisements/${id}/approve`, {
      method: 'PATCH',
    }),
  rejectAdvertisement: (id: string, reason?: string) =>
    fetchWithAuth(`/advertisements/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  getPendingReports: () => fetchWithAuth('/reports/pending'),
  getAllReports: () => fetchWithAuth('/reports'),
  getReport: (id: string) => fetchWithAuth(`/reports/${id}`),
  resolveReport: (id: string, data: any) =>
    fetchWithAuth(`/reports/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteReportedAdvertisement: (advertisementId: string, reportId: string) =>
    fetchWithAuth(`/reports/advertisement/${advertisementId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reportId }),
    }),
  getClickStats: (period: '1m' | '5m' | '1d' | '7d' | '30d' | '3m' = '30d') =>
    fetchWithAuth(`/analytics/stats?period=${period}`),
}

export default api
