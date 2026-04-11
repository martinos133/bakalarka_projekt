'use client'

import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import TrackedLink from '@/components/TrackedLink'

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await api.getCategories()
      const mainCategories = data
        .filter((cat: any) => !cat.parentId && cat.status === 'ACTIVE')
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      setCategories(mainCategories)
    } catch (error) {
      console.error('Chyba pri načítaní kategórií:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="border-t border-white/[0.06] bg-surface py-16">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-muted">Načítavam kategórie…</div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="border-t border-white/[0.06] bg-surface py-14 md:py-16">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center md:mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Kategórie</p>
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Preskúmajte <span className="font-serif italic">trh</span>
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted">
            Vyberte oblasť a prejdite priamo do podkategórií alebo na prehľad ponuky.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {categories.map((category) => {
            const activeChildren =
              category.children?.filter((child: any) => child.status === 'ACTIVE') || []
            const subcategories = [...activeChildren]
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .slice(0, 3)

            return (
              <div
                key={category.id}
                className="group flex min-h-[240px] flex-col items-center text-center sm:min-h-[252px]"
              >
                <div className="card card-hover flex h-full w-full flex-col items-center px-4 pb-5 pt-5 shadow-md shadow-black/10 transition-all duration-200 sm:px-5 sm:pb-5 sm:pt-6">
                  <TrackedLink
                    href={`/kategoria/${category.slug}`}
                    targetType="CATEGORY"
                    targetId={category.id}
                    className="block w-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    <div className="mb-3 flex justify-center">
                      {category.image ? (
                        <div className="rounded-xl border border-white/[0.1] bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={category.image}
                            alt={category.name}
                            className="h-14 w-14 rounded-lg object-cover sm:h-[3.75rem] sm:w-[3.75rem]"
                          />
                        </div>
                      ) : category.icon ? (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.03] text-2xl leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:h-[3.75rem] sm:w-[3.75rem] sm:text-[1.65rem]">
                          {category.icon}
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] font-serif text-xl font-semibold text-accent/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:h-[3.75rem] sm:w-[3.75rem]">
                          {category.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h3 className="mx-auto max-w-[12rem] font-serif text-base font-semibold leading-snug text-white transition-colors duration-200 group-hover:text-accent-light sm:text-lg">
                      {category.name}
                    </h3>
                    <span className="mt-2 inline-flex items-center justify-center gap-0.5 text-[11px] font-medium text-accent/90 opacity-90 transition group-hover:opacity-100">
                      Zobraziť kategóriu
                      <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </TrackedLink>

                  {subcategories.length > 0 && (
                    <div className="mt-4 w-full border-t border-white/[0.08] pt-4">
                      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-[10px]">
                        Populárne v tejto oblasti
                      </p>
                      <ul className="space-y-0.5">
                        {subcategories.map((subcategory: any) => (
                          <li key={subcategory.id}>
                            <TrackedLink
                              href={`/kategoria/${subcategory.slug}`}
                              targetType="CATEGORY"
                              targetId={subcategory.id}
                              className="block rounded-md px-1.5 py-1.5 text-xs text-muted transition-colors hover:bg-white/[0.05] hover:text-white sm:text-[13px]"
                            >
                              {subcategory.name}
                            </TrackedLink>
                          </li>
                        ))}
                        {activeChildren.length > 3 && (
                          <li>
                            <span className="block px-1.5 py-1.5 text-[11px] font-medium text-accent/85">
                              +{activeChildren.length - 3} ďalších
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
