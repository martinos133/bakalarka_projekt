'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { api } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import MetricCard from '@/components/MetricCard'
import QuickActions from '@/components/QuickActions'
import Chart from '@/components/Chart'
import { Users, UserCheck, FileText, Zap, Calendar, Bell, CheckSquare, ArrowRight } from 'lucide-react'

interface Stats {
  users: number
  activeUsers: number
  advertisements: number
  activeAdvertisements: number
}

interface CalendarEvent {
  id: string
  title: string
  type: 'EVENT' | 'REMINDER' | 'TASK'
  date: string
  completed: boolean
  color?: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const loadStats = async () => {
      try {
        const [data, events] = await Promise.all([
          api.getStats(),
          api.getCalendarEvents(
            new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
            new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString(),
          ),
        ])
        setStats(data)
        setCalendarEvents(events)
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

      {/* Organizer overview */}
      <OrganizerOverview events={calendarEvents} onNavigate={() => router.push('/dashboard/organizer')} />

      {/* Chart */}
      <div className="mb-8">
        <Chart />
      </div>
    </DashboardLayout>
  )
}

const TYPE_META = {
  EVENT: { label: 'Udalosti', icon: Calendar, color: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  REMINDER: { label: 'Pripomienky', icon: Bell, color: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  TASK: { label: 'Úlohy', icon: CheckSquare, color: '#22c55e', bg: 'bg-green-500/10', text: 'text-green-400' },
} as const

function fmtDate(d: Date) {
  return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' })
}

function fmtTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function EventRow({ ev }: { ev: CalendarEvent }) {
  const meta = TYPE_META[ev.type]
  const Icon = meta.icon
  const d = new Date(ev.date)
  const allDay = d.getHours() === 0 && d.getMinutes() === 0

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors hover:bg-white/[0.03] ${ev.completed ? 'opacity-40' : ''}`}>
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: ev.color || meta.color }}
      />
      <Icon className={`w-4 h-4 ${meta.text} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm text-white leading-snug truncate ${ev.completed ? 'line-through' : ''}`}>
          {ev.title}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-white/50">{fmtDate(d)}</p>
        {!allDay && <p className="text-[10px] text-muted">{fmtTime(d)}</p>}
      </div>
    </div>
  )
}

function OrganizerOverview({ events, onNavigate }: { events: CalendarEvent[]; onNavigate: () => void }) {
  const now = new Date()
  const monthName = now.toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const todayEvents = events.filter((e) => e.date.startsWith(todayKey))

  const upcoming = events
    .filter((e) => new Date(e.date) >= now && !e.completed && !e.date.startsWith(todayKey))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  const openTasks = events
    .filter((e) => e.type === 'TASK' && !e.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const taskCount = events.filter((e) => e.type === 'TASK').length
  const tasksDone = events.filter((e) => e.type === 'TASK' && e.completed).length

  const eventCount = events.filter((e) => e.type === 'EVENT').length
  const reminderCount = events.filter((e) => e.type === 'REMINDER').length

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">Organizér</h2>
          <p className="text-xs text-muted mt-0.5">
            Prehľad za {monthName}
          </p>
        </div>
        <button
          onClick={onNavigate}
          className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-light transition-colors"
        >
          Otvoriť organizér
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Udalosti', count: eventCount, meta: TYPE_META.EVENT },
          { label: 'Pripomienky', count: reminderCount, meta: TYPE_META.REMINDER },
          { label: 'Úlohy dokončené', count: tasksDone, total: taskCount, meta: TYPE_META.TASK },
          { label: 'Dnes', count: todayEvents.length, meta: { icon: Calendar, bg: 'bg-accent/10', text: 'text-accent' } },
        ].map((item, i) => {
          const Icon = item.meta.icon
          return (
            <div key={i} className="bg-card rounded-2xl border border-white/[0.06] p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${item.meta.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${item.meta.text}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white leading-none">
                  {item.count}
                  {'total' in item && item.total ? <span className="text-sm text-white/30 font-medium">/{item.total}</span> : null}
                </p>
                <p className="text-[11px] text-muted mt-0.5">{item.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today */}
        <div className="bg-card rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Dnes</h3>
            <span className="text-xs text-accent font-semibold">{todayEvents.length}</span>
          </div>
          <div className="p-2">
            {todayEvents.length > 0 ? (
              todayEvents.map((ev) => <EventRow key={ev.id} ev={ev} />)
            ) : (
              <p className="text-xs text-white/25 text-center py-6">Žiadne udalosti na dnes</p>
            )}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-card rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Nadchádzajúce</h3>
            <span className="text-xs text-muted">{upcoming.length} udalostí</span>
          </div>
          <div className="p-2">
            {upcoming.length > 0 ? (
              upcoming.map((ev) => <EventRow key={ev.id} ev={ev} />)
            ) : (
              <p className="text-xs text-white/25 text-center py-6">Žiadne nadchádzajúce udalosti</p>
            )}
          </div>
        </div>

        {/* Open tasks */}
        <div className="bg-card rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Nesplnené úlohy</h3>
            <span className="text-xs text-red-400 font-semibold">{openTasks.length}</span>
          </div>
          <div className="p-2">
            {openTasks.length > 0 ? (
              openTasks.slice(0, 5).map((ev) => <EventRow key={ev.id} ev={ev} />)
            ) : (
              <div className="text-center py-6">
                <CheckSquare className="w-6 h-6 text-green-500/30 mx-auto mb-1.5" />
                <p className="text-xs text-green-400/60">Všetky úlohy sú splnené</p>
              </div>
            )}
            {openTasks.length > 5 && (
              <button
                onClick={onNavigate}
                className="w-full text-center text-xs text-accent hover:underline py-2"
              >
                + {openTasks.length - 5} ďalších
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
