'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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
          </nav>

          {/* Mobile menu button - Sign in/Join */}
          <div className="flex lg:hidden items-center gap-3">
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
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <button className="flex items-center justify-between w-full text-gray-900">
              Fiverr Pro
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
              Explore
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
    </header>
  )
}
