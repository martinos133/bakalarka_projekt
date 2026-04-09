'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Bell } from 'lucide-react'

const shortcuts = [
  { label: 'Inzeráty', path: '/dashboard/advertisements' },
  { label: 'Používatelia', path: '/dashboard/users' },
  { label: 'Moderácia', path: '/dashboard/pending' },
  { label: 'Nastavenia', path: '/dashboard/settings' },
]

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const pageTitle = getPageTitle(pathname)

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
                    ? 'bg-primary/10 text-primary'
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
              className="input px-4 py-2.5 pl-9 text-sm text-white placeholder-white/70 focus:outline-none focus:border-primary/40 focus:bg-white/[0.08] transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>
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
