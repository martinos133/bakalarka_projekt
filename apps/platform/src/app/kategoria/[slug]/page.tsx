'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import TrackedLink from '@/components/TrackedLink'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function CategoryPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [category, setCategory] = useState<any>(null)
  const [advertisements, setAdvertisements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [subcategories, setSubcategories] = useState<any[]>([])

  useEffect(() => {
    if (slug) {
      loadCategory()
      loadAdvertisements()
    }
  }, [slug])

  const loadCategory = async () => {
    try {
      const data = await api.getCategoryBySlug(slug)
      setCategory(data)
      // Načítaj podkategórie ak existujú
      if (data.children && data.children.length > 0) {
        setSubcategories(data.children.filter((child: any) => child.status === 'ACTIVE'))
      }
    } catch (error) {
      console.error('Chyba pri načítaní kategórie:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAdvertisements = async () => {
    try {
      const data = await api.getAdvertisementsByCategory(slug)
      setAdvertisements(data)
    } catch (error) {
      console.error('Chyba pri načítaní inzerátov:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center text-gray-500">Načítavam...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Kategória nebola nájdená</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Späť na domov
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Banner */}
      {category.banner ? (
        <div className="w-full flex justify-center px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Banner kontajner s presnými rozmermi 1200×400px (pomer 3:1) */}
          <div 
            className="relative w-full max-w-[1200px] rounded-xl overflow-hidden shadow-2xl"
            style={{ 
              aspectRatio: '3 / 1',
              height: '400px'
            }}
          >
            <img
              src={category.banner}
              alt={category.bannerAlt || category.name}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ 
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
            {/* Gradient overlay pre lepšiu čitateľnosť textu */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Content overlay - text v strede */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-6 md:px-12">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-4 leading-tight">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-lg md:text-xl lg:text-2xl text-white/95 max-w-2xl mx-auto leading-relaxed">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Fallback ak nie je banner */
        <div className="w-full bg-gradient-to-r from-gray-800 to-gray-900 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
                {category.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Obsah */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-gray-900">
                Domov
              </Link>
            </li>
            <li>/</li>
            {category.parent && (
              <>
                <li>
                  <Link href={`/kategoria/${category.parent.slug}`} className="hover:text-gray-900">
                    {category.parent.name}
                  </Link>
                </li>
                <li>/</li>
              </>
            )}
            <li className="text-gray-900 font-medium">{category.name}</li>
          </ol>
        </nav>

        {/* Podkategórie */}
        {subcategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Podkategórie</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subcategories.map((subcategory) => (
                <TrackedLink
                  key={subcategory.id}
                  href={`/kategoria/${subcategory.slug}`}
                  targetType="CATEGORY"
                  targetId={subcategory.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 border border-gray-200 block"
                >
                  {subcategory.image && (
                    <img
                      src={subcategory.image}
                      alt={subcategory.imageAlt || subcategory.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-gray-900">{subcategory.name}</h3>
                  {subcategory.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {subcategory.description}
                    </p>
                  )}
                  {subcategory._count?.advertisements > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {subcategory._count.advertisements} {subcategory._count.advertisements === 1 ? 'inzerát' : 'inzerátov'}
                    </p>
                  )}
                </TrackedLink>
              ))}
            </div>
          </div>
        )}

        {/* Inzeráty */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Inzeráty ({advertisements.length})
            </h2>
          </div>

          {advertisements.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-600 mb-4">V tejto kategórii zatiaľ nie sú žiadne inzeráty.</p>
              <Link
                href="/dashboard"
                className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Vytvoriť inzerát
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advertisements.map((ad) => (
                <TrackedLink
                  key={ad.id}
                  href={`/inzerat/${ad.id}`}
                  targetType="AD"
                  targetId={ad.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group block"
                >
                  {ad.images && ad.images.length > 0 && (
                    <div className="relative w-full h-48 overflow-hidden">
                      <img
                        src={ad.images[0]}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {ad.title}
                    </h3>
                    {ad.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {ad.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {ad.price && (
                        <span className="text-lg font-bold text-green-600">
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
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
