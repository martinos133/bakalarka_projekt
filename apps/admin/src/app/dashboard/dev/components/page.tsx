'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'

export default function DevComponentsPage() {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    }
  }, [router])

  return (
    <DashboardLayout>
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Development - Komponenty</h1>
            <p className="text-gray-400">Správa a úprava UI komponentov platformy</p>
          </div>
          <div className="card p-6">
            <p className="text-gray-400">Funkcionalita pre správu komponentov bude pridaná...</p>
          </div>
        </DashboardLayout>
  )
}
