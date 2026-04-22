'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getAuthUser } from '@/lib/auth'
import { api } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import MetricCard from '@/components/MetricCard'
import QuickActions from '@/components/QuickActions'
import Chart from '@/components/Chart'
import UsersChart from '@/components/UsersChart'
import { Users, UserCheck, FileText, Zap, Calendar, Bell, CheckSquare, ArrowRight, MessageCircle, Send } from 'lucide-react'

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
  const [chatConversations, setChatConversations] = useState<any[]>([])
  const [chatUnread, setChatUnread] = useState<{ total: number; counts: Record<string, number> }>({ total: 0, counts: {} })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const loadStats = async () => {
      try {
        const [data, events, convs, unread] = await Promise.all([
          api.getStats(),
          api.getCalendarEvents(
            new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
            new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString(),
          ),
          api.getChatConversations().catch(() => []),
          api.getChatUnread().catch(() => ({ total: 0, counts: {} })),
        ])
        setStats(data)
        setCalendarEvents(events)
        setChatConversations(convs)
        setChatUnread(unread)
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

      {/* Chat overview */}
      <ChatOverview
        conversations={chatConversations}
        unread={chatUnread}
        onNavigate={() => router.push('/dashboard/team-chat')}
      />

      {/* Organizer overview */}
      <OrganizerOverview events={calendarEvents} onNavigate={() => router.push('/dashboard/organizer')} />

      {/* Charts */}
      <div className="mb-8 space-y-8">
        <Chart />
        <UsersChart />
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

function ChatOverview({
  conversations,
  unread,
  onNavigate,
}: {
  conversations: any[]
  unread: { total: number; counts: Record<string, number> }
  onNavigate: () => void
}) {
  const user = getAuthUser()

  function getName(p: any) {
    if (p?.firstName || p?.lastName) return `${p.firstName || ''} ${p.lastName || ''}`.trim()
    return p?.email || '–'
  }

  function getInitials(p: any) {
    const f = p?.firstName?.charAt(0) || ''
    const l = p?.lastName?.charAt(0) || ''
    return (f + l).toUpperCase() || p?.email?.charAt(0).toUpperCase() || '?'
  }

  function isOnlineCheck(lastLoginAt?: string | null) {
    if (!lastLoginAt) return false
    return Date.now() - new Date(lastLoginAt).getTime() < 5 * 60 * 1000
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'teraz'
    if (mins < 60) return `${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hod`
    return `${Math.floor(hours / 24)} d`
  }

  const unreadConvs = conversations.filter((c) => (unread.counts[c.id] || 0) > 0)
  const recentConvs = conversations.filter((c) => c.lastMessage).slice(0, 5)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Správy</h2>
            <p className="text-xs text-muted mt-0.5">{conversations.length} konverzácií</p>
          </div>
          {unread.total > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-xs font-semibold text-accent">{unread.total} neprečítaných</span>
            </span>
          )}
        </div>
        <button
          onClick={onNavigate}
          className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-light transition-colors"
        >
          Otvoriť chat
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Unread */}
        <div className="bg-card rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Neprečítané</h3>
            {unread.total > 0 && (
              <span className="min-w-[22px] h-[22px] rounded-full bg-accent text-dark text-xs font-bold flex items-center justify-center px-1.5">
                {unread.total}
              </span>
            )}
          </div>
          <div className="p-2">
            {unreadConvs.length > 0 ? (
              unreadConvs.slice(0, 4).map((conv) => {
                const cnt = unread.counts[conv.id] || 0
                const online = isOnlineCheck(conv.partner?.lastLoginAt)
                return (
                  <div key={conv.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors" onClick={onNavigate}>
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-semibold text-accent">
                        {getInitials(conv.partner)}
                      </div>
                      {online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-[1.5px] border-card" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{getName(conv.partner)}</p>
                      <p className="text-xs text-white/40 truncate">{conv.lastMessage?.content || '📎 Príloha'}</p>
                    </div>
                    <span className="min-w-[18px] h-[18px] rounded-full bg-accent text-dark text-[10px] font-bold flex items-center justify-center px-1">{cnt}</span>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-6">
                <CheckSquare className="w-6 h-6 text-green-500/30 mx-auto mb-1.5" />
                <p className="text-xs text-green-400/60">Všetky správy prečítané</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Posledné konverzácie</h3>
            <span className="text-xs text-muted">{conversations.length} celkom</span>
          </div>
          <div className="p-2">
            {recentConvs.length > 0 ? (
              recentConvs.map((conv) => {
                const online = isOnlineCheck(conv.partner?.lastLoginAt)
                const cnt = unread.counts[conv.id] || 0
                const isMine = conv.lastMessage?.senderId === user?.id
                return (
                  <div key={conv.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors" onClick={onNavigate}>
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold ${cnt > 0 ? 'bg-accent/20 text-accent' : 'bg-white/[0.08] text-white/50'}`}>
                        {getInitials(conv.partner)}
                      </div>
                      {online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-[1.5px] border-card" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate ${cnt > 0 ? 'font-semibold text-white' : 'text-white/70'}`}>{getName(conv.partner)}</span>
                        <span className="text-[10px] text-muted ml-2 flex-shrink-0">{timeAgo(conv.lastMessage.createdAt)}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${cnt > 0 ? 'text-white/60' : 'text-white/30'}`}>
                        {isMine ? 'Vy: ' : ''}{conv.lastMessage?.content || '📎 Príloha'}
                      </p>
                    </div>
                    {cnt > 0 && (
                      <span className="min-w-[18px] h-[18px] rounded-full bg-accent text-dark text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0">{cnt}</span>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-6">
                <MessageCircle className="w-6 h-6 text-white/10 mx-auto mb-1.5" />
                <p className="text-xs text-white/25">Zatiaľ žiadne konverzácie</p>
                <button onClick={onNavigate} className="text-xs text-accent hover:text-accent-light mt-2 transition-colors">Začať chatovať</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
