'use client'

import { useState, useEffect, useCallback } from 'react'
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
      className="h-16 w-16 rounded-full border-2 border-dark-200 object-cover"
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
    <section className="py-16 bg-dark-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {freelancers.map((freelancer) => (
            <TrackedLink
              key={freelancer.id}
              href={freelancer.adId ? `/inzerat/${freelancer.adId}` : `/dashboard`}
              targetType="AD"
              targetId={freelancer.adId || freelancer.id}
              className="bg-dark p-6 rounded-lg hover:shadow-lg transition-shadow cursor-pointer group block"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <FreelancerAvatar image={freelancer.image} avatarUrl={freelancer.avatarUrl} />
                  <div
                    className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-dark-200 bg-accent"
                    aria-hidden
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white transition-colors group-hover:text-accent">
                    {freelancer.name}
                  </h3>
                  <p className="text-sm text-gray-500">{freelancer.title}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">
                  {mounted ? formatNumber(freelancer.adsCount) : freelancer.adsCount}{' '}
                  {freelancer.adsCount === 1 ? 'inzerát' : freelancer.adsCount < 5 ? 'inzeráty' : 'inzerátov'}
                </span>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-accent fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="text-sm font-semibold text-white">
                    {(ratings[freelancer.id]?.count ?? 0) > 0 ? ratings[freelancer.id].average.toFixed(1) : '–'}
                  </span>
                  <span className="text-xs text-gray-500">({ratings[freelancer.id]?.count ?? 0})</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded border border-accent-dark bg-dark-200 px-2 py-1 text-xs text-accent">
                  Predajca
                </span>
                {freelancer.price > 0 && (
                  <span className="text-lg font-bold text-white">
                    Od {freelancer.price}€
                  </span>
                )}
              </div>
            </TrackedLink>
          ))}
        </div>
      </div>
    </section>
  )
}
