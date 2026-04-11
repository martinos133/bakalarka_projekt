'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star } from 'lucide-react'
import TrackedLink from '@/components/TrackedLink'
import { api } from '@/lib/api'

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const AVATAR_FALLBACK_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="#222" width="64" height="64"/><circle cx="32" cy="24" r="10" fill="#555"/><path fill="#555" d="M16 56c0-12 8-20 16-20s16 8 16 20"/></svg>',
)}`

function FreelancerAvatar({
  image,
  avatarUrl,
}: {
  image: string
  avatarUrl?: string | null
}) {
  const primary = (avatarUrl?.trim() || image).trim() || image
  const [src, setSrc] = useState(primary)

  useEffect(() => {
    setSrc((avatarUrl?.trim() || image).trim() || image)
  }, [avatarUrl, image])

  const onError = useCallback(() => {
    setSrc((prev) => {
      if (prev !== image && image) return image
      if (prev !== AVATAR_FALLBACK_SVG) return AVATAR_FALLBACK_SVG
      return prev
    })
  }, [image])

  return (
    <img
      src={src}
      alt=""
      className="h-16 w-16 rounded-full border-2 border-white/[0.1] object-cover ring-2 ring-card"
      loading="lazy"
      decoding="async"
      onError={onError}
    />
  )
}

interface TopFreelancer {
  id: string
  adId: string
  name: string
  title: string
  image: string
  avatarUrl?: string | null
  adsCount: number
  price: number
}

export default function TopFreelancers() {
  const [mounted, setMounted] = useState(false)
  const [title, setTitle] = useState('Top freelanceri')
  const [limit, setLimit] = useState(4)
  const [freelancers, setFreelancers] = useState<TopFreelancer[]>([])
  const [ratings, setRatings] = useState<Record<string, { count: number; average: number }>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const load = async () => {
      let newLimit = 4
      try {
        const config = (await api.getPlatformConfig()) as {
          topFreelancersTitle?: string
          topFreelancersLimit?: number
        }
        setTitle(config.topFreelancersTitle || 'Top freelanceri')
        const l = Number(config.topFreelancersLimit)
        newLimit = !isNaN(l) && l >= 1 ? Math.min(12, l) : 4
        setLimit(newLimit)
      } catch {
        /* použijeme predvolené hodnoty */
      }
      try {
        const data = (await api.getTopFreelancers(newLimit)) as TopFreelancer[]
        setFreelancers(Array.isArray(data) ? data : [])
        if (data?.length) {
          const entries = await Promise.all(
            data.map(async (f: TopFreelancer) => {
              try {
                const stats = await api.getUserReviewStats(f.id)
                return [f.id, stats] as const
              } catch {
                return [f.id, { count: 0, average: 0 }] as const
              }
            })
          )
          setRatings(Object.fromEntries(entries))
        }
      } catch {
        setFreelancers([])
      }
    }
    load()
  }, [])

  if (freelancers.length === 0) return null

  return (
    <section className="border-t border-white/[0.06] bg-surface py-16">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="font-serif text-3xl font-bold text-accent md:text-4xl">{title}</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {freelancers.map((freelancer) => (
            <TrackedLink
              key={freelancer.id}
              href={freelancer.adId ? `/inzerat/${freelancer.adId}` : `/dashboard`}
              targetType="AD"
              targetId={freelancer.adId || freelancer.id}
              className="group block"
            >
              <article className="card card-hover flex h-full flex-col p-5 shadow-lg shadow-black/15 transition-all duration-200">
                <div className="mb-4 flex items-center gap-4">
                  <FreelancerAvatar image={freelancer.image} avatarUrl={freelancer.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-base font-semibold text-white transition-colors group-hover:text-accent-light">
                      {freelancer.name}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">{freelancer.title}</p>
                  </div>
                </div>
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                  <span className="text-sm text-muted">
                    {mounted ? formatNumber(freelancer.adsCount) : freelancer.adsCount}{' '}
                    {freelancer.adsCount === 1 ? 'inzerát' : freelancer.adsCount < 5 ? 'inzeráty' : 'inzerátov'}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" aria-hidden />
                    <span className="text-sm font-semibold text-white">
                      {(ratings[freelancer.id]?.count ?? 0) > 0 ? ratings[freelancer.id].average.toFixed(1) : '–'}
                    </span>
                    <span className="text-xs text-muted">({ratings[freelancer.id]?.count ?? 0})</span>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Predajca
                  </span>
                  {freelancer.price > 0 && (
                    <span className="text-lg font-bold tabular-nums text-accent">
                      Od {freelancer.price}€
                    </span>
                  )}
                </div>
              </article>
            </TrackedLink>
          ))}
        </div>
      </div>
    </section>
  )
}
