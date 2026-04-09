'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { api } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import MetricCard from '@/components/MetricCard'
import QuickActions from '@/components/QuickActions'
import Chart from '@/components/Chart'
import { Users, UserCheck, FileText, Zap } from 'lucide-react'

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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted text-sm">Načítavanie...</p>
        </div>
      </div>
    )
  }

  const activeUsersPercentage = stats && stats.users > 0
    ? Math.round((stats.activeUsers / stats.users) * 100)
    : 0

  const currentMonth = new Date().toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })

  return (
    <DashboardLayout>
      {/* Quick actions */}
      <div className="mb-8">
        <QuickActions />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Celkovo používateľov"
          value={stats?.users || 0}
          subtitle="Registrovaní v systéme"
          icon={Users}
          iconColor="blue"
          buttonText="Všetci"
          onButtonClick={() => router.push('/dashboard/users')}
        />
        <MetricCard
          title="Aktívni používatelia"
          value={stats?.activeUsers || 0}
          subtitle="S aspoň 1 inzerátom"
          icon={UserCheck}
          iconColor="green"
          trend={
            activeUsersPercentage > 0
              ? { value: `${activeUsersPercentage}%`, isPositive: true }
              : undefined
          }
        />
        <MetricCard
          title="Celkovo inzerátov"
          value={stats?.advertisements || 0}
          subtitle="Bez archivovaných"
          icon={FileText}
          iconColor="purple"
          buttonText="Inzeráty"
          onButtonClick={() => router.push('/dashboard/advertisements')}
        />
        <MetricCard
          title="Aktívne inzeráty"
          value={stats?.activeAdvertisements || 0}
          subtitle="Aktuálne aktívne"
          icon={Zap}
          iconColor="orange"
          buttonText="Zobraziť"
          onButtonClick={() => router.push('/dashboard/advertisements?status=ACTIVE')}
        />
      </div>

      {/* Chart */}
      <div className="mb-8">
        <Chart />
      </div>
    </DashboardLayout>
  )
}
