'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import TrackedLink from '@/components/TrackedLink'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { CmsGate } from '@/components/CmsGate'

function SearchPageInner() {
  const searchParams = useSearchParams()
  const q = searchParams?.get('q') || ''
  const [advertisements, setAdvertisements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (q.trim()) {
      loadSearch()
    } else {
      setAdvertisements([])
      setLoading(false)
    }
  }, [q])

  const loadSearch = async () => {
    try {
      setLoading(true)
      const data = await api.searchAdvertisements(q)
      setAdvertisements(data)
    } catch (error) {
      console.error('Chyba pri vyhľadávaní:', error)
      setAdvertisements([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-50">
      <Header />
      <CategoryNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-white">
                Domov
              </Link>
            </li>
            <li>/</li>
            <li className="text-white font-medium">Vyhľadávanie</li>
          </ol>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
          {q.trim() ? (
            <>Výsledky pre „{q}"</>
          ) : (
            <>Vyhľadávanie</>
          )}
        </h1>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Načítavam...</div>
        ) : !q.trim() ? (
          <div className="bg-dark rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">Zadajte hľadaný výraz do vyhľadávacieho poľa v hlavičke.</p>
            <Link
              href="/"
              className="inline-block bg-accent hover:bg-accent-light text-white px-6 py-2 rounded-lg transition-colors"
            >
              Späť na domov
            </Link>
          </div>
        ) : advertisements.length === 0 ? (
          <div className="bg-dark rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">Nenašli sme žiadne inzeráty pre „{q}"</p>
            <p className="text-sm text-gray-500 mb-6">Skúste zmeniť hľadaný výraz alebo prehľadávať podľa kategórie.</p>
            <Link
              href="/"
              className="inline-block bg-accent hover:bg-accent-light text-white px-6 py-2 rounded-lg transition-colors"
            >
              Prehľadať všetky inzeráty
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-gray-500 mb-6">
              Nájdených {advertisements.length} {advertisements.length === 1 ? 'inzerát' : 'inzerátov'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advertisements.map((ad) => (
                <TrackedLink
                  key={ad.id}
                  href={`/inzerat/${ad.id}`}
                  targetType="AD"
                  targetId={ad.id}
                  className="bg-dark rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group block"
                >
                  {ad.images && ad.images.length > 0 ? (
                    <div className="relative w-full h-48 overflow-hidden">
                      <img
                        src={ad.images[0]}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-dark-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">Bez obrázka</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">
                      {ad.title}
                    </h3>
                    {ad.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {ad.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {ad.price && (
                        <span className="text-lg font-bold text-accent">
                          {ad.price.toLocaleString('sk-SK')} €
                        </span>
                      )}
                      {ad.location && (
                        <span className="text-sm text-gray-500">
                          📍 {ad.location}
                        </span>
                      )}
                    </div>
                  </div>
                </TrackedLink>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <CmsGate cmsSlug="vyhladavanie">
      <SearchPageInner />
    </CmsGate>
  )
}
