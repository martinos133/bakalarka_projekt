'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { FolderOpen, FileText } from 'lucide-react'

interface PopularCategory {
  id: string
  label: string
  href: string
  order: number
}

export default function Hero() {
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [popularCategories, setPopularCategories] = useState<PopularCategory[]>(
    []
  )
  const [suggestions, setSuggestions] = useState<{ categories: any[]; advertisements: any[] }>({ categories: [], advertisements: [] })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  useEffect(() => {
    api
      .getPopularCategories()
      .then((data: { items?: PopularCategory[] }) => {
        const items = data?.items ?? []
        setPopularCategories(
          Array.isArray(items)
            ? items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            : []
        )
      })
      .catch(() => setPopularCategories([]))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (query) {
      setShowSuggestions(false)
      router.push(`/vyhladavanie?q=${encodeURIComponent(query)}`)
    }
  }

  // Návrhy pri 3+ písmenách (ako v navbare)
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions({ categories: [], advertisements: [] })
      setShowSuggestions(false)
      return
    }
    const timer = setTimeout(async () => {
      try {
        setSuggestionsLoading(true)
        const data = await api.getSearchSuggestions(searchQuery.trim())
        setSuggestions(data)
        setShowSuggestions(true)
      } catch {
        setSuggestions({ categories: [], advertisements: [] })
      } finally {
        setSuggestionsLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasSuggestions = suggestions.categories.length > 0 || suggestions.advertisements.length > 0

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1976&q=80')`,
            filter: 'blur(3px) brightness(0.5)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/60 via-dark/70 to-dark"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
        <div className="max-w-4xl">
          <p className="text-accent text-sm font-semibold uppercase tracking-[0.2em] mb-4">Profesionálne služby</p>
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
            Naši freelanceri
            <br />
            <span className="font-serif italic text-accent">sa o to postarajú</span>
          </h1>

          {/* Search Bar */}
          <div ref={searchRef} className="relative mb-6">
            <form onSubmit={handleSearch} className="flex gap-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 3 && hasSuggestions && setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowSuggestions(false)
                }}
                placeholder="Hľadať akúkoľvek službu..."
                className="flex-1 px-6 py-4 text-lg rounded-l-xl rounded-r-none border border-white/10 border-r-0 bg-dark-50/80 backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-accent text-white placeholder-gray-500"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-accent text-dark font-semibold rounded-r-xl hover:bg-accent-light transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label="Search"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>

            {/* Dropdown s návrhmi (ako v navbare) */}
            {showSuggestions && searchQuery.trim().length >= 3 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-dark border border-white/[0.08] rounded-md shadow-xl shadow-black/30 z-50 overflow-hidden">
                {suggestionsLoading ? (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">Načítavam...</div>
                ) : hasSuggestions ? (
                  <div className="py-2 max-h-80 overflow-y-auto">
                    {suggestions.categories.length > 0 && (
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Kategórie
                      </div>
                    )}
                    {suggestions.categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/kategoria/${cat.slug}`}
                        onClick={() => setShowSuggestions(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-dark-200/[0.04] transition-colors"
                      >
                        <FolderOpen className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="text-sm font-medium text-white">{cat.name}</span>
                        <span className="ml-auto text-xs text-gray-500 bg-dark-100 px-2 py-0.5 rounded">Kategória</span>
                      </Link>
                    ))}
                    {suggestions.advertisements.length > 0 && (
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1 border-t border-white/[0.06]">
                        Inzeráty
                      </div>
                    )}
                    {suggestions.advertisements.map((ad) => (
                      <Link
                        key={ad.id}
                        href={`/inzerat/${ad.id}`}
                        onClick={() => setShowSuggestions(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-dark-200/[0.04] transition-colors"
                      >
                        {ad.images?.[0] ? (
                          <img src={ad.images[0]} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-white block truncate">{ad.title}</span>
                          {ad.price != null && (
                            <span className="text-xs text-accent font-semibold">{ad.price} €</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 bg-dark-100 px-2 py-0.5 rounded flex-shrink-0">Inzerát</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-sm text-gray-500">Žiadne návrhy</div>
                )}
              </div>
            )}
          </div>

          {/* Popular Categories */}
          {popularCategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-white text-sm font-medium">
                Populárne:
              </span>
              {popularCategories.map((category) => (
                <Link
                  key={category.id}
                  href={category.href || '#'}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-dark-200/20 transition-colors text-sm border border-white/20"
                >
                  {category.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
