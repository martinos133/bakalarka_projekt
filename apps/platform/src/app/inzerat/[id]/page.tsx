'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import ImageCarousel from '@/components/ImageCarousel'
import { api } from '@/lib/api'

interface Advertisement {
  id: string
  title: string
  description: string
  price?: number
  images: string[]
  category?: {
    name: string
  }
  location?: string
  user?: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
  }
  createdAt: string
}

export default function AdvertisementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdvertisement()
  }, [id])

  const loadAdvertisement = async () => {
    try {
      setLoading(true)
      const data = await api.getAdvertisement(id)
      setAdvertisement(data)
    } catch (error) {
      console.error('Chyba pri načítaní inzerátu:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <CategoryNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center text-gray-500">Načítavam...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!advertisement) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <CategoryNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Inzerát nebol nájdený
            </h1>
            <Link
              href="/"
              className="text-[#1dbf73] hover:underline"
            >
              Späť na hlavnú stránku
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const sellerName = advertisement.user 
    ? `${advertisement.user.firstName || ''} ${advertisement.user.lastName || ''}`.trim() || 'Anonymný používateľ'
    : 'Anonymný používateľ'

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <CategoryNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-[#1dbf73]">
                Domov
              </Link>
            </li>
            <li>/</li>
            {advertisement.category && (
              <li>
                <Link href="/" className="hover:text-[#1dbf73]">
                  {advertisement.category.name}
                </Link>
              </li>
            )}
            <li>/</li>
            <li className="text-gray-900">{advertisement.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {advertisement.title}
            </h1>

            {/* Seller Info */}
            {advertisement.user && (
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-xl">
                  {sellerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {sellerName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-yellow-400 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">
                        5.0
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">(0 recenzií)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Images Carousel */}
            {advertisement.images && advertisement.images.length > 0 ? (
              <ImageCarousel
                images={advertisement.images}
                title={advertisement.title}
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center mb-8">
                <span className="text-gray-400">Žiadny obrázok</span>
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                O tejto službe
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {advertisement.description}
                </p>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Recenzie (0)
              </h2>
              <div className="text-center text-gray-500 py-8">
                Zatiaľ žiadne recenzie
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Price Card */}
              <div className="border border-gray-200 rounded-lg p-6 mb-6">
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {advertisement.price ? `${advertisement.price.toFixed(2)}€` : 'Na dohodu'}
                    </span>
                    {advertisement.price && (
                      <span className="text-gray-500">Začínajúc od</span>
                    )}
                  </div>
                </div>
                <button className="w-full bg-[#1dbf73] text-white py-3 rounded-md font-semibold hover:bg-[#19a463] transition-colors mb-4">
                  Pokračovať
                </button>
                <button className="w-full border-2 border-gray-300 text-gray-900 py-3 rounded-md font-semibold hover:border-gray-400 transition-colors">
                  Uložiť do obľúbených
                </button>
              </div>

              {/* Seller Card */}
              {advertisement.user && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-xl">
                      {sellerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {sellerName}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <svg
                          className="w-4 h-4 text-yellow-400 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900">
                          5.0
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    {advertisement.location && (
                      <div className="flex justify-between">
                        <span>Lokalita:</span>
                        <span className="font-medium">{advertisement.location}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Člen od:</span>
                      <span className="font-medium">
                        {new Date(advertisement.createdAt).getFullYear()}
                      </span>
                    </div>
                  </div>
                  <button className="w-full mt-4 border border-gray-300 text-gray-900 py-2 rounded-md font-medium hover:border-gray-400 transition-colors">
                    Kontaktovať predajcu
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
