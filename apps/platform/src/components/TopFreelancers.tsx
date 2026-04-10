'use client'

import { useState, useEffect } from 'react'
import TrackedLink from '@/components/TrackedLink'
import { api } from '@/lib/api'

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

interface TopFreelancer {
  id: string
  adId: string
  name: string
  title: string
  image: string
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
                  <img
                    src={freelancer.image}
                    alt={freelancer.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-[#c9a96e] transition-colors">
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
                <span className="text-xs px-2 py-1 bg-accent/15 text-accent rounded">
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
