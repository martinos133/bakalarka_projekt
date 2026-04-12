'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { CmsArticleView, CmsLoadingView } from '@/components/CmsGate'
import ImageCarousel from '@/components/ImageCarousel'
import DatePicker from '@/components/DatePicker'
import CategorySubcategorySidebar, {
  type SubcategoryItem,
} from '@/components/CategorySubcategorySidebar'
import SpecificationFilters, {
  matchesFilters,
  type FilterValues,
} from '@/components/SpecificationFilters'
import { api } from '@/lib/api'
import { useCmsOverride } from '@/lib/useCmsOverride'
import { isAuthenticated, getAuthUser } from '@/lib/auth'
import { isProSellerBadge } from '@/lib/sellerPlan'
import type { Filter } from '@inzertna-platforma/shared'
import { ChevronDown, ChevronUp, Flag, AlertCircle, X, Check, MessageSquare, Phone, Heart, Star, Trash2, Edit3, Reply, RefreshCw, Calendar, Clock } from 'lucide-react'
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
    slug?: string
  }
  location?: string
  priorityBoosted?: boolean
  userId?: string
  user?: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    sellerPlan?: string
    sellerPlanValidUntil?: string | null
    avatarUrl?: string | null
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
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  const [categoryAdsForFilters, setCategoryAdsForFilters] = useState<Advertisement[]>([])
  const [sellerRating, setSellerRating] = useState<{ count: number; average: number }>({ count: 0, average: 0 })
  const [subcategoryNav, setSubcategoryNav] = useState<{
    root: { id: string; name: string; slug: string } | null
    subs: SubcategoryItem[]
  }>({ root: null, subs: [] })

  const filteredAdsCount = useMemo(
    () =>
      categoryAdsForFilters.filter((ad) =>
        matchesFilters(ad, categorySpecFilters, filterValues),
      ).length,
    [categoryAdsForFilters, categorySpecFilters, filterValues],
  )

  useEffect(() => {
    loadAdvertisement()
  }, [id])

  useEffect(() => {
    const catId = advertisement?.categoryId || advertisement?.category?.id
    if (!catId) {
      setCategorySpecFilters([])
      return
    }
    let cancelled = false
    const categoryIds = new Set<string>([catId])
    if (subcategoryNav.root) {
      categoryIds.add(subcategoryNav.root.id)
      subcategoryNav.subs.forEach((s) => categoryIds.add(s.id))
    }
    Promise.all(
      [...categoryIds].map((id) => api.getActiveFilters(id).catch(() => [])),
    )
      .then((results) => {
        if (cancelled) return
        const seen = new Set<string>()
        const merged: Filter[] = []
        for (const rows of results) {
          for (const f of Array.isArray(rows) ? rows : []) {
            if (!seen.has(f.slug)) {
              seen.add(f.slug)
              merged.push(f)
            }
          }
        }
        merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        setCategorySpecFilters(merged)
      })
      .catch(() => {
        if (!cancelled) setCategorySpecFilters([])
      })
    return () => {
      cancelled = true
    }
  }, [advertisement?.categoryId, advertisement?.category?.id, subcategoryNav])

  useEffect(() => {
    const slug = advertisement?.category?.slug
    if (!slug) {
      setCategoryAdsForFilters([])
      return
    }
    let cancelled = false
    api
      .getAdvertisementsByCategory(slug)
      .then((data) => {
        if (!cancelled) setCategoryAdsForFilters(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setCategoryAdsForFilters([])
      })
    return () => {
      cancelled = true
    }
  }, [advertisement?.category?.slug])

  useEffect(() => {
    const slug = advertisement?.category?.slug
    if (!slug) {
      setSubcategoryNav({ root: null, subs: [] })
      return
    }
    let cancelled = false
    api
      .getCategoryBySlug(slug)
      .then((data: any) => {
        if (cancelled) return
        if (data.parent) {
          setSubcategoryNav({
            root: {
              id: data.parent.id,
              name: data.parent.name,
              slug: data.parent.slug,
            },
            subs: data.parent.children ?? [],
          })
        } else {
          setSubcategoryNav({
            root: { id: data.id, name: data.name, slug: data.slug },
            subs: data.children?.filter((child: { status?: string }) => child.status === 'ACTIVE') ?? [],
          })
        }
      })
      .catch(() => {
        if (!cancelled) setSubcategoryNav({ root: null, subs: [] })
      })
    return () => {
      cancelled = true
    }
  }, [advertisement?.category?.slug])

  const loadAdvertisement = async () => {
    try {
      setLoading(true)
      const data = await api.getAdvertisement(id)
      setAdvertisement(data)
      if (data?.userId) {
        api.getUserReviewStats(data.userId).then(setSellerRating).catch(() => {})
      }
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
        ? `Žiadosť o objednávku: ${advertisement?.title || ''}`
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
      <div className="mx-auto w-full max-w-[1920px] px-4 py-8 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
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
                <Link
                  href={
                    advertisement.category.slug
                      ? `/kategoria/${advertisement.category.slug}`
                      : '/'
                  }
                  className="hover:text-accent-light"
                >
                  {advertisement.category.name}
                </Link>
              </li>
            )}
            <li>/</li>
            <li className="text-white">{advertisement.title}</li>
          </ol>
        </nav>

        <div
          className={
            advertisement.category?.slug
              ? 'grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:gap-12 2xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]'
              : 'grid grid-cols-1 gap-8'
          }
        >
          {advertisement.category?.slug ? (
            <aside className="shrink-0 lg:w-60 xl:w-64">
              <div className="card sticky top-6 shadow-md shadow-black/10">
                {subcategoryNav.root && subcategoryNav.subs.length > 0 ? (
                  <CategorySubcategorySidebar
                    embedded
                    rootCategory={subcategoryNav.root}
                    subcategories={subcategoryNav.subs}
                    activeSlug={advertisement.category.slug}
                  />
                ) : null}
                <SpecificationFilters
                  filters={categorySpecFilters}
                  values={filterValues}
                  onChange={setFilterValues}
                  advertisements={categoryAdsForFilters}
                  embedded
                />
                <div className="border-t border-white/[0.08] p-4 pt-3">
                  <Link
                    href={`/kategoria/${advertisement.category.slug}`}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-center text-sm font-medium text-white/90 transition hover:border-accent/35 hover:bg-accent/10 hover:text-accent"
                    onClick={() => {
                      try {
                        sessionStorage.setItem(
                          'inzertna-category-filters',
                          JSON.stringify({
                            slug: advertisement.category!.slug,
                            filterValues,
                          }),
                        )
                      } catch {
                        /* ignore */
                      }
                    }}
                  >
                    Zobraziť inzeráty v kategórii
                    {filteredAdsCount > 0 ? (
                      <span className="ml-1.5 tabular-nums text-muted">({filteredAdsCount})</span>
                    ) : null}
                  </Link>
                </div>
              </div>
            </aside>
          ) : null}

          <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-3">
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
                {advertisement.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={advertisement.user.avatarUrl}
                    alt=""
                    className="h-16 w-16 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-dark-300 flex items-center justify-center text-gray-500 font-semibold text-xl">
                    {sellerName.charAt(0).toUpperCase()}
                  </div>
                )}
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
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="text-sm font-semibold text-white">
                        {sellerRating.count > 0 ? sellerRating.average.toFixed(1) : '–'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">({sellerRating.count} {sellerRating.count === 1 ? 'recenzia' : sellerRating.count >= 2 && sellerRating.count <= 4 ? 'recenzie' : 'recenzií'})</span>
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
              <h2 className="text-2xl font-bold text-accent mb-4">
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
                    <h2 className="text-2xl font-bold text-accent mb-4">Špecifikácia</h2>
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
                    <h2 className="text-2xl font-bold text-accent mb-4">
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
                    <h2 className="text-2xl font-bold text-accent mb-4">
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

                {/* FAQ — admin card + popup farby */}
                {advertisement.faq && advertisement.faq.length > 0 && (
                  <div className="card mb-8 overflow-hidden p-6 shadow-lg shadow-black/20">
                    <h2 className="mb-6 text-2xl font-bold text-accent">
                      Často kladené otázky
                    </h2>
                    <div className="space-y-3">
                      {advertisement.faq.map((faq, idx) => (
                        <div
                          key={idx}
                          className={`overflow-hidden rounded-xl border transition-all duration-200 ${
                            expandedFAQ === idx
                              ? 'border-accent/40 bg-card shadow-[0_0_0_1px_rgba(201,169,110,0.12),0_12px_40px_-20px_rgba(201,169,110,0.18)]'
                              : 'border-white/[0.08] bg-surface hover:border-accent/20 hover:bg-white/[0.03]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                            className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors duration-200 ${
                              expandedFAQ === idx
                                ? 'border-b border-accent/15 bg-accent/[0.07] text-white'
                                : 'text-white hover:bg-white/[0.04]'
                            }`}
                          >
                            <h3 className="pr-4 text-[15px] font-semibold tracking-tight text-white">
                              {faq.question}
                            </h3>
                            <div className="shrink-0 rounded-lg border border-white/[0.08] bg-black/20 p-1">
                              {expandedFAQ === idx ? (
                                <ChevronUp className="h-4 w-4 text-accent" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </button>
                          {expandedFAQ === idx && (
                            <div className="bg-black/15 px-5 pb-5 pt-4">
                              <div className="border-l-2 border-accent/60 pl-4">
                                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                                  Odpoveď
                                </p>
                                <div className="rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3.5 backdrop-blur-[2px]">
                                  <p className="text-[15px] leading-relaxed text-white/90">{faq.answer}</p>
                                </div>
                              </div>
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
            <ReviewsSection
              advertisementId={advertisement.id}
              ownerId={advertisement.userId ?? advertisement.user?.id ?? ''}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Price Card — admin card + tlačidlá */}
              <div className="card mb-6 overflow-hidden p-6 shadow-2xl shadow-black/20">
                <div className="mb-5">
                  {advertisement.type === 'SERVICE' && advertisement.pricingType === 'HOURLY' && advertisement.hourlyRate ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">
                          {advertisement.hourlyRate.toFixed(2)}€
                        </span>
                        <span className="text-sm text-gray-500">/ hodina</span>
                      </div>
                      {advertisement.deliveryTime && (
                        <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-400">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-accent/80" />
                          Dodanie: {advertisement.deliveryTime}
                        </div>
                      )}
                    </div>
                  ) : advertisement.type === 'SERVICE' && advertisement.pricingType === 'DAILY' && advertisement.dailyRate ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">
                          {advertisement.dailyRate.toFixed(2)}€
                        </span>
                        <span className="text-sm text-gray-500">/ deň</span>
                      </div>
                      {advertisement.deliveryTime && (
                        <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-400">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-accent/80" />
                          Dodanie: {advertisement.deliveryTime}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">
                        {advertisement.price ? `${advertisement.price.toFixed(2)}€` : 'Na dohodu'}
                      </span>
                      {advertisement.price && (
                        <span className="text-sm text-gray-500">Začínajúc od</span>
                      )}
                    </div>
                  )}
                  {advertisement.type === 'SERVICE' && advertisement.revisions && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-400">
                      <RefreshCw className="h-3.5 w-3.5 shrink-0 text-accent/80" />
                      Revízie: {advertisement.revisions}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleContinueClick}
                  className="mb-3 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-dark transition-colors hover:bg-accent-light active:scale-[0.98]"
                >
                  Pokračovať
                </button>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                  className={`mb-3 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors active:scale-[0.98] disabled:opacity-50 ${
                    isFavorite
                      ? 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/15'
                      : 'border-white/[0.08] bg-transparent text-white hover:border-white/[0.14] hover:bg-white/[0.06]'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'V obľúbených' : 'Uložiť do obľúbených'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/35 bg-red-500/5 py-3 text-sm font-semibold text-red-300 transition-colors hover:border-red-400/50 hover:bg-red-500/10"
                >
                  <Flag className="h-4 w-4" />
                  Nahlásiť inzerát
                </button>
              </div>

              {/* Seller Card */}
              {advertisement.user && (
                <div className="card overflow-hidden p-6 shadow-2xl shadow-black/20">
                  <div className="mb-4 flex items-center gap-4">
                    {advertisement.user?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={advertisement.user.avatarUrl}
                        alt=""
                        className="h-16 w-16 rounded-full border border-white/[0.1] object-cover ring-1 ring-accent/15"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.08] bg-dark-100 text-xl font-semibold text-gray-400 ring-1 ring-accent/10">
                        {sellerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white">{sellerName}</h3>
                      <div className="mt-1 flex items-center gap-1">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span className="text-sm font-semibold text-white">
                          {sellerRating.count > 0 ? sellerRating.average.toFixed(1) : '–'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 rounded-xl border border-white/[0.06] bg-dark-100/40 px-3 py-3 text-sm">
                    {advertisement.location && (
                      <div className="flex justify-between gap-3 text-gray-500">
                        <span>Lokalita</span>
                        <span className="font-medium text-white">{advertisement.location}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-3 text-gray-500">
                      <span>Člen od</span>
                      <span className="font-medium text-white">
                        {new Date(advertisement.createdAt).getFullYear()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleContactClick}
                    className="mt-4 w-full rounded-xl border border-white/[0.08] bg-transparent py-2.5 text-sm font-medium text-white transition-colors hover:border-white/[0.14] hover:bg-white/[0.06] active:scale-[0.98]"
                  >
                    Kontaktovať predajcu
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Contact Modal — admin štýl + priehľadný overlay */}
      {showContactModal && advertisement?.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Zavrieť"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => {
              setShowContactModal(false)
              setContactMode('choice')
              setInquirySuccess(false)
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/[0.06] px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <h2 id="contact-modal-title" className="flex items-center gap-3 text-lg font-semibold text-white">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
                    <MessageSquare className="h-5 w-5 text-accent" />
                  </span>
                  Kontaktovať predajcu
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowContactModal(false)
                    setContactMode('choice')
                    setInquirySuccess(false)
                  }}
                  className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {contactMode === 'choice' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Vyberte spôsob kontaktu s predajcom <span className="font-medium text-white">{sellerName}</span>:
                  </p>
                  <button
                    type="button"
                    onClick={handleContactChat}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-dark-100/40 p-4 text-left transition-colors hover:border-accent/40 hover:bg-popupRowHover"
                  >
                    <MessageSquare className="h-6 w-6 shrink-0 text-accent" />
                    <div className="min-w-0">
                      <span className="block font-semibold text-white">Napísať cez chat</span>
                      <span className="mt-0.5 block text-sm text-gray-500">
                        {isAuthenticated()
                          ? 'Obe strany musia byť zaregistrované. Odosielate správu predajcovi.'
                          : 'Pre chat sa musíte prihlásiť. Obe strany musia byť zaregistrované.'}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleContactPhone}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-dark-100/40 p-4 text-left transition-colors hover:border-accent/40 hover:bg-popupRowHover"
                  >
                    <Phone className="h-6 w-6 shrink-0 text-accent" />
                    <div className="min-w-0">
                      <span className="block font-semibold text-white">Zobraziť telefón</span>
                      <span className="mt-0.5 block text-sm text-gray-500">
                        {advertisement.user && advertisement.user.phone
                          ? 'Zobrazí telefónne číslo predajcu'
                          : 'Predajca nemá zverejnený telefón'}
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {contactMode === 'chat' && inquirySuccess ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/25">
                    <Check className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">Správa bola odoslaná</h3>
                  <p className="text-sm text-gray-400">
                    Predajca dostane vašu správu a môže vám odpovedať v sekcii Správy vo svojom profile.
                  </p>
                </div>
              ) : contactMode === 'chat' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Napíšte správu predajcovi. Budete si môcť písať cez sekciu Správy vo vašom profile.
                  </p>
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Predmet
                    </label>
                    <input
                      type="text"
                      value={inquirySubject}
                      onChange={(e) => setInquirySubject(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.12] bg-white/[0.08] px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25"
                      placeholder="Predmet správy"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Správa
                    </label>
                    <textarea
                      value={inquiryContent}
                      onChange={(e) => setInquiryContent(e.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-xl border border-white/[0.12] bg-white/[0.08] px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25"
                      placeholder="Napíšte svoju správu..."
                    />
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-accent/25 bg-popup p-4 text-sm leading-relaxed text-gray-300">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <p>
                      Pre písanie cez chat musia byť obaja používatelia zaregistrovaní. Správa sa odošle predajcovi a môžete pokračovať v komunikácii v sekcii Správy.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 border-t border-white/[0.06] pt-5">
                    <button
                      type="button"
                      onClick={() => setContactMode('choice')}
                      className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-transparent px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                    >
                      Späť
                    </button>
                    <button
                      type="button"
                      onClick={handleInquirySubmit}
                      disabled={
                        !inquirySubject.trim() ||
                        !inquiryContent.trim() ||
                        inquirySubmitting
                      }
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-45"
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
                      <p className="text-sm text-gray-400">
                        Telefónne číslo predajcu <span className="font-medium text-white">{sellerName}</span>:
                      </p>
                      <a
                        href={`tel:${advertisement.user.phone}`}
                        className="block text-xl font-semibold text-accent hover:text-accent-light hover:underline"
                      >
                        {advertisement.user.phone}
                      </a>
                      <p className="text-sm text-gray-500">Kliknutím na číslo môžete zavolať.</p>
                    </>
                  ) : (
                    <div className="py-4 text-center">
                      <Phone className="mx-auto mb-3 h-12 w-12 text-gray-500" />
                      <p className="text-sm text-gray-400">Predajca nemá zverejnený telefón.</p>
                      <p className="mt-1 text-sm text-gray-500">Skúste napísať cez chat.</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setContactMode('choice')}
                    className="w-full rounded-xl border border-white/[0.08] bg-transparent px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                  >
                    Späť
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Continue Modal — admin štýl + priehľadný overlay */}
      {showContinueModal && advertisement && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[5vh]">
          <button
            type="button"
            aria-label="Zavrieť"
            className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => {
              setShowContinueModal(false)
              setContinueSuccess(false)
              setContinueServiceDate(undefined)
              setContinueRentalRange(undefined)
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="continue-modal-title"
            className="relative mb-10 w-full max-w-lg rounded-2xl border border-white/[0.08] bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/[0.06] px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <h2 id="continue-modal-title" className="flex items-center gap-3 text-lg font-semibold text-white">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
                    <Calendar className="h-5 w-5 text-accent" />
                  </span>
                  {advertisement.type === 'SERVICE' ? 'Dohodnúť objednávku' : 'Rezervovať inzerát'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowContinueModal(false)
                    setContinueSuccess(false)
                    setContinueServiceDate(undefined)
                    setContinueRentalRange(undefined)
                  }}
                  className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {continueSuccess ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/25">
                    <Check className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">Žiadosť odoslaná</h3>
                  <p className="text-sm text-gray-400">
                    {advertisement.type === 'SERVICE'
                      ? 'Predajca vám čoskoro odpíše k vašej objednávke. Sledujte sekciu Správy.'
                      : 'Predajca vám čoskoro odpíše k rezervácii. Sledujte sekciu Správy.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    {advertisement.type === 'SERVICE'
                      ? 'Vyberte dátum začiatku a stručne popíšte objednávku (rozsah, podmienky). Predajca vám odpíše cez Správy a dohodnete detaily.'
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
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Doplňujúca správa pre predajcu <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={continueContent}
                      onChange={(e) => setContinueContent(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-white/[0.12] bg-white/[0.08] px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25"
                      placeholder={
                        advertisement.type === 'SERVICE'
                          ? 'Čo objednávate, rozsah, preferovaný čas, kontakt...'
                          : 'Doplňujúce informácie, spôsob prevzatia, otázky...'
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2.5 border-t border-white/[0.06] pt-5">
                    <button
                      type="button"
                      onClick={() => setShowContinueModal(false)}
                      className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-transparent px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                    >
                      Zrušiť
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueSubmit}
                      disabled={
                        !continueContent.trim() ||
                        (advertisement.type === 'SERVICE'
                          ? !continueServiceDate
                          : !continueRentalRange?.from || !continueRentalRange?.to) ||
                        continueSubmitting
                      }
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-45"
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

      {/* Report Modal — vizuál zladený s admin modal-panel */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Zavrieť"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => {
              setShowReportModal(false)
              setReportReason('')
              setReportDescription('')
              setReportSuccess(false)
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-card shadow-2xl animate-[slideDown_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/[0.06] px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <h2 id="report-modal-title" className="text-lg font-semibold text-white flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                    <Flag className="h-5 w-5 text-red-400" />
                  </span>
                  Nahlásiť inzerát
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false)
                    setReportReason('')
                    setReportDescription('')
                    setReportSuccess(false)
                  }}
                  className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {reportSuccess ? (
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/25">
                  <Check className="h-8 w-8 text-accent" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Ďakujeme za nahlásenie
                </h3>
                <p className="text-sm text-gray-400">
                  Váš report bol úspešne odoslaný. Náš tím to skontroluje.
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                    Dôvod nahlásenia <span className="text-red-400">*</span>
                  </label>
                  <CustomSelect
                    value={reportReason}
                    onChange={(val) => setReportReason(val)}
                    options={reportReasons}
                    placeholder="Vyberte dôvod..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                    Popis problému (voliteľné)
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Poskytnite viac informácií o probléme..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/[0.12] bg-white/[0.08] px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25"
                  />
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-accent/25 bg-popup p-4 text-sm leading-relaxed text-gray-300">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <p>
                    Nahlásené inzeráty sú kontrolované našim tímom. Inzerát zostane aktívny, pokiaľ ho nerozhodneme odstrániť.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 border-t border-white/[0.06] pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportModal(false)
                      setReportReason('')
                      setReportDescription('')
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-transparent px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                  >
                    Zrušiť
                  </button>
                  <button
                    type="button"
                    onClick={handleReport}
                    disabled={!reportReason || reportSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-45"
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

function StarRating({ rating, onRate, interactive = false, size = 'md' }: {
  rating: number
  onRate?: (r: number) => void
  interactive?: boolean
  size?: 'sm' | 'md'
}) {
  const [hover, setHover] = useState(0)
  const px = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <Star
            className={`${px} ${
              star <= (hover || rating)
                ? 'text-accent fill-accent'
                : 'text-white/20'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  )
}

function ReviewsSection({ advertisementId, ownerId }: { advertisementId: string; ownerId: string }) {
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState<{ count: number; average: number }>({ count: 0, average: 0 })
  const [loading, setLoading] = useState(true)
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editComment, setEditComment] = useState('')
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const user = getAuthUser()
  const isLoggedIn = isAuthenticated()
  const isOwner = user?.id === ownerId
  const hasReviewed = reviews.some((r) => r.authorId === user?.id)

  useEffect(() => {
    loadReviews()
  }, [advertisementId])

  async function loadReviews() {
    try {
      const [reviewsData, statsData] = await Promise.all([
        api.getReviews(advertisementId),
        api.getReviewStats(advertisementId),
      ])
      setReviews(reviewsData)
      setStats(statsData)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (newRating === 0) {
      setError('Vyberte hodnotenie')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await api.createReview({
        advertisementId,
        rating: newRating,
        comment: newComment.trim() || undefined,
      })
      setNewRating(0)
      setNewComment('')
      await loadReviews()
    } catch (e: any) {
      setError(e?.message || 'Nepodarilo sa pridať recenziu')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string) {
    setSubmitting(true)
    try {
      await api.updateReview(id, {
        rating: editRating,
        comment: editComment.trim() || undefined,
      })
      setEditingId(null)
      await loadReviews()
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReply(reviewId: string) {
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      await api.replyToReview(reviewId, replyText.trim())
      setReplyingId(null)
      setReplyText('')
      await loadReviews()
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteReply(reviewId: string) {
    if (!confirm('Naozaj chcete zmazať túto odpoveď?')) return
    try {
      await api.deleteReviewReply(reviewId)
      await loadReviews()
    } catch {
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Naozaj chcete zmazať túto recenziu?')) return
    try {
      await api.deleteReview(id)
      await loadReviews()
    } catch {
    }
  }

  function getInitials(firstName?: string, lastName?: string) {
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?'
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="border-t border-white/[0.08] pt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-accent">Recenzie</h2>
          {stats.count > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span className="text-sm font-semibold text-accent">{stats.average}</span>
              <span className="text-sm text-white/40">({stats.count})</span>
            </div>
          )}
        </div>
      </div>

      {/* Write Review Form */}
      {!isLoggedIn ? (
        <div className="bg-dark-100 border border-white/[0.06] rounded-xl p-5 mb-6 text-center">
          <p className="text-white/50 text-sm mb-3">Pre pridanie recenzie sa musíte prihlásiť.</p>
          <a href="/signin" className="inline-block px-5 py-2 bg-accent text-dark rounded-lg font-semibold text-sm hover:bg-accent-light transition-colors">
            Prihlásiť sa
          </a>
        </div>
      ) : isOwner ? (
        <div className="bg-dark-100 border border-white/[0.06] rounded-xl p-5 mb-6 text-center">
          <p className="text-white/40 text-sm">Nemôžete hodnotiť vlastný inzerát.</p>
        </div>
      ) : hasReviewed ? (
        <div className="bg-dark-100 border border-white/[0.06] rounded-xl p-5 mb-6 text-center">
          <p className="text-white/40 text-sm">Ďakujeme za vašu recenziu! Môžete ju upraviť nižšie.</p>
        </div>
      ) : (
        <div className="bg-dark-100 border border-white/[0.06] rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Napísať recenziu</h3>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm text-white/50">Vaše hodnotenie:</span>
            <StarRating rating={newRating} onRate={setNewRating} interactive />
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Napíšte svoju skúsenosť... (voliteľné)"
            rows={3}
            className="w-full bg-dark-200 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 resize-none text-sm mb-3"
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting || newRating === 0}
            className="px-5 py-2 bg-accent text-dark rounded-lg font-semibold text-sm hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Odosielam...' : 'Odoslať recenziu'}
          </button>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center text-white/40 py-8">
          Zatiaľ žiadne recenzie
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isAuthor = user?.id === review.authorId
            const isEditing = editingId === review.id

            return (
              <div key={review.id} className="bg-dark-100 border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-semibold">
                      {getInitials(review.author?.firstName, review.author?.lastName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {review.author?.firstName || ''} {review.author?.lastName || 'Používateľ'}
                      </p>
                      <p className="text-xs text-white/30">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && <StarRating rating={review.rating} size="sm" />}
                    {isAuthor && !isEditing && (
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => {
                            setEditingId(review.id)
                            setEditRating(review.rating)
                            setEditComment(review.comment || '')
                          }}
                          className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-3">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-white/50">Hodnotenie:</span>
                      <StarRating rating={editRating} onRate={setEditRating} interactive size="sm" />
                    </div>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      rows={2}
                      className="w-full bg-dark-200 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none text-sm mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(review.id)}
                        disabled={submitting}
                        className="px-3 py-1.5 bg-accent text-dark rounded-lg text-xs font-semibold hover:bg-accent-light transition-colors"
                      >
                        Uložiť
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 border border-white/10 text-white/60 rounded-lg text-xs hover:text-white transition-colors"
                      >
                        Zrušiť
                      </button>
                    </div>
                  </div>
                ) : review.comment ? (
                  <p className="text-sm text-white/70 mt-1 leading-relaxed">{review.comment}</p>
                ) : null}

                {/* Owner Reply */}
                {review.ownerReply && (
                  <div className="mt-4 ml-6 relative">
                    {/* connector from review to reply */}
                    <div className="absolute -left-3 top-0 bottom-0 w-px bg-gradient-to-b from-accent/40 via-accent/15 to-transparent" />

                    <div className="relative p-4 rounded-2xl bg-dark-100 border border-accent/30 shadow-[0_0_0_1px_rgba(201,169,110,0.10),0_22px_80px_-60px_rgba(201,169,110,0.55)]">
                      {/* left accent bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-accent via-accent/60 to-accent/10" />

                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 w-9 h-9 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent font-semibold text-xs">
                            <Reply className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-extrabold tracking-[0.18em] text-accent">
                                ODPOVEĎ
                              </span>
                              <span className="text-[11px] font-semibold text-white/60">
                                Majiteľ inzerátu
                              </span>
                            </div>
                            {review.ownerReplyAt && (
                              <div className="text-xs text-white/30 mt-0.5">{formatDate(review.ownerReplyAt)}</div>
                            )}
                          </div>
                        </div>
                      {isOwner && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setReplyingId(review.id)
                              setReplyText(review.ownerReply || '')
                            }}
                            className="p-1.5 rounded-lg text-white/25 hover:text-white hover:bg-white/[0.06] transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteReply(review.id)}
                            className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                      <div className="mt-1 rounded-xl bg-dark-200/60 border border-white/[0.06] px-4 py-3">
                        <p className="text-sm text-white/80 leading-relaxed">{review.ownerReply}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reply Form for Owner */}
                {isOwner && replyingId === review.id && (
                  <div className="mt-4 ml-6 p-4 rounded-2xl bg-dark-100 border border-accent/30 shadow-[0_0_0_1px_rgba(201,169,110,0.08)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Reply className="w-4 h-4 text-accent/80" />
                      <span className="text-[11px] font-extrabold tracking-[0.18em] text-accent">ODPOVEĎ</span>
                      <span className="text-xs text-white/40">napíšte reakciu na recenziu</span>
                    </div>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Napíšte odpoveď na túto recenziu..."
                      rows={2}
                      className="w-full bg-dark-200 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none text-sm mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReply(review.id)}
                        disabled={submitting || !replyText.trim()}
                        className="px-3 py-1.5 bg-accent text-dark rounded-lg text-xs font-semibold hover:bg-accent-light disabled:opacity-50 transition-colors"
                      >
                        {submitting ? 'Odosielam...' : 'Odpovedať'}
                      </button>
                      <button
                        onClick={() => { setReplyingId(null); setReplyText('') }}
                        className="px-3 py-1.5 border border-white/10 text-white/60 rounded-lg text-xs hover:text-white transition-colors"
                      >
                        Zrušiť
                      </button>
                    </div>
                  </div>
                )}

                {/* Reply Button for Owner (when no reply yet and not currently replying) */}
                {isOwner && !review.ownerReply && replyingId !== review.id && (
                  <button
                    onClick={() => { setReplyingId(review.id); setReplyText('') }}
                    className="mt-2 flex items-center gap-1.5 text-xs text-white/30 hover:text-accent transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    Odpovedať
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
