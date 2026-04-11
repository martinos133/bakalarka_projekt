'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import SearchSuggestionsPanel from '@/components/SearchSuggestionsPanel'

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
      setShowSuggestions(true)
      setSuggestionsLoading(true)
      try {
        const data = await api.getSearchSuggestions(searchQuery.trim())
        setSuggestions(data)
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
          <div ref={searchRef} className="relative z-[60] mb-6">
            <div className="overflow-hidden rounded-xl border border-white/[0.1] bg-card/95 shadow-xl shadow-black/30 backdrop-blur-md transition-[border-color,box-shadow] focus-within:border-accent/45 focus-within:ring-1 focus-within:ring-accent/20">
              <form onSubmit={handleSearch} className="flex w-full min-w-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length >= 3 && setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setShowSuggestions(false)
                  }}
                  placeholder="Hľadať akúkoľvek službu..."
                  className="min-w-0 flex-1 border-0 bg-transparent px-5 py-4 text-base text-white placeholder:text-white/35 focus:outline-none focus:ring-0 md:text-lg"
                />
                <button
                  type="submit"
                  className="shrink-0 border-l border-white/[0.08] bg-accent px-7 py-4 font-semibold text-dark transition-colors hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  aria-label="Hľadať"
                >
                  <svg
                    className="h-6 w-6"
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
              {showSuggestions && searchQuery.trim().length >= 3 && (
                <div className="border-t border-white/[0.06] bg-popup">
                  <SearchSuggestionsPanel
                    loading={suggestionsLoading}
                    suggestions={suggestions}
                    onPick={() => setShowSuggestions(false)}
                  />
                </div>
              )}
            </div>
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
