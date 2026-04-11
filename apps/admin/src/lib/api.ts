const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/** Chyba z API so statusom – v catch môžete čítať `error.status` */
export class ApiRequestError extends Error {
  readonly status: number
  readonly url: string
  constructor(message: string, status: number, url: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.url = url
  }
}

/** NestJS / class-validator často vracajú `message` ako string alebo pole stringov */
function messageFromApiErrorBody(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const d = data as Record<string, unknown>
  const raw = d.message
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (Array.isArray(raw)) {
    const parts = raw
      .map((x) => (typeof x === 'string' ? x : x != null ? String(x) : ''))
      .filter(Boolean)
    if (parts.length) return parts.join(', ')
  }
  const err = d.error
  if (typeof err === 'string' && err.trim()) {
    const generic = ['Conflict', 'Bad Request', 'Unauthorized', 'Forbidden', 'Not Found']
    if (!generic.includes(err)) return err.trim()
  }
  return undefined
}

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
      // Ak je 401 Unauthorized, vymaž token a presmeruj na login
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
          // Presmerovanie na login stránku iba ak nie sme už na login stránke
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }
      }

      let errorMessage = `Chyba API (${response.status} ${response.statusText})`
      try {
        const errorData = await response.json()
        const parsed = messageFromApiErrorBody(errorData)
        errorMessage = parsed || errorMessage
        if (response.status >= 500) {
          errorMessage += ` — ${url}`
        }
      } catch {
        errorMessage = `${response.status} ${response.statusText}: ${url}`
      }
      throw new ApiRequestError(errorMessage, response.status, url)
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
  getAdminMessages: (status?: string, type?: string) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (type) params.set('type', type)
    return fetchWithAuth(`/admin/messages?${params.toString()}`)
  },
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
  getClickStats: (
    period: '1m' | '5m' | '8h' | '1d' | '7d' | '30d' | '3m' = '30d',
    minutes?: number,
    gender?: string,
    accountType?: string,
  ) => {
    const params = new URLSearchParams()
    if (minutes != null && minutes >= 1 && minutes <= 480) params.set('minutes', String(Math.floor(minutes)))
    else params.set('period', period)
    if (gender && gender !== 'all') params.set('gender', gender)
    if (accountType && accountType !== 'all') params.set('accountType', accountType)
    return fetchWithAuth(`/analytics/stats?${params.toString()}`)
  },
  getClickBreakdown: (period: '1m' | '5m' | '8h' | '1d' | '7d' | '30d' | '3m' = '30d') =>
    fetchWithAuth(`/analytics/stats/breakdown?period=${period}`),
  getMenu: (
    type:
      | 'navbar'
      | 'footer'
      | 'categoryNav'
      | 'madeOnRentMe'
      | 'popularCategories'
  ) => fetchWithAuth(`/menu/${type}`),
  getConfig: (key: 'platform' | 'admin') => fetchWithAuth(`/config/${key}`),
  updateConfig: (key: 'platform' | 'admin', data: object) =>
    fetchWithAuth(`/config/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getStaticPages: () => fetchWithAuth('/static-pages/list'),
  getStaticPage: (id: string) => fetchWithAuth(`/static-pages/${id}`),
  createStaticPage: (data: any) =>
    fetchWithAuth('/static-pages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStaticPage: (id: string, data: any) =>
    fetchWithAuth(`/static-pages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteStaticPage: (id: string) =>
    fetchWithAuth(`/static-pages/${id}`, {
      method: 'DELETE',
    }),
  getBlogPosts: () => fetchWithAuth('/blog'),
  getBlogPost: (id: string) => fetchWithAuth(`/blog/${id}`),
  createBlogPost: (data: any) =>
    fetchWithAuth('/blog', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBlogPost: (id: string, data: any) =>
    fetchWithAuth(`/blog/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteBlogPost: (id: string) =>
    fetchWithAuth(`/blog/${id}`, {
      method: 'DELETE',
    }),
  updateMenu: (
    type:
      | 'navbar'
      | 'footer'
      | 'categoryNav'
      | 'madeOnRentMe'
      | 'popularCategories',
    data: object
  ) =>
    fetchWithAuth(`/menu/${type}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  heartbeat: () => fetchWithAuth('/auth/heartbeat', { method: 'POST' }),

  getStaff: () => fetchWithAuth('/staff'),
  getStaffMember: (id: string) => fetchWithAuth(`/staff/${id}`),
  getStaffPermissions: () => fetchWithAuth('/staff/permissions'),
  createStaffMember: (data: any) =>
    fetchWithAuth('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStaffPermissions: (id: string, permissions: string[]) =>
    fetchWithAuth(`/staff/${id}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    }),
  resetStaffPassword: (id: string, password: string) =>
    fetchWithAuth(`/staff/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    }),
  removeStaffMember: (id: string) =>
    fetchWithAuth(`/staff/${id}`, {
      method: 'DELETE',
    }),

  getCalendarEvents: (from?: string, to?: string) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    return fetchWithAuth(`/calendar?${params.toString()}`)
  },
  getCalendarEvent: (id: string) => fetchWithAuth(`/calendar/${id}`),
  createCalendarEvent: (data: any) =>
    fetchWithAuth('/calendar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCalendarEvent: (id: string, data: any) =>
    fetchWithAuth(`/calendar/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCalendarEvent: (id: string) =>
    fetchWithAuth(`/calendar/${id}`, {
      method: 'DELETE',
    }),

  getChatConversations: () => fetchWithAuth('/team-chat/conversations'),
  getChatUnread: () => fetchWithAuth('/team-chat/unread'),
  getChatMembers: () => fetchWithAuth('/team-chat/members'),
  createChatConversation: (partnerId: string) =>
    fetchWithAuth('/team-chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ partnerId }),
    }),
  getChatMessages: (conversationId: string, cursor?: string) => {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)
    return fetchWithAuth(`/team-chat/conversations/${conversationId}/messages?${params.toString()}`)
  },
  sendChatMessage: (conversationId: string, content: string, attachments?: any[]) =>
    fetchWithAuth(`/team-chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments }),
    }),
  markChatRead: (conversationId: string) =>
    fetchWithAuth(`/team-chat/conversations/${conversationId}/read`, {
      method: 'POST',
    }),

  // Audit
  getAuditLogs: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params || {})
    return fetchWithAuth(`/audit?${q.toString()}`)
  },
  getAuditStats: () => fetchWithAuth('/audit/stats'),
  getAuditLog: (id: string) => fetchWithAuth(`/audit/${id}`),

  getSeoOverview: () => fetchWithAuth('/seo/overview'),
}

export default api
