'use client'

import Link from 'next/link'
import { FolderOpen, FileText } from 'lucide-react'

export type SearchSuggestionsData = {
  categories: { id: string; slug: string; name: string }[]
  advertisements: {
    id: string
    title: string
    price?: number | null
    images?: string[]
  }[]
}

type Props = {
  loading: boolean
  suggestions: SearchSuggestionsData
  onPick: () => void
}

const sectionLabelClass =
  'px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted'
const rowClass =
  'flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-popupRowHover'
const badgeClass =
  'ml-auto shrink-0 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted'

export default function SearchSuggestionsPanel({ loading, suggestions, onPick }: Props) {
  const has =
    suggestions.categories.length > 0 || suggestions.advertisements.length > 0

  if (loading) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted" role="status">
        Načítavam…
      </div>
    )
  }

  if (!has) {
    return <div className="px-4 py-5 text-sm text-muted">Žiadne návrhy</div>
  }

  return (
    <div className="max-h-[min(20rem,70vh)] overflow-y-auto overscroll-contain py-1">
      {suggestions.categories.length > 0 && (
        <div className="px-1">
          <div className={sectionLabelClass}>Kategórie</div>
          {suggestions.categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/kategoria/${cat.slug}`}
              onClick={onPick}
              className={rowClass}
            >
              <FolderOpen className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{cat.name}</span>
              <span className={badgeClass}>Kategória</span>
            </Link>
          ))}
        </div>
      )}
      {suggestions.advertisements.length > 0 && (
        <div className={`px-1 ${suggestions.categories.length > 0 ? 'border-t border-white/[0.06]' : ''}`}>
          <div className={`${sectionLabelClass} ${suggestions.categories.length > 0 ? 'mt-0.5' : ''}`}>
            Inzeráty
          </div>
          {suggestions.advertisements.map((ad) => (
            <Link key={ad.id} href={`/inzerat/${ad.id}`} onClick={onPick} className={rowClass}>
              {ad.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.images[0]}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-md border border-white/[0.08] object-cover ring-1 ring-black/30"
                />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">{ad.title}</span>
                {ad.price != null && (
                  <span className="mt-0.5 block text-xs font-semibold tabular-nums text-accent">
                    {Number(ad.price).toLocaleString('sk-SK')} €
                  </span>
                )}
              </div>
              <span className={badgeClass}>Inzerát</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
