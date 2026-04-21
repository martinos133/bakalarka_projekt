import type { CreatePlatformTestimonialDto, UpdatePlatformTestimonialDto } from '@inzertna-platforma/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
    let errorMessage = `Chyba API (${response.status} ${response.statusText})`
    try {
      const errorData = await response.json()
      errorMessage = messageFromApiErrorBody(errorData) || errorMessage
    } catch {
      // ponecháme errorMessage
    }
    const error = new Error(errorMessage)
    ;(error as any).status = response.status
    ;(error as any).url = url
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
    let errorMessage = `Chyba API (${response.status} ${response.statusText})`
    try {
      const errorData = await response.json()
      errorMessage = messageFromApiErrorBody(errorData) || errorMessage
    } catch {
      // JSON neprístupný
    }
    errorMessage += ` (${response.status} ${url})`
    const error = new Error(errorMessage)
    ;(error as any).status = response.status
    ;(error as any).url = url
    throw error
  }

  return response.json()
}

export const api = {
  // Public endpoints
  getNavbar: () => fetchAPI('/menu/navbar', { cache: 'no-store' }),
  getFooter: () => fetchAPI('/menu/footer', { cache: 'no-store' }),
  getCategoryNav: () => fetchAPI('/menu/categoryNav', { cache: 'no-store' }),
  getMadeOnRentMe: () => fetchAPI('/menu/madeOnRentMe', { cache: 'no-store' }),
  getPopularCategories: () =>
    fetchAPI('/menu/popularCategories', { cache: 'no-store' }),
  getPlatformConfig: () => fetchAPI('/config/platform', { cache: 'no-store' }),
  getTopFreelancers: (limit?: number) =>
    fetchAPI(
      limit ? `/advertisements/top-freelancers?limit=${limit}` : '/advertisements/top-freelancers',
      { cache: 'no-store' }
    ),
  getPopularServices: () => fetchAPI('/advertisements/popular/services'),
  getAdvertisement: (id: string) => fetchAPI(`/advertisements/${id}`),
  /** Verejné YYYY-MM-DD obsadené predajcom (blok + potvrdená rezervácia) pre výber termínu */
  getAdvertisementOccupiedDays: (advertisementId: string) =>
    fetchAPI(`/advertisements/${advertisementId}/occupied-days`, { cache: 'no-store' }),
  getCategories: () => fetchAPI('/categories/active'),
  /** Aktívne špecifikácie / filtre pre kategóriu (verejný endpoint) */
  getActiveFilters: (categoryId: string) =>
    fetchAPI(`/filters/active?categoryId=${encodeURIComponent(categoryId)}`, { cache: 'no-store' }),
  getCategoryBySlug: (slug: string) => fetchAPI(`/categories/slug/${slug}`),
  getAdvertisementsByCategory: (slug: string) => fetchAPI(`/advertisements/category/${slug}`),
  getAdvertisementsForMap: (
    params?: {
      categoryId?: string
      type?: string
      region?: string
      postalCode?: string
      city?: string
      centerLat?: number
      centerLng?: number
      radiusKm?: number
    },
    opts?: { signal?: AbortSignal },
  ) => {
    const search = new URLSearchParams()
    if (params?.categoryId) search.set('categoryId', params.categoryId)
    if (params?.type) search.set('type', params.type)
    if (params?.region) search.set('region', params.region)
    if (params?.postalCode) search.set('postalCode', params.postalCode)
    if (params?.city) search.set('city', params.city)
    if (params?.centerLat != null) search.set('centerLat', String(params.centerLat))
    if (params?.centerLng != null) search.set('centerLng', String(params.centerLng))
    if (params?.radiusKm != null) search.set('radiusKm', String(params.radiusKm))
    const q = search.toString()
    return fetchAPI(q ? `/advertisements/map?${q}` : '/advertisements/map', {
      cache: 'no-store',
      signal: opts?.signal,
    })
  },
  searchAdvertisements: (q: string) => fetchAPI(`/advertisements?q=${encodeURIComponent(q)}`),
  getSearchSuggestions: (q: string) => fetchAPI(`/search/suggestions?q=${encodeURIComponent(q)}`),
  getStaticPage: (slug: string) => fetchAPI(`/static-pages/slug/${slug}`),
  getBlogPosts: (limit?: number) =>
    fetchAPI(limit ? `/blog/posts?limit=${limit}` : '/blog/posts'),
  getBlogPost: (slug: string) => fetchAPI(`/blog/posts/slug/${slug}`),

  /** Verejné referencie na homepage */
  getPlatformTestimonials: () =>
    fetchAPI('/platform-testimonials', { cache: 'no-store' }),
  getMyPlatformTestimonial: () => fetchWithAuth('/platform-testimonials/me'),
  createPlatformTestimonial: (data: CreatePlatformTestimonialDto) =>
    fetchWithAuth('/platform-testimonials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePlatformTestimonial: (data: UpdatePlatformTestimonialDto) =>
    fetchWithAuth('/platform-testimonials/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

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
  activateDemoSubscription: (plan: 'PLUS' | 'PRO' | 'FIRMA') =>
    fetchWithAuth('/users/me/subscription/demo-checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
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
  getConversation: (id: string) =>
    fetchWithAuth(`/messages/${id}/conversation`),
  createReply: (messageId: string, content: string, attachments?: string[]) =>
    fetchWithAuth(`/messages/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments: attachments || [] }),
    }),
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

  /** Kalendár prihláseného používateľa (from/to = ISO alebo YYYY-MM-DD) */
  getCalendarEvents: (from?: string, to?: string) => {
    const q = new URLSearchParams()
    if (from) q.set('from', from)
    if (to) q.set('to', to)
    const s = q.toString()
    return fetchWithAuth(s ? `/calendar?${s}` : '/calendar')
  },
  createCalendarEvent: (data: {
    title: string
    description?: string
    type?: 'EVENT' | 'REMINDER' | 'TASK'
    date: string
    endDate?: string
    allDay?: boolean
    color?: string
  }) =>
    fetchWithAuth('/calendar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCalendarEvent: (
    id: string,
    data: {
      title?: string
      description?: string
      type?: 'EVENT' | 'REMINDER' | 'TASK'
      date?: string
      endDate?: string
      allDay?: boolean
      color?: string
      completed?: boolean
    },
  ) =>
    fetchWithAuth(`/calendar/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCalendarEvent: (id: string) =>
    fetchWithAuth(`/calendar/${id}`, { method: 'DELETE' }),

  // Favorites endpoints
  getFavorites: () => fetchWithAuth('/favorites'),
  checkFavorite: (advertisementId: string) => fetchWithAuth(`/favorites/check/${advertisementId}`),
  addFavorite: (advertisementId: string) => fetchWithAuth(`/favorites/${advertisementId}`, {
    method: 'POST',
  }),
  removeFavorite: (advertisementId: string) => fetchWithAuth(`/favorites/${advertisementId}`, {
    method: 'DELETE',
  }),

  // Reviews
  getReviews: (advertisementId: string) => fetchAPI(`/reviews/advertisement/${advertisementId}`),
  getReviewStats: (advertisementId: string) => fetchAPI(`/reviews/advertisement/${advertisementId}/stats`),
  getUserReviewStats: (userId: string) => fetchAPI(`/reviews/user/${userId}/stats`),
  createReview: (data: { advertisementId: string; rating: number; comment?: string }) =>
    fetchWithAuth('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  updateReview: (id: string, data: { rating?: number; comment?: string }) =>
    fetchWithAuth(`/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteReview: (id: string) =>
    fetchWithAuth(`/reviews/${id}`, { method: 'DELETE' }),
  replyToReview: (id: string, reply: string) =>
    fetchWithAuth(`/reviews/${id}/reply`, { method: 'POST', body: JSON.stringify({ reply }) }),
  deleteReviewReply: (id: string) =>
    fetchWithAuth(`/reviews/${id}/reply`, { method: 'DELETE' }),

  // Monitoring kliknutí (verejné – bez auth)
  recordClick: (data: {
    eventType?: string
    targetType?: string
    targetId?: string
    sessionId?: string
    userId?: string
    gender?: string
    isCompany?: boolean
  }) =>
    fetchAPI('/analytics/click', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export default api
