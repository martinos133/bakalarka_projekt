'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { isAuthenticated, getAuthUser, setAuthUser, logout } from '@/lib/auth'
import { api } from '@/lib/api'
import { User, LogOut, ChevronDown } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated()) {
      setUser(getAuthUser())
    }
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
    console.log('Searching for:', searchQuery)
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
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
              <span className="text-2xl font-bold text-gray-900 tracking-tight">RentMe</span>
              <span className="w-2 h-2 bg-[#1dbf73] rounded-full"></span>
            </Link>
          </div>

          {/* Center - Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-2xl mx-4"
          >
            <div className="flex w-full border border-gray-300 rounded-md overflow-hidden focus-within:border-[#1dbf73] focus-within:ring-1 focus-within:ring-[#1dbf73]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Akú službu hľadáte dnes?"
                className="flex-1 px-4 py-2 text-sm focus:outline-none text-gray-900 placeholder-gray-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
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

          {/* Right side - Navigation */}
          <nav className="hidden lg:flex items-center gap-6 flex-shrink-0">
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-900 hover:text-[#1dbf73] transition-colors text-sm font-medium">
                RentMe Pro
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-900 hover:text-[#1dbf73] transition-colors text-sm font-medium">
                Preskúmať
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
            <Link
              href="/become-seller"
              className="text-gray-900 hover:text-[#1dbf73] transition-colors text-sm font-medium"
            >
              Stať sa predajcom
            </Link>
            {mounted && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1dbf73] flex items-center justify-center text-white font-semibold text-sm">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {user.firstName || user.email.split('@')[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.firstName || user.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Môj profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                  className="text-gray-900 hover:text-[#1dbf73] transition-colors text-sm font-medium"
                >
                  Prihlásiť sa
                </Link>
                <Link
                  href="/join"
                  className="px-4 py-2 bg-[#1dbf73] text-white rounded-md hover:bg-[#19a463] transition-colors font-medium text-sm"
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
                  <div className="w-8 h-8 rounded-full bg-[#1dbf73] flex items-center justify-center text-white font-semibold text-sm">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.firstName || user.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Môj profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                  className="text-gray-900 text-sm"
                >
                  Prihlásiť sa
                </Link>
                <Link
                  href="/join"
                  className="px-3 py-1.5 border-2 border-blue-500 text-blue-500 rounded-md text-sm font-medium"
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
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <button className="flex items-center justify-between w-full text-gray-900">
              RentMe Pro
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button className="flex items-center justify-between w-full text-gray-900">
              Preskúmať
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <Link
              href="/become-seller"
              className="block text-gray-900"
            >
              Stať sa predajcom
            </Link>
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
