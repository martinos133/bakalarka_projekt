const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
  getPopularServices: () => fetchAPI('/advertisements/popular/services'),
  getAdvertisement: (id: string) => fetchAPI(`/advertisements/${id}`),
  getCategories: () => fetchAPI('/categories/active'),
}

export default api
