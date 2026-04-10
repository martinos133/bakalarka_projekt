'use client'

import { useEffect, useState } from 'react'
import TrackedLink from '@/components/TrackedLink'
import { api } from '@/lib/api'

interface Service {
  id: string
  title: string
  description: string
  price?: number
  images: string[]
  category?: {
    name: string
  }
  user?: {
    firstName?: string
    lastName?: string
  }
}

export default function PopularServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [ratings, setRatings] = useState<Record<string, { count: number; average: number }>>({})

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const data = await api.getPopularServices()
      setServices(data || [])
      if (data?.length) {
        const statsEntries = await Promise.all(
          data.map(async (s: Service) => {
            try {
              const stats = await api.getReviewStats(s.id)
              return [s.id, stats] as const
            } catch {
              return [s.id, { count: 0, average: 0 }] as const
            }
          })
        )
        setRatings(Object.fromEntries(statsEntries))
      }
    } catch (error) {
      console.error('Chyba pri načítaní služieb:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-16 bg-dark">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Populárne profesionálne služby
            </h2>
          </div>
          <div className="text-center text-gray-500">Načítavam...</div>
        </div>
      </section>
    )
  }

  if (services.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-dark">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Populárne profesionálne služby
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {services.map((service) => (
            <TrackedLink
              key={service.id}
              href={`/inzerat/${service.id}`}
              targetType="AD"
              targetId={service.id}
              className="group cursor-pointer hover:shadow-lg transition-shadow duration-300 block"
            >
              <div className="relative overflow-hidden rounded-lg mb-3">
                <img
                  src={service.images && service.images.length > 0 ? service.images[0] : 'https://via.placeholder.com/400x300?text=No+Image'}
                  alt={service.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-accent transition-colors line-clamp-2">
                  {service.title}
                </h3>
                <div className="flex items-center gap-1 mb-1">
                  <svg
                    className="w-4 h-4 text-accent fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="text-sm font-semibold text-white">
                    {(ratings[service.id]?.count ?? 0) > 0 ? ratings[service.id].average.toFixed(1) : '–'}
                  </span>
                  <span className="text-sm text-gray-500">({ratings[service.id]?.count ?? 0})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Začínajúc od</span>
                  <span className="text-lg font-bold text-white">
                    {service.price ? `${service.price.toFixed(2)}€` : 'Na dohodu'}
                  </span>
                </div>
              </div>
            </TrackedLink>
          ))}
        </div>
      </div>
    </section>
  )
}
