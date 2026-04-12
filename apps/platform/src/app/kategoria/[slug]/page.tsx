'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { useCmsOverride } from '@/lib/useCmsOverride'
import Link from 'next/link'
import TrackedLink from '@/components/TrackedLink'
import { isProSellerBadge } from '@/lib/sellerPlan'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { CmsArticleView, CmsLoadingView } from '@/components/CmsGate'
import SpecificationFilters, {
  matchesFilters,
  type FilterValues,
} from '@/components/SpecificationFilters'
import type { Filter } from '@inzertna-platforma/shared'

export default function CategoryPage() {
  const params = useParams()
  const slug = params?.slug as string
  const cmsSlug = slug ? `kategoria-${slug}` : ''
  const { loading: cmsLoading, page: cmsPage } = useCmsOverride(cmsSlug)

  const [rootCategory, setRootCategory] = useState<any>(null)
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [activeSlug, setActiveSlug] = useState(slug)
  const [activeCategory, setActiveCategory] = useState<any>(null)
  const [advertisements, setAdvertisements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adsLoading, setAdsLoading] = useState(false)
  const [ratings, setRatings] = useState<Record<string, { count: number; average: number }>>({})
  const [specFilters, setSpecFilters] = useState<Filter[]>([])
  const [filterValues, setFilterValues] = useState<FilterValues>({})

  /** Presun filtre zo stránky detailu inzerátu */
  useEffect(() => {
    if (!slug || typeof window === 'undefined') return
    try {
      const raw = sessionStorage.getItem('inzertna-category-filters')
      if (!raw) return
      const parsed = JSON.parse(raw) as { slug?: string; filterValues?: FilterValues }
      if (parsed.slug === slug && parsed.filterValues && typeof parsed.filterValues === 'object') {
        setFilterValues(parsed.filterValues)
      }
      sessionStorage.removeItem('inzertna-category-filters')
    } catch {
      sessionStorage.removeItem('inzertna-category-filters')
    }
  }, [slug])

  useEffect(() => {
    if (slug) {
      setActiveSlug(slug)
      loadCategory(slug)
    }
  }, [slug])

  const loadCategory = async (s: string) => {
    try {
      setLoading(true)
      const data = await api.getCategoryBySlug(s)
      setActiveCategory(data)

      if (data.parent) {
        setRootCategory(data.parent)
        setSubcategories(data.parent.children ?? [])
      } else {
        setRootCategory(data)
        setSubcategories(
          data.children?.filter((child: any) => child.status === 'ACTIVE') ?? [],
        )
      }
    } catch (error) {
      console.error('Chyba pri načítaní kategórie:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAdvertisements = useCallback(async (s: string) => {
    try {
      setAdsLoading(true)
      const data = await api.getAdvertisementsByCategory(s)
      setAdvertisements(data)
      if (data?.length) {
        const entries = await Promise.all(
          data.map(async (ad: any) => {
            try {
              const stats = await api.getReviewStats(ad.id)
              return [ad.id, stats] as const
            } catch {
              return [ad.id, { count: 0, average: 0 }] as const
            }
          }),
        )
        setRatings(Object.fromEntries(entries))
      } else {
        setRatings({})
      }
    } catch (error) {
      console.error('Chyba pri načítaní inzerátov:', error)
      setAdvertisements([])
    } finally {
      setAdsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeSlug) {
      loadAdvertisements(activeSlug)
    }
  }, [activeSlug, loadAdvertisements])

  useEffect(() => {
    const catId = activeCategory?.id
    if (!catId) {
      setSpecFilters([])
      return
    }
    let cancelled = false

    const categoryIds = [catId, ...subcategories.map((s: any) => s.id)]
    Promise.all(categoryIds.map((id: string) => api.getActiveFilters(id).catch(() => [])))
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
        merged.sort((a: Filter, b: Filter) => (a.order ?? 0) - (b.order ?? 0))
        setSpecFilters(merged)
      })
      .catch(() => {
        if (!cancelled) setSpecFilters([])
      })
    return () => {
      cancelled = true
    }
  }, [activeCategory?.id, subcategories])

  const filteredAdvertisements = useMemo(
    () =>
      advertisements.filter((ad: any) =>
        matchesFilters(ad, specFilters, filterValues),
      ),
    [advertisements, specFilters, filterValues],
  )

  const switchSubcategory = (sub: any) => {
    if (sub.slug === activeSlug) return
    setActiveSlug(sub.slug)
    setActiveCategory(sub)
    setFilterValues({})
    window.history.pushState(null, '', `/kategoria/${sub.slug}`)
  }

  const switchToRoot = () => {
    if (!rootCategory || rootCategory.slug === activeSlug) return
    setActiveSlug(rootCategory.slug)
    setActiveCategory(rootCategory)
    setFilterValues({})
    window.history.pushState(null, '', `/kategoria/${rootCategory.slug}`)
  }

  if (cmsLoading) {
    return <CmsLoadingView shell="headerFooterOnly" />
  }
  if (cmsPage && cmsSlug) {
    return (
      <CmsArticleView
        shell="headerFooterOnly"
        slug={cmsSlug}
        title={cmsPage.title}
        content={cmsPage.content}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <CategoryNav />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center text-muted">Načítavam...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!activeCategory || !rootCategory) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <CategoryNav />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 font-serif text-2xl text-accent sm:text-3xl">
              Kategória nebola nájdená
            </h1>
            <Link
              href="/"
              className="font-semibold text-accent transition hover:text-accent-light"
            >
              Späť na domov
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const isOnRoot = activeSlug === rootCategory.slug
  const displayName = activeCategory.name
  const bannerImg = rootCategory.banner
  const bannerAlt = rootCategory.bannerAlt || rootCategory.name
  const bannerTitle = rootCategory.name
  const bannerDesc = rootCategory.description

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <CategoryNav />

      {/* Banner – vždy rodičovská kategória */}
      {bannerImg ? (
        <div className="flex w-full justify-center border-b border-white/[0.06] bg-surface px-4 py-6 sm:px-6 md:py-8 lg:px-8">
          <div
            className="relative w-full max-w-[1200px] overflow-hidden rounded-xl shadow-2xl shadow-black/40"
            style={{ aspectRatio: '3 / 1', height: '400px' }}
          >
            <img
              src={bannerImg}
              alt={bannerAlt}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-4xl px-4 text-center sm:px-6 md:px-10">
                <div className="rounded-2xl border border-white/[0.1] bg-black/55 px-5 py-4 shadow-2xl shadow-black/40 backdrop-blur-md md:px-10 md:py-6">
                  <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                    {bannerTitle}
                  </h1>
                  {bannerDesc && (
                    <p className="mx-auto mt-3 max-w-2xl border-t border-white/[0.12] pt-3 text-base leading-relaxed text-white/90 md:mt-4 md:pt-4 md:text-lg lg:text-xl">
                      {bannerDesc}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <section className="border-b border-white/[0.06] bg-surface py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight text-accent md:text-5xl lg:text-6xl">
              {bannerTitle}
            </h1>
            {bannerDesc && (
              <p className="max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
                {bannerDesc}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Obsah */}
      <div className="border-t border-white/[0.06] bg-surface">
        <div className="mx-auto max-w-[1920px] px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <li>
                <Link href="/" className="transition hover:text-white">
                  Domov
                </Link>
              </li>
              <li className="text-white/30">/</li>
              {!isOnRoot && (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={switchToRoot}
                      className="transition hover:text-white"
                    >
                      {rootCategory.name}
                    </button>
                  </li>
                  <li className="text-white/30">/</li>
                </>
              )}
              <li className="font-medium text-white">{displayName}</li>
            </ol>
          </nav>

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Sidebar – podkategórie + filtre */}
            <aside className="shrink-0 lg:w-60 xl:w-64">
              <div className="card sticky top-6 shadow-md shadow-black/10">
                {subcategories.length > 0 && (
                  <div className="p-4">
                    <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                      Podkategórie
                    </h2>
                    <button
                      type="button"
                      onClick={switchToRoot}
                      className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isOnRoot
                          ? 'bg-accent/10 font-medium text-accent'
                          : 'text-muted hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <span>Všetky</span>
                    </button>
                    <ul className="space-y-0.5">
                      {subcategories.map((subcategory) => {
                        const isActive = subcategory.slug === activeSlug
                        return (
                          <li key={subcategory.id}>
                            <button
                              type="button"
                              onClick={() => switchSubcategory(subcategory)}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                isActive
                                  ? 'bg-accent/10 font-medium text-accent'
                                  : 'text-muted hover:bg-white/[0.06] hover:text-white'
                              }`}
                            >
                              <span>{subcategory.name}</span>
                              {subcategory._count?.advertisements > 0 && (
                                <span
                                  className={`ml-2 text-xs tabular-nums ${isActive ? 'text-accent/60' : 'text-white/30'}`}
                                >
                                  {subcategory._count.advertisements}
                                </span>
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                <SpecificationFilters
                  filters={specFilters}
                  values={filterValues}
                  onChange={setFilterValues}
                  advertisements={advertisements}
                  embedded
                />
              </div>
            </aside>

            {/* Inzeráty */}
            <div className="min-w-0 flex-1">
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <h2 className="font-serif text-2xl text-accent sm:text-3xl">
                  Inzeráty
                  <span className="ml-2 font-sans text-lg font-semibold tabular-nums text-white/90">
                    ({filteredAdvertisements.length})
                  </span>
                </h2>
              </div>

              {adsLoading ? (
                <div className="py-12 text-center text-muted">Načítavam inzeráty…</div>
              ) : filteredAdvertisements.length === 0 ? (
                <div className="card card-hover p-10 text-center shadow-lg shadow-black/15 md:p-12">
                  <p className="mb-6 text-muted">
                    V tejto kategórii zatiaľ nie sú žiadne inzeráty.
                  </p>
                  <Link
                    href={`/podat-inzerat?kategoria=${encodeURIComponent(activeSlug)}`}
                    className="inline-flex items-center justify-center rounded-xl border border-transparent bg-accent px-6 py-3 font-semibold text-dark shadow-lg shadow-black/20 transition hover:bg-accent-light"
                  >
                    Pridať inzerát
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredAdvertisements.map((ad: any) => (
                    <TrackedLink
                      key={ad.id}
                      href={`/inzerat/${ad.id}`}
                      targetType="AD"
                      targetId={ad.id}
                      className="group block"
                    >
                      <article className="card card-hover flex h-full flex-col overflow-hidden shadow-lg shadow-black/15 transition-all duration-200">
                        {ad.images && ad.images.length > 0 && (
                          <div className="relative h-48 w-full shrink-0 overflow-hidden border-b border-white/[0.06] bg-dark-100">
                            <img
                              src={ad.images[0]}
                              alt={ad.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                            <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                              {ad.priorityBoosted && (
                                <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-dark shadow">
                                  Priorita
                                </span>
                              )}
                              {isProSellerBadge(
                                ad.user?.sellerPlan,
                                ad.user?.sellerPlanValidUntil,
                              ) && (
                                <span className="rounded-md bg-dark-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                                  Pro predajca
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-1 flex-col p-4">
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {(!ad.images || ad.images.length === 0) &&
                              ad.priorityBoosted && (
                                <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-dark">
                                  Priorita
                                </span>
                              )}
                            {(!ad.images || ad.images.length === 0) &&
                              isProSellerBadge(
                                ad.user?.sellerPlan,
                                ad.user?.sellerPlanValidUntil,
                              ) && (
                                <span className="rounded-md bg-dark-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                  Pro predajca
                                </span>
                              )}
                          </div>
                          <h3 className="mb-2 line-clamp-2 font-serif text-base font-semibold leading-snug text-white transition-colors group-hover:text-accent-light">
                            {ad.title}
                          </h3>
                          {ad.description && (
                            <p className="mb-3 line-clamp-2 text-sm text-muted">
                              {ad.description}
                            </p>
                          )}
                          <div className="mb-2 flex items-center gap-1">
                            <svg
                              className="h-4 w-4 fill-current text-accent"
                              viewBox="0 0 20 20"
                              aria-hidden
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                            <span className="text-sm font-semibold text-white">
                              {(ratings[ad.id]?.count ?? 0) > 0
                                ? ratings[ad.id].average.toFixed(1)
                                : '–'}
                            </span>
                            <span className="text-xs text-muted">
                              ({ratings[ad.id]?.count ?? 0})
                            </span>
                          </div>
                          <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                            {ad.price && (
                              <span className="text-lg font-bold tabular-nums text-accent">
                                {ad.price.toLocaleString('sk-SK')} €
                              </span>
                            )}
                            {ad.location && (
                              <span className="truncate text-sm text-muted">
                                {ad.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    </TrackedLink>
                  ))}
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
