'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getAuthUser, setAuthUser, logout } from '@/lib/auth'
import { api } from '@/lib/api'
import { User, LogOut, ChevronDown, PlusCircle } from 'lucide-react'
import SearchSuggestionsPanel from '@/components/SearchSuggestionsPanel'

interface NavbarItem {
  id: string
  label: string
  href: string
  order: number
}

const PODAT_INZERAT = '/podat-inzerat'

/** Položky menu z CMS niekedy ukazujú starý odkaz na záložku v dashboarde – zjednotíme na verejný formulár. */
function normalizeNavbarHref(href: string): string {
  if (!href || typeof href !== 'string') return href
  const h = href.trim()
  if (h.includes('tab=create')) return PODAT_INZERAT
  return h
}

export default function Header() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [navbarItems, setNavbarItems] = useState<NavbarItem[]>([])
  const [suggestions, setSuggestions] = useState<{ categories: any[]; advertisements: any[] }>({ categories: [], advertisements: [] })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated()) {
      setUser(getAuthUser())
    }
  }, [])

  useEffect(() => {
    api.getNavbar().then((data: { items: NavbarItem[] }) => {
      setNavbarItems((data.items || []).sort((a, b) => a.order - b.order))
    }).catch(() => {})
  }, [])

  // Pri každom načítaní stránky (keď je používateľ prihlásený) stiahneme profil z API
  // a uložíme do localStorage – aby trackClick mal vždy aktuálne pohlavie a typ účtu
  useEffect(() => {
    if (!isAuthenticated()) return
    api.getMyProfile()
      .then((profile) => {
        setAuthUser(profile)
        setUser(getAuthUser())
      })
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    setUser(null)
    setShowUserMenu(false)
  }

  // Re-check authentication when component mounts or when navigating
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        setUser(getAuthUser())
      } else {
        setUser(null)
      }
    }
    checkAuth()
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (query) {
      setShowSuggestions(false)
      router.push(`/vyhladavanie?q=${encodeURIComponent(query)}`)
    }
  }

  // Načítanie návrhov pri 3+ písmenách (debounced)
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

  // Klik mimo – zatvorenie dropdownu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navbarItemsWithoutMap = navbarItems.filter((item) => item.href !== '/mapa')

  return (
    <header className="sticky top-0 z-50 bg-dark/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left side - Logo and Hamburger */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link href="/" className="flex items-center gap-1.5">
              <span className="text-2xl font-serif italic text-white tracking-tight">RentMe</span>
              <span className="w-2 h-2 bg-accent rounded-full"></span>
            </Link>
          </div>

          {/* Center - Search Bar */}
          <div ref={searchRef} className="relative z-[60] mx-4 hidden max-w-2xl flex-1 md:flex">
            <div className="w-full overflow-hidden rounded-lg border border-white/[0.1] bg-card shadow-lg shadow-black/25 transition-[border-color,box-shadow] focus-within:border-accent/45 focus-within:ring-1 focus-within:ring-accent/20">
              <form onSubmit={handleSearch} className="flex w-full min-w-0">
                <input
                  suppressHydrationWarning
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length >= 3 && setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setShowSuggestions(false)
                  }}
                  placeholder="Akú službu hľadáte dnes?"
                  className="min-w-0 flex-1 border-0 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-0"
                />
                <button
                  type="submit"
                  className="shrink-0 border-l border-white/[0.08] bg-accent px-5 py-2 text-dark transition-colors hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  aria-label="Hľadať"
                >
                  <svg
                    className="h-5 w-5"
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

          {/* Right side - Navigation */}
          <nav className="hidden lg:flex items-center gap-6 flex-shrink-0">
            <Link
              href="/mapa"
              className="text-white hover:text-accent-light transition-colors text-sm font-medium"
            >
              Mapa
            </Link>
            {navbarItemsWithoutMap.map((item) => (
              <Link
                key={item.id}
                href={normalizeNavbarHref(item.href)}
                className="text-white hover:text-accent-light transition-colors text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
            {mounted && !user && (
              <Link
                href={PODAT_INZERAT}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white transition-colors hover:text-accent-light"
              >
                <PlusCircle className="h-4 w-4 text-accent" aria-hidden />
                Pridať inzerát
              </Link>
            )}
            {mounted && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-dark-200/[0.06] transition-colors"
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                      {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-white">
                    {user.firstName || user.email.split('@')[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark rounded-lg shadow-lg shadow-black/20 border border-white/[0.08] py-2 z-50">
                    <div className="px-4 py-2 border-b border-white/[0.06]">
                      <p className="text-sm font-semibold text-white">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.firstName || user.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href={PODAT_INZERAT}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-dark-200/[0.04] transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <PlusCircle className="w-4 h-4 text-accent" />
                      Pridať inzerát
                    </Link>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-dark-200/[0.04] transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Môj profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Odhlásiť sa
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-white hover:text-accent-light transition-colors text-sm font-medium"
                >
                  Prihlásiť sa
                </Link>
                <Link
                  href="/join"
                  className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-light transition-colors font-medium text-sm"
                >
                  Registrovať sa
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button - Sign in/Join */}
          <div className="flex lg:hidden items-center gap-3">
            {mounted && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2"
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                      {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark rounded-lg shadow-lg shadow-black/20 border border-white/[0.08] py-2 z-50">
                    <div className="px-4 py-2 border-b border-white/[0.06]">
                      <p className="text-sm font-semibold text-white">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.firstName || user.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href={PODAT_INZERAT}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-dark-200/[0.04] transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <PlusCircle className="w-4 h-4 text-accent" />
                      Pridať inzerát
                    </Link>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-dark-200/[0.04] transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Môj profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Odhlásiť sa
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-white text-sm"
                >
                  Prihlásiť sa
                </Link>
                <Link
                  href="/join"
                  className="px-3 py-1.5 border-2 border-accent text-accent rounded-md text-sm font-medium"
                >
                  Registrovať sa
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-white/[0.08] bg-dark">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/mapa"
              className="block text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Mapa
            </Link>
            <Link
              href={PODAT_INZERAT}
              className="flex items-center gap-2 text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              <PlusCircle className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              Pridať inzerát
            </Link>
            {navbarItemsWithoutMap.map((item) => (
              <Link
                key={item.id}
                href={normalizeNavbarHref(item.href)}
                className="block text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}
