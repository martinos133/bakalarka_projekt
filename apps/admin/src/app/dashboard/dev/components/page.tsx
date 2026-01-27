'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function DevComponentsPage() {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-dark text-white flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Development - Komponenty</h1>
            <p className="text-gray-400">Správa a úprava UI komponentov platformy</p>
          </div>
          <div className="bg-card rounded-lg p-6 border border-dark">
            <p className="text-gray-400">Funkcionalita pre správu komponentov bude pridaná...</p>
          </div>
        </main>
      </div>
    </div>
  )
}
