'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import ImageCarousel from '@/components/ImageCarousel'
import { api } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { ChevronDown, ChevronUp, Flag, AlertCircle, X, Check } from 'lucide-react'

interface ServicePackage {
  name: string
  description: string
  price: number
  deliveryTime: string
  features: string[]
}

interface FAQ {
  question: string
  answer: string
}

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
  type?: 'SERVICE' | 'RENTAL'
  pricingType?: 'FIXED' | 'HOURLY' | 'DAILY' | 'PACKAGE'
  hourlyRate?: number
  dailyRate?: number
  packages?: ServicePackage[]
  deliveryTime?: string
  revisions?: string
  features?: string[]
  faq?: FAQ[]
}

export default function AdvertisementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState<string>('')
  const [reportDescription, setReportDescription] = useState<string>('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

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

  const handleReport = async () => {
    if (!reportReason) {
      return
    }

    if (!isAuthenticated()) {
      // Presmerovať na prihlásenie
      window.location.href = '/signin?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }

    try {
      setReportSubmitting(true)
      await api.createReport({
        advertisementId: id,
        reason: reportReason,
        description: reportDescription || undefined,
      })
      setReportSuccess(true)
      setTimeout(() => {
        setShowReportModal(false)
        setReportReason('')
        setReportDescription('')
        setReportSuccess(false)
      }, 2000)
    } catch (error: any) {
      console.error('Chyba pri nahlásení inzerátu:', error)
      alert(error?.message || 'Chyba pri nahlásení inzerátu')
    } finally {
      setReportSubmitting(false)
    }
  }

  const reportReasons = [
    { value: 'SPAM', label: 'Spam' },
    { value: 'INAPPROPRIATE', label: 'Nevhodný obsah' },
    { value: 'FAKE', label: 'Falošný inzerát' },
    { value: 'SCAM', label: 'Podvod' },
    { value: 'COPYRIGHT', label: 'Porušenie autorských práv' },
    { value: 'OTHER', label: 'Iné' },
  ]

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

            {/* Service Details */}
            {advertisement.type === 'SERVICE' && (
              <>
                {/* Features */}
                {advertisement.features && advertisement.features.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Čo je zahrnuté
                    </h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {advertisement.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-[#1dbf73] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Packages */}
                {advertisement.pricingType === 'PACKAGE' && advertisement.packages && advertisement.packages.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Balíčky služieb
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {advertisement.packages.map((pkg, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                          <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                          <div className="mb-4">
                            <div className="text-3xl font-bold text-gray-900 mb-1">{pkg.price}€</div>
                            {pkg.deliveryTime && (
                              <div className="text-sm text-gray-500">Dodanie: {pkg.deliveryTime}</div>
                            )}
                          </div>
                          {pkg.features && pkg.features.length > 0 && (
                            <ul className="space-y-2 mb-4">
                              {pkg.features.map((feature, fIdx) => (
                                <li key={fIdx} className="flex items-start gap-2 text-sm text-gray-700">
                                  <svg className="w-4 h-4 text-[#1dbf73] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <button className="w-full bg-[#1dbf73] text-white py-2 rounded-md font-semibold hover:bg-[#19a463] transition-colors">
                            Vybrať balíček
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ */}
                {advertisement.faq && advertisement.faq.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Často kladené otázky
                    </h2>
                    <div className="space-y-3">
                      {advertisement.faq.map((faq, idx) => (
                        <div 
                          key={idx} 
                          className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                        >
                          <button
                            onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                          >
                            <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                            <div className="flex-shrink-0">
                              {expandedFAQ === idx ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                          </button>
                          {expandedFAQ === idx && (
                            <div className="px-6 pb-4 pt-0">
                              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

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
                  {advertisement.type === 'SERVICE' && advertisement.pricingType === 'HOURLY' && advertisement.hourlyRate ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                          {advertisement.hourlyRate.toFixed(2)}€
                        </span>
                        <span className="text-gray-500">/ hodina</span>
                      </div>
                      {advertisement.deliveryTime && (
                        <div className="text-sm text-gray-600 mt-2">
                          ⏱ Dodanie: {advertisement.deliveryTime}
                        </div>
                      )}
                    </div>
                  ) : advertisement.type === 'SERVICE' && advertisement.pricingType === 'DAILY' && advertisement.dailyRate ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                          {advertisement.dailyRate.toFixed(2)}€
                        </span>
                        <span className="text-gray-500">/ deň</span>
                      </div>
                      {advertisement.deliveryTime && (
                        <div className="text-sm text-gray-600 mt-2">
                          ⏱ Dodanie: {advertisement.deliveryTime}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {advertisement.price ? `${advertisement.price.toFixed(2)}€` : 'Na dohodu'}
                      </span>
                      {advertisement.price && (
                        <span className="text-gray-500">Začínajúc od</span>
                      )}
                    </div>
                  )}
                  {advertisement.type === 'SERVICE' && advertisement.revisions && (
                    <div className="text-sm text-gray-600 mt-2">
                      🔄 Revízie: {advertisement.revisions}
                    </div>
                  )}
                </div>
                <button className="w-full bg-[#1dbf73] text-white py-3 rounded-md font-semibold hover:bg-[#19a463] transition-colors mb-4">
                  Pokračovať
                </button>
                  <button className="w-full border-2 border-gray-300 text-gray-900 py-3 rounded-md font-semibold hover:border-gray-400 transition-colors mb-4">
                    Uložiť do obľúbených
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 py-3 rounded-md font-semibold hover:border-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    Nahlásiť inzerát
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-600" />
                  Nahlásiť inzerát
                </h2>
                <button
                  onClick={() => {
                    setShowReportModal(false)
                    setReportReason('')
                    setReportDescription('')
                    setReportSuccess(false)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {reportSuccess ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ďakujeme za nahlásenie
                </h3>
                <p className="text-gray-600 text-sm">
                  Váš report bol úspešne odoslaný. Náš tím to skontroluje.
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dôvod nahlásenia <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                  >
                    <option value="">Vyberte dôvod...</option>
                    {reportReasons.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Popis problému (voliteľné)
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Poskytnite viac informácií o probléme..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <p>
                    Nahlásené inzeráty sú kontrolované našim tímom. Inzerát zostane aktívny, pokiaľ ho nerozhodneme odstrániť.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowReportModal(false)
                      setReportReason('')
                      setReportDescription('')
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Zrušiť
                  </button>
                  <button
                    onClick={handleReport}
                    disabled={!reportReason || reportSubmitting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {reportSubmitting ? 'Odosielam...' : 'Nahlásiť'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
