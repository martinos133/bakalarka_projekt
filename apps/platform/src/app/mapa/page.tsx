'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { api } from '@/lib/api'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { getCoordsFromLocation } from '@/lib/mapRegions'

const AdMap = dynamic(() => import('@/components/AdMap'), { ssr: false })

interface MapAd {
  id: string
  title: string
  location: string | null
  latitude: number | null
  longitude: number | null
  type: string
  price: number | null
  image: string | null
  category: { id: string; name: string; slug: string } | null
}

export default function MapPage() {
  const [categoryId, setCategoryId] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [list, setList] = useState<MapAd[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    api.getCategories().then((data: any[]) => {
      const flat = (data || []).flatMap((c) =>
        c.children && c.children.length
          ? [{ id: c.id, name: c.name, slug: c.slug }, ...(c.children || [])]
          : [{ id: c.id, name: c.name, slug: c.slug }]
      )
      const uniq = new Map<string, { id: string; name: string; slug: string }>()
      flat.forEach((c) => {
        if (!uniq.has(c.id)) uniq.set(c.id, c)
      })
      setCategories(Array.from(uniq.values()))
    }).catch(() => [])
  }, [])

  // Načítanie inzerátov – bez výberu kraja všetky, s výberom kraja filtrované
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .getAdvertisementsForMap({
        categoryId: categoryId || undefined,
        type: typeFilter || undefined,
        region: regionFilter.trim() || undefined,
      })
      .then((data) => {
        if (!cancelled) setList(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setList([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [categoryId, typeFilter, regionFilter])

  const points = useMemo(() => {
    return list
      .map((ad) => {
        let lat: number | null = null
        let lng: number | null = null
        if (ad.latitude != null && ad.longitude != null) {
          lat = ad.latitude
          lng = ad.longitude
        } else {
          const coords = getCoordsFromLocation(ad.location)
          if (coords) {
            lat = coords[0]
            lng = coords[1]
          }
        }
        if (lat == null || lng == null) return null
        return { ...ad, lat, lng }
      })
      .filter((p): p is MapAd & { lat: number; lng: number } => p != null)
  }, [list])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <CategoryNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        <nav className="mb-4">
          <ol className="flex items-center gap-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-[#1dbf73]">Domov</Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Mapa inzerátov</li>
          </ol>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Mapa inzerátov
        </h1>

        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
          >
            <option value="">Všetky kategórie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
          >
            <option value="">Služby aj prenájom</option>
            <option value="SERVICE">Služby</option>
            <option value="RENTAL">Prenájom</option>
          </select>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
          >
            <option value="">Všetky kraje</option>
            <option value="Bratislava">Bratislavský</option>
            <option value="Trnava">Trnavský</option>
            <option value="Trenčín">Trenčiansky</option>
            <option value="Nitra">Nitriansky</option>
            <option value="Žilina">Žilinský</option>
            <option value="Banská Bystrica">Banskobystrický</option>
            <option value="Prešov">Prešovský</option>
            <option value="Košice">Košický</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setCategoryId('')
              setTypeFilter('')
              setRegionFilter('')
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Resetovať filtre
          </button>
        </div>

        {!mounted ? (
          <div className="min-h-[500px] flex items-center justify-center text-gray-500">
            Načítavam...
          </div>
        ) : (
          <>
            {loading && (
              <p className="text-sm text-gray-500 mb-2">Načítavam inzeráty...</p>
            )}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Mapa */}
              <div className="lg:flex-1 min-h-[400px] lg:min-h-[560px] rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                <AdMap
                  key="sk-map"
                  points={points}
                  selectedPointId={selectedAdId}
                  onMarkerClick={(id) => setSelectedAdId(id)}
                />
              </div>
              {/* Zoznam inzerátov */}
              <div className="w-full lg:w-96 flex-shrink-0">
                <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-semibold text-gray-900">
                      Inzeráty na mape
                      <span className="ml-2 text-sm font-normal text-gray-500">({points.length})</span>
                    </h2>
                  </div>
                  <div className="max-h-[400px] lg:max-h-[520px] overflow-y-auto">
                    {points.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500">
                        {regionFilter
                          ? 'V zvolenom kraji nie sú žiadne inzeráty so zadanou lokalitou.'
                          : 'Žiadne inzeráty so zadanou lokalitou. Inzeráty s vyplnenou lokalitou (napr. Bratislava, Košice) sa zobrazia ako bodky na mape.'}
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {points.map((ad) => (
                          <li key={ad.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedAdId(ad.id)}
                              className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3 ${selectedAdId === ad.id ? 'bg-[#1dbf73]/10 ring-inset ring-2 ring-[#1dbf73]' : ''}`}
                            >
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                {ad.image ? (
                                  <img src={ad.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">?</div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                {ad.category && (
                                  <span className="text-xs text-gray-500">{ad.category.name}</span>
                                )}
                                <p className="font-medium text-gray-900 truncate mt-0.5">{ad.title}</p>
                                {ad.location && (
                                  <p className="text-xs text-gray-600 mt-0.5">📍 {ad.location}</p>
                                )}
                                {ad.price != null && (
                                  <p className="text-sm font-semibold text-[#1dbf73] mt-1">{ad.price.toFixed(2)} €</p>
                                )}
                                <Link
                                  href={`/inzerat/${ad.id}`}
                                  className="inline-block text-sm font-medium text-[#1dbf73] hover:underline mt-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Zobraziť inzerát →
                                </Link>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {points.length > 0
                ? <>Zobrazených {points.length} inzerátov na mape{list.length !== points.length && list.length > 0 && <> ({list.length - points.length} bez lokality sa nezobrazujú)</>}</>
                : 'Inzeráty s vyplnenou lokalitou (kraj alebo mesto) sa zobrazia ako bodky. Môžete filtrovať podľa kategórie, typu a kraja.'}
            </p>
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
