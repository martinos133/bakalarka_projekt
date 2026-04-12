'use client'

import Link from 'next/link'

export type SubcategoryItem = {
  id: string
  name: string
  slug: string
  _count?: { advertisements: number }
}

type Props = {
  rootCategory: { id: string; name: string; slug: string }
  subcategories: SubcategoryItem[]
  /** Slug aktuálnej kategórie (inzerát alebo filtrovaná stránka) */
  activeSlug: string
}

/** Rovnaký vzhľad ako na `/kategoria/[slug]` – navigácia cez odkazy. */
export default function CategorySubcategorySidebar({ rootCategory, subcategories, activeSlug }: Props) {
  if (subcategories.length === 0) return null

  const isOnRoot = activeSlug === rootCategory.slug

  return (
    <aside className="w-full min-w-0 shrink-0 lg:max-w-none">
      <div className="card sticky top-6 p-4 shadow-md shadow-black/10">
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Podkategórie</h2>
        <Link
          href={`/kategoria/${rootCategory.slug}`}
          className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            isOnRoot
              ? 'bg-accent/10 font-medium text-accent'
              : 'text-muted hover:bg-white/[0.06] hover:text-white'
          }`}
        >
          <span>Všetky</span>
        </Link>
        <ul className="space-y-0.5">
          {subcategories.map((sub) => {
            const isActive = sub.slug === activeSlug
            return (
              <li key={sub.id}>
                <Link
                  href={`/kategoria/${sub.slug}`}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-accent/10 font-medium text-accent'
                      : 'text-muted hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span>{sub.name}</span>
                  {sub._count != null && sub._count.advertisements > 0 ? (
                    <span
                      className={`ml-2 text-xs tabular-nums ${isActive ? 'text-accent/60' : 'text-white/30'}`}
                    >
                      {sub._count.advertisements}
                    </span>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
