'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface MadeOnRentMeItem {
  id: string
  title: string
  image: string
  description: string
  href: string
  order: number
}

export default function MadeOnRentMe() {
  const [items, setItems] = useState<MadeOnRentMeItem[]>([])

  useEffect(() => {
    api
      .getMadeOnRentMe()
      .then((data: { items: MadeOnRentMeItem[] }) => {
        setItems((data.items || []).sort((a, b) => a.order - b.order))
      })
      .catch(() => {})
  }, [])

  if (items.length === 0) return null

  return (
    <section className="py-16 bg-dark-50 border-t border-white/[0.04]">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-accent text-sm font-semibold uppercase tracking-[0.2em] mb-3">Portfólio</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Vytvorené na <span className="font-serif italic">RentMe</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group cursor-pointer overflow-hidden rounded-lg"
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-accent transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
