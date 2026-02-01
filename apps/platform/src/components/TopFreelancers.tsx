'use client'

import { useState, useEffect } from 'react'
import TrackedLink from '@/components/TrackedLink'

// Funkcia na konzistentné formátovanie čísel bez locale závislosti
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function TopFreelancers() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const freelancers = [
    {
      id: '1',
      name: 'Ján Novák',
      title: 'Profesionálny dizajnér loga',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      rating: 5.0,
      reviews: 1247,
      price: 25,
      badge: 'Predajca úrovne 2',
    },
    {
      id: '2',
      name: 'Jana Nováková',
      title: 'WordPress expert',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      rating: 4.9,
      reviews: 892,
      price: 30,
      badge: 'Top hodnotený',
    },
    {
      id: '4',
      name: 'Michal Horváth',
      title: 'Editor videa',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      rating: 5.0,
      reviews: 1563,
      price: 35,
      badge: 'Predajca úrovne 2',
    },
    {
      id: '7',
      name: 'Zuzana Kováčová',
      title: 'Pisovateľka obsahu',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
      rating: 4.8,
      reviews: 678,
      price: 20,
      badge: 'Nový predajca',
    },
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Top freelanceri
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {freelancers.map((freelancer, index) => (
            <TrackedLink
              key={freelancer.id}
              href={`/inzerat/${freelancer.id}`}
              targetType="AD"
              targetId={freelancer.id}
              className="bg-white p-6 rounded-lg hover:shadow-lg transition-shadow cursor-pointer group block"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <img
                    src={freelancer.image}
                    alt={freelancer.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#1dbf73] transition-colors">
                    {freelancer.name}
                  </h3>
                  <p className="text-sm text-gray-600">{freelancer.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-3">
                <svg
                  className="w-4 h-4 text-yellow-400 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                <span className="text-sm font-semibold text-gray-900">
                  {freelancer.rating}
                </span>
                <span className="text-sm text-gray-500" suppressHydrationWarning>
                  ({mounted ? formatNumber(freelancer.reviews) : freelancer.reviews.toString()})
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  {freelancer.badge}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  Od {freelancer.price}€
                </span>
              </div>
            </TrackedLink>
          ))}
        </div>
      </div>
    </section>
  )
}
