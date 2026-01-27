'use client'

import { useState } from 'react'

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle search logic here
    console.log('Searching for:', searchQuery)
  }

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1976&q=80')`,
            filter: 'blur(3px) brightness(0.7)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
        <div className="max-w-4xl">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight font-sans">
            Naši freelanceri
            <br />
            sa o to postarajú
          </h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-0 mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hľadať akúkoľvek službu..."
              className="flex-1 px-6 py-4 text-lg rounded-l-md rounded-r-none border-0 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] text-gray-900 placeholder-gray-500 shadow-lg"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-black text-white rounded-r-md hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1dbf73] shadow-lg"
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

          {/* Popular Categories */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-white text-sm font-medium">Populárne:</span>
            {[
              'Dizajn webu',
              'WordPress',
              'Dizajn loga',
              'Úprava videa',
              'Hlasové prevedenie',
            ].map((category) => (
              <button
                key={category}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors text-sm border border-white/20"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
