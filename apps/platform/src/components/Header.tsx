'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getAuthUser, setAuthUser, logout } from '@/lib/auth'
import { api } from '@/lib/api'
import { User, LogOut, ChevronDown, FolderOpen, FileText, PlusCircle } from 'lucide-react'

interface NavbarItem {
  id: string
  label: string
  href: string
  order: number
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

  const hasSuggestions = suggestions.categories.length > 0 || suggestions.advertisements.length > 0
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
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl mx-4 relative">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="flex w-full border border-white/10 rounded-md overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length >= 3 && hasSuggestions && setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setShowSuggestions(false)
                  }}
                  placeholder="Akú službu hľadáte dnes?"
                  className="flex-1 px-4 py-2 text-sm focus:outline-none text-white placeholder-white/40 bg-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-accent text-dark hover:bg-accent-light transition-colors"
                  aria-label="Search"
                >
                  <svg
                    className="w-5 h-5"
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
              </div>
            </form>

            {/* Dropdown s návrhmi */}
            {showSuggestions && searchQuery.trim().length >= 3 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-dark border border-white/[0.08] rounded-md shadow-lg shadow-black/20 z-50 overflow-hidden">
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
                href={item.href}
                className="text-white hover:text-accent-light transition-colors text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
            {mounted && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-dark-200/[0.06] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-sm">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
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
                      href="/podat-inzerat"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-dark-200/[0.04] transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <PlusCircle className="w-4 h-4 text-accent" />
                      Podať inzerát
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
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-sm">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
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
                      href="/podat-inzerat"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-dark-200/[0.04] transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <PlusCircle className="w-4 h-4 text-accent" />
                      Podať inzerát
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
            {navbarItemsWithoutMap.map((item) => (
              <Link
                key={item.id}
                href={item.href}
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
