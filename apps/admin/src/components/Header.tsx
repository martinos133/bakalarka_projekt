'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { getAuthUser } from '@/lib/auth'

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setUser(getAuthUser())
  }, [])

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!mounted) return 'A'
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'
  }

  return (
    <div className="bg-card border-b border-dark px-6 py-4 flex items-center justify-between">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Vyhľadať"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark border border-dark rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-white font-semibold">
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm">
              {user?.firstName || 'Admin'} {user?.lastName || ''}
            </span>
            <span className="text-gray-400 text-xs">
              {user?.email || 'admin@example.com'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
