'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Bell, LogOut, ChevronDown } from 'lucide-react'
import { getAuthUser, logout } from '@/lib/auth'

const shortcuts = [
  { label: 'Inzeráty', path: '/dashboard/advertisements' },
  { label: 'Používatelia', path: '/dashboard/users' },
  { label: 'Moderácia', path: '/dashboard/pending' },
  { label: 'Nastavenia', path: '/dashboard/settings' },
]

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const userMenuRef = useRef<HTMLDivElement>(null)

  const pageTitle = getPageTitle(pathname)

  useEffect(() => {
    setUser(getAuthUser())
  }, [])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!userMenuOpen) return
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [userMenuOpen])

  const initials =
    ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() ||
    (user?.email?.[0] || 'A').toUpperCase()

  return (
    <header className="sticky top-0 z-30 bg-dark/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center justify-between px-8 h-16">
        <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>

        <div className="flex items-center gap-3">
          {/* Shortcuts */}
          <nav className="hidden lg:flex items-center gap-1 mr-2">
            {shortcuts.map((s) => (
              <button
                key={s.path}
                onClick={() => router.push(s.path)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${pathname === s.path
                    ? 'bg-accent/10 text-accent'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  }
                `}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="h-5 w-px bg-white/[0.08] hidden lg:block" />

          {/* Search */}
          <div className={`relative transition-all duration-200 ${searchFocused ? 'w-64' : 'w-48'}`}>
            <input
              type="text"
              placeholder="Hľadať..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ paddingLeft: '2.25rem' }}
              className="w-full bg-white/[0.08] border border-white/[0.10] rounded-xl pr-4 py-2 text-sm text-white transition-all focus:outline-none focus:border-accent/40 focus:bg-white/[0.12]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
          </button>

          {/* User menu */}
          <div ref={userMenuRef} className="relative ml-1">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className={`
                flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-2xl transition-colors
                ${userMenuOpen ? 'bg-white/[0.06]' : 'hover:bg-white/[0.06]'}
              `}
            >
              <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-xs flex-shrink-0">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-white leading-tight">
                  {user?.firstName || 'Admin'} {user?.lastName || 'User'}
                </p>
                <p className="text-[11px] text-muted leading-tight">Administrátor</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/35 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[rgb(30,30,30)] border border-white/[0.08] rounded-2xl shadow-xl shadow-black/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.firstName || 'Admin'} {user?.lastName || 'User'}
                  </p>
                  <p className="text-xs text-muted truncate">{user?.email || ''}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    logout()
                    router.push('/login')
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  Odhlásiť sa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/advertisements': 'Inzeráty',
    '/dashboard/users': 'Používatelia',
    '/dashboard/categories': 'Kategórie',
    '/dashboard/specifications': 'Špecifikácie',
    '/dashboard/monitoring': 'Monitoring kliknutí',
    '/dashboard/contact-forms': 'Kontaktné formuláre',
    '/dashboard/pending': 'Čakajúce inzeráty',
    '/dashboard/reported': 'Nahlásené inzeráty',
    '/dashboard/settings': 'Nastavenia',
    '/dashboard/dev/static-pages': 'Statické stránky',
    '/dashboard/dev/blog': 'Blog',
    '/dashboard/dev/categories': 'Kategórie (DEV)',
    '/dashboard/dev/advertisements': 'Inzeráty (DEV)',
    '/dashboard/dev/menu': 'Menu',
    '/dashboard/dev/components': 'Komponenty',
    '/dashboard/dev/config': 'Konfigurácia',
    '/dashboard/dev/filters': 'Filtre',
  }
  return map[pathname] || 'Admin Panel'
}
