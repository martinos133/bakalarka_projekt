'use client'

import { useEffect, useState } from 'react'
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

export default function CategoryPage() {
  const params = useParams()
  const slug = params?.slug as string
  const cmsSlug = slug ? `kategoria-${slug}` : ''
  const { loading: cmsLoading, page: cmsPage } = useCmsOverride(cmsSlug)
  const [category, setCategory] = useState<any>(null)
  const [advertisements, setAdvertisements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [ratings, setRatings] = useState<Record<string, { count: number; average: number }>>({})

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
      if (data?.length) {
        const entries = await Promise.all(
          data.map(async (ad: any) => {
            try {
              const stats = await api.getReviewStats(ad.id)
              return [ad.id, stats] as const
            } catch {
              return [ad.id, { count: 0, average: 0 }] as const
            }
          })
        )
        setRatings(Object.fromEntries(entries))
      }
    } catch (error) {
      console.error('Chyba pri načítaní inzerátov:', error)
    }
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

  if (!category) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <CategoryNav />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 font-serif text-2xl text-accent sm:text-3xl">Kategória nebola nájdená</h1>
            <Link href="/" className="font-semibold text-accent transition hover:text-accent-light">
              Späť na domov
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <CategoryNav />
      
      {/* Banner */}
      {category.banner ? (
        <div className="flex w-full justify-center border-b border-white/[0.06] bg-surface px-4 py-6 sm:px-6 md:py-8 lg:px-8">
          {/* Banner kontajner s presnými rozmermi 1200×400px (pomer 3:1) */}
          <div 
            className="relative w-full max-w-[1200px] rounded-xl overflow-hidden shadow-2xl shadow-black/40"
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
              <div className="w-full max-w-4xl px-4 text-center sm:px-6 md:px-10">
                <div className="rounded-2xl border border-white/[0.1] bg-black/55 px-5 py-4 shadow-2xl shadow-black/40 backdrop-blur-md md:px-10 md:py-6">
                  <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                    {category.name}
                  </h1>
                  {category.description && (
                    <p className="mx-auto mt-3 max-w-2xl border-t border-white/[0.12] pt-3 text-base leading-relaxed text-white/90 md:mt-4 md:pt-4 md:text-lg lg:text-xl">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Fallback ak nie je banner */
        <section className="border-b border-white/[0.06] bg-surface py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight text-accent md:text-5xl lg:text-6xl">
              {category.name}
            </h1>
            {category.description && (
              <p className="max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
                {category.description}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Obsah */}
      <div className="border-t border-white/[0.06] bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <li>
              <Link href="/" className="transition hover:text-white">
                Domov
              </Link>
            </li>
            <li className="text-white/30">/</li>
            {category.parent && (
              <>
                <li>
                  <Link href={`/kategoria/${category.parent.slug}`} className="transition hover:text-white">
                    {category.parent.name}
                  </Link>
                </li>
                <li className="text-white/30">/</li>
              </>
            )}
            <li className="font-medium text-white">{category.name}</li>
          </ol>
        </nav>

        {/* Podkategórie */}
        {subcategories.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 font-serif text-2xl text-accent sm:text-3xl">Podkategórie</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {subcategories.map((subcategory) => (
                <TrackedLink
                  key={subcategory.id}
                  href={`/kategoria/${subcategory.slug}`}
                  targetType="CATEGORY"
                  targetId={subcategory.id}
                  className="group block"
                >
                  <div className="card card-hover flex h-full flex-col p-4 shadow-lg shadow-black/15 transition-all duration-200">
                  {subcategory.image && (
                    <img
                      src={subcategory.image}
                      alt={subcategory.imageAlt || subcategory.name}
                      className="mb-3 h-32 w-full rounded-lg object-cover ring-1 ring-white/[0.06]"
                    />
                  )}
                  <h3 className="font-semibold text-white transition-colors group-hover:text-accent-light">
                    {subcategory.name}
                  </h3>
                  {subcategory.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {subcategory.description}
                    </p>
                  )}
                  {subcategory._count?.advertisements > 0 && (
                    <p className="mt-2 text-xs text-muted">
                      {subcategory._count.advertisements} {subcategory._count.advertisements === 1 ? 'inzerát' : 'inzerátov'}
                    </p>
                  )}
                  </div>
                </TrackedLink>
              ))}
            </div>
          </div>
        )}

        {/* Inzeráty */}
        <div>
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-2xl text-accent sm:text-3xl">
              Inzeráty
              <span className="ml-2 font-sans text-lg font-semibold tabular-nums text-white/90">
                ({advertisements.length})
              </span>
            </h2>
          </div>

          {advertisements.length === 0 ? (
            <div className="card card-hover p-10 text-center shadow-lg shadow-black/15 md:p-12">
              <p className="mb-6 text-muted">
                V tejto kategórii zatiaľ nie sú žiadne inzeráty.
              </p>
              <Link
                href={`/podat-inzerat?kategoria=${encodeURIComponent(slug)}`}
                className="inline-flex items-center justify-center rounded-xl border border-transparent bg-accent px-6 py-3 font-semibold text-dark shadow-lg shadow-black/20 transition hover:bg-accent-light"
              >
                Pridať inzerát
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {advertisements.map((ad) => (
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
                        {isProSellerBadge(ad.user?.sellerPlan, ad.user?.sellerPlanValidUntil) && (
                          <span className="rounded-md bg-dark-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                            Pro predajca
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {(!ad.images || ad.images.length === 0) && ad.priorityBoosted && (
                        <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-dark">
                          Priorita
                        </span>
                      )}
                      {(!ad.images || ad.images.length === 0) &&
                        isProSellerBadge(ad.user?.sellerPlan, ad.user?.sellerPlanValidUntil) && (
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
                      <svg className="h-4 w-4 fill-current text-accent" viewBox="0 0 20 20" aria-hidden>
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                      <span className="text-sm font-semibold text-white">
                        {(ratings[ad.id]?.count ?? 0) > 0 ? ratings[ad.id].average.toFixed(1) : '–'}
                      </span>
                      <span className="text-xs text-muted">({ratings[ad.id]?.count ?? 0})</span>
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

      <Footer />
    </div>
  )
}
