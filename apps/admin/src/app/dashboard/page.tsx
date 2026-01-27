'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import MetricCard from '@/components/MetricCard'
import QuickActions from '@/components/QuickActions'
import Chart from '@/components/Chart'

interface Stats {
  users: number
  activeUsers: number
  advertisements: number
  activeAdvertisements: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const loadStats = async () => {
      try {
        const data = await api.getStats()
        setStats(data)
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-white text-xl">Načítavanie...</div>
      </div>
    )
  }

  const activeUsersPercentage = stats && stats.users > 0
    ? Math.round((stats.activeUsers / stats.users) * 100)
    : 0

  return (
    <div className="min-h-screen bg-dark text-white flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Celkovo používateľov"
              value={stats?.users || 0}
              subtitle="Registrovaní používatelia"
              description="Celkový počet v systéme"
              buttonText="Všetci"
              onButtonClick={() => router.push('/dashboard/users')}
            />
            <MetricCard
              title="Aktívni používatelia"
              value={stats?.activeUsers || 0}
              subtitle={activeUsersPercentage > 0 ? `~${activeUsersPercentage}%` : 'Potrebuje pozornosť'}
              description="Používatelia s aspoň 1 inzerátom"
              trend={
                activeUsersPercentage > 0
                  ? { value: `${activeUsersPercentage}%`, isPositive: true }
                  : undefined
              }
            />
            <MetricCard
              title="Celkovo inzerátov"
              value={stats?.advertisements || 0}
              subtitle="Všetky inzeráty"
              description="Bez archivovaných inzerátov"
              buttonText="Inzeráty"
              onButtonClick={() => router.push('/dashboard/advertisements')}
            />
            <MetricCard
              title="Aktívne inzeráty"
              value={stats?.activeAdvertisements || 0}
              subtitle="Aktuálne aktívne"
              description="Bez zrušených inzerátov"
              buttonText="Aktívne"
              onButtonClick={() => router.push('/dashboard/advertisements?status=ACTIVE')}
            />
          </div>

          <div className="mb-8">
            <QuickActions />
          </div>

          <div>
            <Chart />
          </div>
        </main>
      </div>
    </div>
  )
}
