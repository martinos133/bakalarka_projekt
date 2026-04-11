'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
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
      <section className="border-t border-white/[0.06] bg-surface py-16">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="mb-2 font-serif text-3xl font-bold text-accent md:text-4xl">
              Populárne profesionálne služby
            </h2>
            <p className="text-sm text-muted">Načítavam…</p>
          </div>
        </div>
      </section>
    )
  }

  if (services.length === 0) {
    return null
  }

  return (
    <section className="border-t border-white/[0.06] bg-surface py-16">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="font-serif text-3xl font-bold text-accent md:text-4xl">
            Populárne profesionálne služby
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {services.map((service) => (
            <TrackedLink
              key={service.id}
              href={`/inzerat/${service.id}`}
              targetType="AD"
              targetId={service.id}
              className="group block"
            >
              <article className="card card-hover flex h-full flex-col overflow-hidden shadow-lg shadow-black/15 transition-all duration-200">
                <div className="relative h-44 shrink-0 overflow-hidden border-b border-white/[0.06] bg-dark-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      service.images && service.images.length > 0
                        ? service.images[0]
                        : 'https://via.placeholder.com/400x300/1a1a1a/c9a96e?text=Bez+obrázka'
                    }
                    alt={service.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    onError={(e) => {
                      const el = e.currentTarget
                      el.onerror = null
                      el.src =
                        'https://via.placeholder.com/400x300/1a1a1a/c9a96e?text=Bez+obrázka'
                    }}
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="mb-2 line-clamp-2 font-serif text-base font-semibold leading-snug text-white transition-colors group-hover:text-accent-light">
                    {service.title}
                  </h3>
                  <div className="mb-3 flex items-center gap-1.5">
                    <Star className="h-4 w-4 shrink-0 fill-accent text-accent" aria-hidden />
                    <span className="text-sm font-semibold text-white">
                      {(ratings[service.id]?.count ?? 0) > 0 ? ratings[service.id].average.toFixed(1) : '–'}
                    </span>
                    <span className="text-sm text-muted">({ratings[service.id]?.count ?? 0})</span>
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-2 border-t border-white/[0.06] pt-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                      Začínajúc od
                    </span>
                    <span
                      className={`text-right text-lg font-bold tabular-nums ${
                        service.price != null ? 'text-accent' : 'text-gray-300'
                      }`}
                    >
                      {service.price != null ? `${service.price.toFixed(2)}€` : 'Na dohodu'}
                    </span>
                  </div>
                </div>
              </article>
            </TrackedLink>
          ))}
        </div>
      </div>
    </section>
  )
}
