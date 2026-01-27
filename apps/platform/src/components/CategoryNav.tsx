'use client'

import { useState } from 'react'

export default function CategoryNav() {
  const [showMore, setShowMore] = useState(false)

  const categories = [
    'Grafika a dizajn',
    'Programovanie a technológie',
    'Digitálny marketing',
    'Video a animácia',
    'Písanie a preklad',
    'Hudba a audio',
    'Podnikanie',
    'Dáta',
    'Fotografia',
    'Životný štýl',
  ]

  const visibleCategories = showMore ? categories : categories.slice(0, 5)

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 text-gray-900 font-medium py-3 flex-shrink-0">
            <svg
              className="w-5 h-5 text-orange-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm">Trendy</span>
          </div>
          {visibleCategories.map((category, index) => (
            <a
              key={index}
              href="#"
              className="text-sm text-gray-700 hover:text-[#1dbf73] transition-colors whitespace-nowrap py-3 border-b-2 border-transparent hover:border-[#1dbf73] flex-shrink-0"
            >
              {category}
            </a>
          ))}
          {!showMore && (
            <button
              onClick={() => setShowMore(true)}
              className="flex items-center gap-1 text-sm text-gray-700 hover:text-[#1dbf73] transition-colors whitespace-nowrap py-3 flex-shrink-0"
            >
              <span>Viac</span>
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
          )}
        </div>
      </div>
    </nav>
  )
}
