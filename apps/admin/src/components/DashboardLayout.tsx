'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { api } from '@/lib/api'
import Sidebar from './Sidebar'
import Header from './Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    } else {
      setAuthed(true)

      api.heartbeat().catch(() => {})

      heartbeatRef.current = setInterval(() => {
        api.heartbeat().catch(() => {})
      }, 60_000)
    }

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [router])

  if (!authed) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted text-sm">Načítavanie...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark text-white flex">
      <Sidebar />
      <div className="flex-1 ml-64 transition-all duration-300">
        <Header />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
