'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { CmsArticleView, CmsLoadingView } from '@/components/CmsGate'
import ImageCarousel from '@/components/ImageCarousel'
import DatePicker from '@/components/DatePicker'
import { api } from '@/lib/api'
import { useCmsOverride } from '@/lib/useCmsOverride'
import { isAuthenticated } from '@/lib/auth'
import { isProSellerBadge } from '@/lib/sellerPlan'
import type { Filter } from '@inzertna-platforma/shared'
import { ChevronDown, ChevronUp, Flag, AlertCircle, X, Check, MessageSquare, Phone, Heart } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'
import type { DateRange } from 'react-day-picker'

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

function formatSpecificationValue(f: Filter, value: unknown): string {
  if (value === undefined || value === null || value === '') return ''
  if (f.type === 'BOOLEAN') return value ? 'Áno' : 'Nie'
  if (f.type === 'MULTISELECT' && Array.isArray(value)) return value.join(', ')
  if (f.type === 'RANGE' && value && typeof value === 'object' && !Array.isArray(value)) {
    const o = value as Record<string, unknown>
    const a = o.min != null ? String(o.min) : ''
    const b = o.max != null ? String(o.max) : ''
    if (a && b) return `${a} – ${b}`
    if (a) return `od ${a}`
    if (b) return `do ${b}`
    return ''
  }
  if (f.type === 'DATE' && typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('sk-SK')
  }
  if (f.type === 'NUMBER' && (typeof value === 'number' || typeof value === 'string')) {
    const n = typeof value === 'number' ? value : parseFloat(value)
    return Number.isNaN(n) ? String(value) : n.toLocaleString('sk-SK')
  }
  return String(value)
}

interface Advertisement {
  id: string
  title: string
  description: string
  price?: number
  images: string[]
  categoryId?: string
  specifications?: Record<string, unknown> | null
  category?: {
    id?: string
    name: string
  }
  location?: string
  priorityBoosted?: boolean
  user?: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    sellerPlan?: string
    sellerPlanValidUntil?: string | null
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
  const cmsDetailSlug = `inzerat-${id}`
  const { loading: cmsLoading, page: cmsPage } = useCmsOverride(cmsDetailSlug)
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState<string>('')
  const [reportDescription, setReportDescription] = useState<string>('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactMode, setContactMode] = useState<'choice' | 'chat' | 'phone'>('choice')
  const [inquirySubject, setInquirySubject] = useState('')
  const [inquiryContent, setInquiryContent] = useState('')
  const [inquirySubmitting, setInquirySubmitting] = useState(false)
  const [inquirySuccess, setInquirySuccess] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [showContinueModal, setShowContinueModal] = useState(false)
  const [continueSubject, setContinueSubject] = useState('')
  const [continueContent, setContinueContent] = useState('')
  const [continueServiceDate, setContinueServiceDate] = useState<Date | undefined>(undefined)
  const [continueRentalRange, setContinueRentalRange] = useState<DateRange | undefined>(undefined)
  const [continueSubmitting, setContinueSubmitting] = useState(false)
  const [continueSuccess, setContinueSuccess] = useState(false)
  const [categorySpecFilters, setCategorySpecFilters] = useState<Filter[]>([])

  useEffect(() => {
    loadAdvertisement()
  }, [id])

  useEffect(() => {
    const cid = advertisement?.categoryId || advertisement?.category?.id
    if (!cid) {
      setCategorySpecFilters([])
      return
    }
    let cancelled = false
    api
      .getActiveFilters(cid)
      .then((rows) => {
        if (!cancelled) setCategorySpecFilters(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {
        if (!cancelled) setCategorySpecFilters([])
      })
    return () => {
      cancelled = true
    }
  }, [advertisement?.categoryId, advertisement?.category?.id])

  const loadAdvertisement = async () => {
    try {
      setLoading(true)
      const data = await api.getAdvertisement(id)
      setAdvertisement(data)
      if (isAuthenticated()) {
        try {
          const { isFavorite: fav } = await api.checkFavorite(id)
          setIsFavorite(fav)
        } catch {
          setIsFavorite(false)
        }
      }
    } catch (error) {
      console.error('Chyba pri načítaní inzerátu:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!isAuthenticated()) {
      window.location.href = `/signin?redirect=/inzerat/${id}`
      return
    }
    try {
      setFavoriteLoading(true)
      if (isFavorite) {
        await api.removeFavorite(id)
        setIsFavorite(false)
      } else {
        await api.addFavorite(id)
        setIsFavorite(true)
      }
    } catch (err: any) {
      console.error('Chyba pri obľúbených:', err)
    } finally {
      setFavoriteLoading(false)
    }
  }

  if (cmsLoading) {
    return <CmsLoadingView shell="withCategoryNav" />
  }
  if (cmsPage) {
    return (
      <CmsArticleView
        shell="withCategoryNav"
        slug={cmsDetailSlug}
        title={cmsPage.title}
        content={cmsPage.content}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark">
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
      <div className="min-h-screen bg-dark">
        <Header />
        <CategoryNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">
              Inzerát nebol nájdený
            </h1>
            <Link
              href="/"
              className="text-accent hover:underline"
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

  const handleContactClick = () => {
    setShowContactModal(true)
    setContactMode('choice')
    setInquirySubject(`Dotaz k inzerátu: ${advertisement?.title || ''}`)
    setInquiryContent('')
  }

  const handleContinueClick = () => {
    if (!isAuthenticated()) {
      window.location.href = `/signin?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }
    const isService = advertisement?.type === 'SERVICE'
    setContinueSubject(
      isService
        ? `Žiadosť o konzultáciu: ${advertisement?.title || ''}`
        : `Žiadosť o rezerváciu: ${advertisement?.title || ''}`
    )
    setContinueContent('')
    setContinueServiceDate(undefined)
    setContinueRentalRange(undefined)
    setContinueSuccess(false)
    setShowContinueModal(true)
  }

  const formatDateForDisplay = (d?: Date) => {
    if (!d) return ''
    return d.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const handleContinueSubmit = async () => {
    const isService = advertisement?.type === 'SERVICE'
    if (!continueSubject.trim()) return
    if (isService) {
      if (!continueServiceDate) {
        alert('Vyberte dátum, od kedy chcete využívať službu.')
        return
      }
    } else {
      const from = continueRentalRange?.from
      const to = continueRentalRange?.to
      if (!from || !to) {
        alert('Vyberte dátumy rezervácie (od – do).')
        return
      }
      if (from > to) {
        alert('Dátum „do“ musí byť neskôr ako dátum „od“.')
        return
      }
    }
    if (!continueContent.trim()) {
      alert('Napíšte doplňujúcu správu pre predajcu.')
      return
    }

    const dateBlock = isService
      ? `--- DÁTUM ---\nOd kedy chcete využívať službu: ${formatDateForDisplay(continueServiceDate)}\n---------------\n\n`
      : `--- REZERVÁCIA ---\nOd: ${formatDateForDisplay(continueRentalRange?.from)}\nDo: ${formatDateForDisplay(continueRentalRange?.to)}\n---------------\n\n`
    const fullContent = dateBlock + continueContent.trim()

    try {
      setContinueSubmitting(true)
      await api.createInquiry({
        advertisementId: id,
        subject: continueSubject.trim(),
        content: fullContent,
      })
      setContinueSuccess(true)
      setTimeout(() => {
        setShowContinueModal(false)
        setContinueSuccess(false)
      }, 2000)
    } catch (error: any) {
      alert(error?.message || 'Chyba pri odoslaní')
    } finally {
      setContinueSubmitting(false)
    }
  }

  const handleContactChat = () => {
    if (!isAuthenticated()) {
      window.location.href = '/signin?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }
    setContactMode('chat')
  }

  const handleContactPhone = () => {
    setContactMode('phone')
  }

  const handleInquirySubmit = async () => {
    if (!inquirySubject.trim() || !inquiryContent.trim()) return
    try {
      setInquirySubmitting(true)
      await api.createInquiry({
        advertisementId: id,
        subject: inquirySubject.trim(),
        content: inquiryContent.trim(),
      })
      setInquirySuccess(true)
      setTimeout(() => {
        setShowContactModal(false)
        setInquirySuccess(false)
        setContactMode('choice')
      }, 2000)
    } catch (error: any) {
      alert(error?.message || 'Chyba pri odoslaní správy')
    } finally {
      setInquirySubmitting(false)
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
    <div className="min-h-screen bg-dark">
      <Header />
      <CategoryNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-accent-light">
                Domov
              </Link>
            </li>
            <li>/</li>
            {advertisement.category && (
              <li>
                <Link href="/" className="hover:text-accent-light">
                  {advertisement.category.name}
                </Link>
              </li>
            )}
            <li>/</li>
            <li className="text-white">{advertisement.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {advertisement.title}
              </h1>
              {advertisement.priorityBoosted && (
                <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg bg-[#c9a96e]/15 text-[#138a54] border border-[#c9a96e]/30">
                  Prioritný inzerát
                </span>
              )}
            </div>

            {/* Seller Info */}
            {advertisement.user && (
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/[0.08]">
                <div className="w-16 h-16 rounded-full bg-dark-300 flex items-center justify-center text-gray-500 font-semibold text-xl">
                  {sellerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">{sellerName}</h3>
                    {isProSellerBadge(
                      advertisement.user?.sellerPlan,
                      advertisement.user?.sellerPlanValidUntil,
                    ) && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-dark-100 text-white">
                        Pro predajca
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-yellow-400 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                      <span className="text-sm font-semibold text-white">
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
              <div className="w-full h-96 bg-dark-200 rounded-lg flex items-center justify-center mb-8">
                <span className="text-gray-500">Žiadny obrázok</span>
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                O tejto službe
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                  {advertisement.description}
                </p>
              </div>
            </div>

            {advertisement.specifications &&
              categorySpecFilters.length > 0 &&
              (() => {
                const rows = categorySpecFilters
                  .map((f) => {
                    const raw = (advertisement.specifications as Record<string, unknown>)[f.slug]
                    const text = formatSpecificationValue(f, raw)
                    if (!text) return null
                    return { f, text }
                  })
                  .filter(Boolean) as { f: Filter; text: string }[]
                if (rows.length === 0) return null
                return (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Špecifikácie</h2>
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl border border-white/[0.08] bg-dark-50/50 p-4 sm:p-6">
                      {rows.map(({ f, text }) => (
                        <div key={f.id} className="border-b border-white/[0.06] pb-3 last:border-0 sm:border-0 sm:pb-0">
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{f.name}</dt>
                          <dd className="mt-1 text-base font-medium text-white">{text}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )
              })()}

            {/* Service Details */}
            {advertisement.type === 'SERVICE' && (
              <>
                {/* Features */}
                {advertisement.features && advertisement.features.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Čo je zahrnuté
                    </h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {advertisement.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Packages */}
                {advertisement.pricingType === 'PACKAGE' && advertisement.packages && advertisement.packages.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Balíčky služieb
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {advertisement.packages.map((pkg, idx) => (
                        <div key={idx} className="border border-white/[0.08] rounded-lg p-6 hover:shadow-lg transition-shadow">
                          <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                          <p className="text-gray-500 text-sm mb-4">{pkg.description}</p>
                          <div className="mb-4">
                            <div className="text-3xl font-bold text-white mb-1">{pkg.price}€</div>
                            {pkg.deliveryTime && (
                              <div className="text-sm text-gray-500">Dodanie: {pkg.deliveryTime}</div>
                            )}
                          </div>
                          {pkg.features && pkg.features.length > 0 && (
                            <ul className="space-y-2 mb-4">
                              {pkg.features.map((feature, fIdx) => (
                                <li key={fIdx} className="flex items-start gap-2 text-sm text-gray-300">
                                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <button className="w-full bg-accent text-white py-2 rounded-md font-semibold hover:bg-accent-light transition-colors">
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
                    <h2 className="text-2xl font-bold text-white mb-6">
                      Často kladené otázky
                    </h2>
                    <div className="space-y-3">
                      {advertisement.faq.map((faq, idx) => (
                        <div 
                          key={idx} 
                          className="border border-white/[0.08] rounded-lg overflow-hidden bg-dark hover:shadow-md transition-shadow"
                        >
                          <button
                            onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-dark-200/[0.04] transition-colors"
                          >
                            <h3 className="font-semibold text-white pr-4">{faq.question}</h3>
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
                              <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
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
            <div className="border-t border-white/[0.08] pt-8">
              <h2 className="text-2xl font-bold text-white mb-6">
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
              <div className="border border-white/[0.08] rounded-lg p-6 mb-6">
                <div className="mb-4">
                  {advertisement.type === 'SERVICE' && advertisement.pricingType === 'HOURLY' && advertisement.hourlyRate ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">
                          {advertisement.hourlyRate.toFixed(2)}€
                        </span>
                        <span className="text-gray-500">/ hodina</span>
                      </div>
                      {advertisement.deliveryTime && (
                        <div className="text-sm text-gray-500 mt-2">
                          ⏱ Dodanie: {advertisement.deliveryTime}
                        </div>
                      )}
                    </div>
                  ) : advertisement.type === 'SERVICE' && advertisement.pricingType === 'DAILY' && advertisement.dailyRate ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">
                          {advertisement.dailyRate.toFixed(2)}€
                        </span>
                        <span className="text-gray-500">/ deň</span>
                      </div>
                      {advertisement.deliveryTime && (
                        <div className="text-sm text-gray-500 mt-2">
                          ⏱ Dodanie: {advertisement.deliveryTime}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">
                        {advertisement.price ? `${advertisement.price.toFixed(2)}€` : 'Na dohodu'}
                      </span>
                      {advertisement.price && (
                        <span className="text-gray-500">Začínajúc od</span>
                      )}
                    </div>
                  )}
                  {advertisement.type === 'SERVICE' && advertisement.revisions && (
                    <div className="text-sm text-gray-500 mt-2">
                      🔄 Revízie: {advertisement.revisions}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleContinueClick}
                  className="w-full bg-accent text-white py-3 rounded-md font-semibold hover:bg-accent-light transition-colors mb-4"
                >
                  Pokračovať
                </button>
                  <button
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-md font-semibold transition-colors mb-4 ${
                      isFavorite
                        ? 'border-2 border-accent bg-accent/10 text-accent hover:bg-[#c9a96e]/20'
                        : 'border-2 border-white/10 text-white hover:border-white/20'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    {isFavorite ? 'V obľúbených' : 'Uložiť do obľúbených'}
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full flex items-center justify-center gap-2 border-2 border-red-300 text-red-400 py-3 rounded-md font-semibold hover:border-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    Nahlásiť inzerát
                  </button>
              </div>

              {/* Seller Card */}
              {advertisement.user && (
                <div className="border border-white/[0.08] rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-dark-300 flex items-center justify-center text-gray-500 font-semibold text-xl">
                      {sellerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {sellerName}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <svg
                          className="w-4 h-4 text-yellow-400 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="text-sm font-semibold text-white">
                          5.0
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-500">
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
                  <button
                    onClick={handleContactClick}
                    className="w-full mt-4 border border-white/10 text-white py-2 rounded-md font-medium hover:border-white/20 transition-colors"
                  >
                    Kontaktovať predajcu
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && advertisement?.user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark rounded-lg max-w-md w-full shadow-xl shadow-black/30">
            <div className="p-6 border-b border-white/[0.08]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  Kontaktovať predajcu
                </h2>
                <button
                  onClick={() => {
                    setShowContactModal(false)
                    setContactMode('choice')
                    setInquirySuccess(false)
                  }}
                  className="p-2 hover:bg-dark-200/[0.06] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {contactMode === 'choice' && (
                <div className="space-y-4">
                  <p className="text-gray-500 text-sm">
                    Vyberte spôsob kontaktu s predajcom {sellerName}:
                  </p>
                  <button
                    onClick={handleContactChat}
                    className="w-full flex items-center gap-3 p-4 border-2 border-white/[0.08] rounded-lg hover:border-accent hover:bg-[#c9a96e]/5 transition-colors text-left"
                  >
                    <MessageSquare className="w-6 h-6 text-accent" />
                    <div>
                      <span className="font-semibold text-white block">
                        Napísať cez chat
                      </span>
                      <span className="text-sm text-gray-500">
                        {isAuthenticated()
                          ? 'Obe strany musia byť zaregistrované. Odosielate správu predajcovi.'
                          : 'Pre chat sa musíte prihlásiť. Obe strany musia byť zaregistrované.'}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={handleContactPhone}
                    className="w-full flex items-center gap-3 p-4 border-2 border-white/[0.08] rounded-lg hover:border-accent hover:bg-[#c9a96e]/5 transition-colors text-left"
                  >
                    <Phone className="w-6 h-6 text-accent" />
                    <div>
                      <span className="font-semibold text-white block">
                        Zobraziť telefón
                      </span>
                      <span className="text-sm text-gray-500">
                        {advertisement.user && advertisement.user.phone
                          ? 'Zobrazí telefónne číslo predajcu'
                          : 'Predajca nemá zverejnený telefón'}
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {contactMode === 'chat' && inquirySuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-accent/15 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Správa bola odoslaná
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Predajca dostane vašu správu a môže vám odpovedať v sekcii Správy vo svojom profile.
                  </p>
                </div>
              ) : contactMode === 'chat' && (
                <div className="space-y-4">
                  <p className="text-gray-500 text-sm">
                    Napíšte správu predajcovi. Budete si môcť písať cez sekciu Správy vo vašom profile.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Predmet
                    </label>
                    <input
                      type="text"
                      value={inquirySubject}
                      onChange={(e) => setInquirySubject(e.target.value)}
                      className="w-full bg-dark-100 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40"
                      placeholder="Predmet správy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Správa
                    </label>
                    <textarea
                      value={inquiryContent}
                      onChange={(e) => setInquiryContent(e.target.value)}
                      rows={4}
                      className="w-full bg-dark-100 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 resize-none"
                      placeholder="Napíšte svoju správu..."
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/50 bg-accent/10 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-accent/60 flex-shrink-0" />
                    <p>
                      Pre písanie cez chat musia byť obaja používatelia zaregistrovaní. Správa sa odošle predajcovi a môžete pokračovať v komunikácii v sekcii Správy.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setContactMode('choice')}
                      className="px-4 py-2.5 border border-white/10 text-white/70 rounded-lg font-medium hover:bg-white/[0.06] hover:text-white transition-colors"
                    >
                      Späť
                    </button>
                    <button
                      onClick={handleInquirySubmit}
                      disabled={
                        !inquirySubject.trim() ||
                        !inquiryContent.trim() ||
                        inquirySubmitting
                      }
                      className="flex-1 px-4 py-2.5 bg-accent text-dark rounded-lg font-semibold hover:bg-accent-light disabled:bg-dark-300 disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
                    >
                      {inquirySubmitting ? 'Odosielam...' : 'Odoslať správu'}
                    </button>
                  </div>
                </div>
              )}

              {contactMode === 'phone' && !inquirySuccess && (
                <div className="space-y-4">
                  {advertisement.user.phone ? (
                    <>
                      <p className="text-gray-500 text-sm">
                        Telefónne číslo predajcu {sellerName}:
                      </p>
                      <a
                        href={`tel:${advertisement.user.phone}`}
                        className="block text-xl font-semibold text-accent hover:underline"
                      >
                        {advertisement.user.phone}
                      </a>
                      <p className="text-sm text-gray-500">
                        Kliknutím na číslo môžete zavolať.
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        Predajca nemá zverejnený telefón.
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Skúste napísať cez chat.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setContactMode('choice')}
                    className="w-full px-4 py-2 border border-white/10 text-gray-300 rounded-lg font-medium hover:bg-dark-200/[0.04] transition-colors"
                  >
                    Späť
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Continue Modal - Konzultácia (služby) alebo Rezervácia (inzeráty) */}
      {showContinueModal && advertisement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark rounded-lg max-w-lg w-full shadow-xl shadow-black/30">
            <div className="p-6 border-b border-white/[0.08]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {advertisement.type === 'SERVICE'
                    ? 'Dohodnúť konzultáciu'
                    : 'Rezervovať inzerát'}
                </h2>
                <button
                  onClick={() => {
                    setShowContinueModal(false)
                    setContinueSuccess(false)
                    setContinueServiceDate(undefined)
                    setContinueRentalRange(undefined)
                  }}
                  className="p-2 hover:bg-dark-200/[0.06] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {continueSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-accent/15 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Žiadosť odoslaná
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {advertisement.type === 'SERVICE'
                      ? 'Predajca vám čoskoro odpíše s návrhom termínu konzultácie. Sledujte sekciu Správy.'
                      : 'Predajca vám čoskoro odpíše k rezervácii. Sledujte sekciu Správy.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-500 text-sm">
                    {advertisement.type === 'SERVICE'
                      ? 'Vyberte dátum a popíšte, čo potrebujete. Predajca vám odpíše cez Správy.'
                      : 'Vyberte termín rezervácie a doplňte správu. Predajca dostane všetky potrebné informácie.'}
                  </p>

                  {advertisement.type === 'SERVICE' ? (
                    <DatePicker
                      mode="single"
                      label="Od kedy chcete využívať službu *"
                      value={continueServiceDate}
                      onChange={setContinueServiceDate}
                      minDate={new Date()}
                    />
                  ) : (
                    <DatePicker
                      mode="range"
                      label="Termín rezervácie (od – do) *"
                      value={continueRentalRange}
                      onChange={setContinueRentalRange}
                      minDate={new Date()}
                    />
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Doplňujúca správa pre predajcu <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={continueContent}
                      onChange={(e) => setContinueContent(e.target.value)}
                      rows={3}
                      className="w-full bg-dark-100 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                      placeholder={
                        advertisement.type === 'SERVICE'
                          ? 'Čo potrebujete vyriešiť, preferovaný čas, kontakt...'
                          : 'Doplňujúce informácie, spôsob prevzatia, otázky...'
                      }
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setShowContinueModal(false)}
                      className="px-4 py-2 border border-white/10 text-gray-300 rounded-lg font-medium hover:bg-dark-200/[0.04] transition-colors"
                    >
                      Zrušiť
                    </button>
                    <button
                      onClick={handleContinueSubmit}
                      disabled={
                        !continueContent.trim() ||
                        (advertisement.type === 'SERVICE'
                          ? !continueServiceDate
                          : !continueRentalRange?.from || !continueRentalRange?.to) ||
                        continueSubmitting
                      }
                      className="flex-1 px-4 py-2.5 bg-accent text-dark rounded-lg font-semibold hover:bg-accent-light disabled:bg-dark-300 disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
                    >
                      {continueSubmitting ? 'Odosielam...' : 'Odoslať žiadosť'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark rounded-lg max-w-md w-full shadow-xl shadow-black/30">
            <div className="p-6 border-b border-white/[0.08]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-400" />
                  Nahlásiť inzerát
                </h2>
                <button
                  onClick={() => {
                    setShowReportModal(false)
                    setReportReason('')
                    setReportDescription('')
                    setReportSuccess(false)
                  }}
                  className="p-2 hover:bg-dark-200/[0.06] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {reportSuccess ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-accent/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Ďakujeme za nahlásenie
                </h3>
                <p className="text-gray-500 text-sm">
                  Váš report bol úspešne odoslaný. Náš tím to skontroluje.
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dôvod nahlásenia <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={reportReason}
                    onChange={(val) => setReportReason(val)}
                    options={reportReasons}
                    placeholder="Vyberte dôvod..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Popis problému (voliteľné)
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Poskytnite viac informácií o probléme..."
                    rows={4}
                    className="w-full bg-dark-100 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-white/50 bg-accent/10 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-accent/60 flex-shrink-0" />
                  <p>
                    Nahlásené inzeráty sú kontrolované našim tímom. Inzerát zostane aktívny, pokiaľ ho nerozhodneme odstrániť.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                  <button
                    onClick={() => {
                      setShowReportModal(false)
                      setReportReason('')
                      setReportDescription('')
                    }}
                    className="px-4 py-2.5 border border-white/10 text-white/70 rounded-lg font-medium hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    Zrušiť
                  </button>
                  <button
                    onClick={handleReport}
                    disabled={!reportReason || reportSubmitting}
                    className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-dark-300 disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
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
