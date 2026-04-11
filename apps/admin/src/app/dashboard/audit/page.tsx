'use client'

import { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import api from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Shield, LogIn, LogOut, AlertTriangle, XCircle, Search,
  ChevronLeft, ChevronRight, Eye, UserCheck,
  Activity, Server, FileWarning, CheckCircle2, Ban,
  RefreshCw, Filter, X, ChevronDown, Check,
} from 'lucide-react'

type Tab = 'all' | 'logins' | 'errors' | 'actions'

interface AuditLog {
  id: string
  action: string
  severity: string
  userId: string | null
  userEmail: string | null
  ip: string | null
  userAgent: string | null
  resource: string | null
  resourceId: string | null
  details: any
  success: boolean
  errorMessage: string | null
  createdAt: string
}

interface Stats {
  today: { total: number; logins: number; failedLogins: number; errors: number }
  week: { total: number; errors: number }
  recentErrors: AuditLog[]
  loginsByDay: { date: string; success: number; failed: number }[]
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: 'Úspešné prihlásenie',
  LOGIN_FAILED: 'Neúspešné prihlásenie',
  LOGOUT: 'Odhlásenie',
  REGISTER: 'Registrácia',
  PASSWORD_CHANGE: 'Zmena hesla',
  AD_CREATE: 'Vytvorenie inzerátu',
  AD_UPDATE: 'Úprava inzerátu',
  AD_DELETE: 'Vymazanie inzerátu',
  AD_APPROVE: 'Schválenie inzerátu',
  AD_REJECT: 'Zamietnutie inzerátu',
  USER_BAN: 'Zablok. používateľa',
  USER_UNBAN: 'Odblok. používateľa',
  USER_DELETE: 'Vymaz. používateľa',
  REPORT_RESOLVE: 'Vyriešenie nahlás.',
  REPORT_DISMISS: 'Zamietnutie nahlás.',
  STAFF_CREATE: 'Vytvorenie člena',
  STAFF_UPDATE: 'Úprava člena',
  STAFF_DELETE: 'Vymazanie člena',
  SETTINGS_UPDATE: 'Zmena nastavení',
  CATEGORY_CREATE: 'Vytvorenie kategórie',
  CATEGORY_UPDATE: 'Úprava kategórie',
  CATEGORY_DELETE: 'Vymazanie kategórie',
  SYSTEM_ERROR: 'Systémová chyba',
  API_ERROR: 'API chyba',
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  INFO: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  WARNING: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  ERROR: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  CRITICAL: { bg: 'bg-red-600/15', text: 'text-red-300', dot: 'bg-red-500' },
}

function getActionIcon(action: string, size = 'w-3.5 h-3.5') {
  const cls = `${size} flex-shrink-0`
  if (action === 'LOGIN_SUCCESS') return <LogIn className={`${cls} text-green-400`} />
  if (action === 'LOGIN_FAILED') return <XCircle className={`${cls} text-red-400`} />
  if (action === 'LOGOUT') return <LogOut className={`${cls} text-gray-400`} />
  if (action.includes('BAN')) return <Ban className={`${cls} text-orange-400`} />
  if (action.includes('ERROR')) return <AlertTriangle className={`${cls} text-red-400`} />
  if (action.includes('DELETE')) return <XCircle className={`${cls} text-red-400`} />
  if (action.includes('CREATE')) return <CheckCircle2 className={`${cls} text-green-400`} />
  if (action.includes('APPROVE')) return <CheckCircle2 className={`${cls} text-green-400`} />
  if (action.includes('REJECT')) return <XCircle className={`${cls} text-amber-400`} />
  return <Activity className={`${cls} text-gray-400`} />
}

function fmtFull(d: string) {
  return new Date(d).toLocaleString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function fmtShort(d: string) {
  const dt = new Date(d)
  const now = new Date()
  const isToday = dt.toDateString() === now.toDateString()
  if (isToday) return dt.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return dt.toLocaleString('sk-SK', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function parseUA(ua: string | null): string {
  if (!ua) return '–'
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)[\s/](\d+)/i)
  const os = ua.match(/(Mac OS X|Windows|Linux|Android|iPhone)/i)
  const parts: string[] = []
  if (browser) parts.push(`${browser[1]} ${browser[2]}`)
  if (os) parts.push(os[1])
  return parts.length > 0 ? parts.join(' · ') : ua.substring(0, 40)
}

const LOGIN_ACTIONS = ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'REGISTER']

export default function AuditPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('all')
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [successFilter, setSuccessFilter] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { if (!isAuthenticated()) router.push('/login') }, [router])

  const loadData = useCallback(async () => {
    try {
      const params: Record<string, string> = { page: String(page), limit: '40' }

      if (tab === 'logins' && !actionFilter) {
        params.action = LOGIN_ACTIONS.join(',')
      } else if (tab === 'errors') {
        params.action = 'SYSTEM_ERROR,API_ERROR'
      } else if (tab === 'actions' && !actionFilter) {
        const exclude = [...LOGIN_ACTIONS, 'SYSTEM_ERROR', 'API_ERROR']
        const actionKeys = Object.keys(ACTION_LABELS).filter(k => !exclude.includes(k))
        params.action = actionKeys.join(',')
      }

      if (search) params.search = search
      if (actionFilter) params.action = actionFilter
      if (severityFilter) params.severity = severityFilter
      if (successFilter) params.success = successFilter
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo

      const [logsRes, statsRes] = await Promise.all([
        api.getAuditLogs(params),
        page === 1 ? api.getAuditStats().catch(() => null) : Promise.resolve(null),
      ])

      setLogs(logsRes.data || [])
      setTotal(logsRes.total || 0)
      setTotalPages(logsRes.totalPages || 1)
      if (statsRes) setStats(statsRes)
    } catch (err) {
      console.error('Audit load error:', err)
    } finally {
      setLoading(false)
    }
  }, [page, tab, search, actionFilter, severityFilter, successFilter, dateFrom, dateTo])

  useEffect(() => { setLoading(true); loadData() }, [loadData])
  useEffect(() => { const t = setInterval(loadData, 15000); return () => clearInterval(t) }, [loadData])

  const handleRefresh = async () => { setRefreshing(true); await loadData(); setTimeout(() => setRefreshing(false), 500) }
  const resetFilters = () => { setSearch(''); setActionFilter(''); setSeverityFilter(''); setSuccessFilter(''); setDateFrom(''); setDateTo(''); setPage(1) }
  const hasFilters = search || actionFilter || severityFilter || successFilter || dateFrom || dateTo

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Všetky', icon: <Activity className="w-3.5 h-3.5" /> },
    { key: 'logins', label: 'Prihlásenia', icon: <LogIn className="w-3.5 h-3.5" /> },
    { key: 'errors', label: 'Chyby', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { key: 'actions', label: 'Akcie', icon: <Shield className="w-3.5 h-3.5" /> },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-3 overflow-hidden">

        {/* ═══ Stats ═══ */}
        {stats && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard icon={<Activity className="w-4 h-4 text-blue-400" />} bg="bg-blue-500/10" label="Dnes celkom" value={stats.today.total} sub={`7 dní: ${stats.week.total}`} />
            <StatCard icon={<UserCheck className="w-4 h-4 text-green-400" />} bg="bg-green-500/10" label="Prihlásenia" value={stats.today.logins} sub={<>Neúspešných: <span className="text-red-400">{stats.today.failedLogins}</span></>} />
            <StatCard icon={<AlertTriangle className="w-4 h-4 text-red-400" />} bg="bg-red-500/10" label="Chyby dnes" value={stats.today.errors} sub={<>7 dní: <span className="text-red-400">{stats.week.errors}</span></>} />
            <StatCard
              icon={<Server className="w-4 h-4 text-amber-400" />} bg="bg-amber-500/10" label="Systém"
              value={stats.today.errors === 0 ? <span className="text-green-400">OK</span> : stats.today.errors <= 5 ? <span className="text-amber-400">Varovanie</span> : <span className="text-red-400">Kritický</span>}
              sub={stats.today.errors === 0 ? 'Žiadne chyby' : `${stats.today.errors} chýb`}
            />
          </div>
        )}

        {/* ═══ Login chart ═══ */}
        {stats && stats.loginsByDay.length > 0 && (
          <div className="bg-card rounded-2xl border border-white/[0.06] p-4 overflow-hidden">
            <h3 className="text-xs font-semibold text-white mb-3">Prihlásenia – 7 dní</h3>
            <div className="flex items-end gap-1 h-20">
              {stats.loginsByDay.map((day, i) => {
                const max = Math.max(...stats.loginsByDay.map(d => d.success + d.failed), 1)
                const t = day.success + day.failed
                const hPct = (t / max) * 100
                const fPct = t > 0 ? (day.failed / t) * 100 : 0
                const label = new Date(day.date).toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric' })
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${day.success} úspešných, ${day.failed} neúspešných`}>
                    <div className="w-full flex flex-col justify-end h-14">
                      <div className="w-full rounded-t relative overflow-hidden" style={{ height: `${Math.max(hPct, 6)}%` }}>
                        <div className="absolute inset-0 bg-green-500/30 rounded-t" />
                        {fPct > 0 && <div className="absolute bottom-0 inset-x-0 bg-red-500/40" style={{ height: `${fPct}%` }} />}
                      </div>
                    </div>
                    <span className="text-[8px] text-gray-500 leading-none">{label}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 mt-2">
              <span className="flex items-center gap-1 text-[9px] text-gray-500"><span className="w-2 h-2 rounded-sm bg-green-500/40" />Úspešné</span>
              <span className="flex items-center gap-1 text-[9px] text-gray-500"><span className="w-2 h-2 rounded-sm bg-red-500/40" />Neúspešné</span>
            </div>
          </div>
        )}

        {/* ═══ Recent errors ═══ */}
        {stats && stats.recentErrors.length > 0 && (
          <div className="bg-red-500/[0.04] border border-red-500/10 rounded-2xl p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <FileWarning className="w-4 h-4 text-red-400 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-red-400">Posledné chyby</h3>
              <span className="text-xs text-red-400/50 ml-auto">Klikni pre detail</span>
            </div>
            <div className="space-y-1">
              {stats.recentErrors.slice(0, 3).map((err) => (
                <button
                  key={err.id}
                  onClick={() => setSelectedLog(err)}
                  className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-xl hover:bg-red-500/[0.06] transition-colors group overflow-hidden"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" />
                  <span className="text-xs text-gray-400 flex-1 group-hover:text-gray-200 overflow-hidden text-ellipsis whitespace-nowrap">{(err.errorMessage || err.action).substring(0, 80)}…</span>
                  <span className="text-xs text-gray-600 flex-shrink-0 whitespace-nowrap ml-2">{fmtShort(err.createdAt)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Main table panel ═══ */}
        <div className="bg-card rounded-2xl border border-white/[0.06] overflow-hidden">

          {/* Tab bar */}
          <div className="flex items-center justify-between px-4 pt-3 pb-0 border-b border-white/[0.06]">
            <div className="flex gap-1 overflow-x-auto no-scrollbar -mb-px">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setPage(1) }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors
                    ${tab === t.key ? 'bg-white/[0.06] text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 pb-2 flex-shrink-0">
              <button onClick={handleRefresh} className={`p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all ${refreshing ? 'animate-spin' : ''}`} title="Obnoviť">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${showFilters || hasFilters ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'}`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filtre
                {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="px-4 py-3 bg-white/[0.015] border-b border-white/[0.06]">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[180px] sm:max-w-[260px]">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Hľadať</label>
                  <div className="relative">
                    <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Email, IP, chyba..."
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg py-2 pr-3 text-sm text-white focus:outline-none focus:border-accent/40" style={{ paddingLeft: '2.25rem' }} />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Akcia</label>
                  <DarkSelect value={actionFilter} onChange={(v) => { setActionFilter(v); setPage(1) }} options={Object.entries(ACTION_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Závažnosť</label>
                  <DarkSelect value={severityFilter} onChange={(v) => { setSeverityFilter(v); setPage(1) }} options={[{ value: 'INFO', label: 'Info' }, { value: 'WARNING', label: 'Varovanie' }, { value: 'ERROR', label: 'Chyba' }, { value: 'CRITICAL', label: 'Kritická' }]} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Stav</label>
                  <DarkSelect value={successFilter} onChange={(v) => { setSuccessFilter(v); setPage(1) }} options={[{ value: 'true', label: 'Úspešné' }, { value: 'false', label: 'Neúspešné' }]} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Od</label>
                  <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/40" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Do</label>
                  <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/40" />
                </div>
                {hasFilters && (
                  <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                    <X className="w-3.5 h-3.5" />Zrušiť
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ─── Log rows ─── */}

          {/* Inline filtre pre Prihlásenia */}
          {tab === 'logins' && (
            <div className="px-4 py-3 bg-white/[0.015] border-b border-white/[0.06]">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[160px] sm:max-w-[240px]">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Hľadať</label>
                  <div className="relative">
                    <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Email, IP..."
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg py-2 pr-3 text-sm text-white focus:outline-none focus:border-accent/40" style={{ paddingLeft: '2.25rem' }} />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Stav</label>
                  <DarkSelect value={successFilter} onChange={(v) => { setSuccessFilter(v); setPage(1) }} options={[{ value: 'true', label: 'Úspešné' }, { value: 'false', label: 'Neúspešné' }]} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Od</label>
                  <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/40" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Do</label>
                  <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/40" />
                </div>
                {hasFilters && (
                  <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                    <X className="w-3.5 h-3.5" />Zrušiť
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Inline filtre pre Akcie */}
          {tab === 'actions' && (
            <div className="px-4 py-3 bg-white/[0.015] border-b border-white/[0.06]">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[160px] sm:max-w-[240px]">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Hľadať</label>
                  <div className="relative">
                    <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Email, resource..."
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg py-2 pr-3 text-sm text-white focus:outline-none focus:border-accent/40" style={{ paddingLeft: '2.25rem' }} />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Akcia</label>
                  <DarkSelect value={actionFilter} onChange={(v) => { setActionFilter(v); setPage(1) }} options={Object.entries(ACTION_LABELS).filter(([k]) => !LOGIN_ACTIONS.includes(k) && k !== 'SYSTEM_ERROR' && k !== 'API_ERROR').map(([k, v]) => ({ value: k, label: v }))} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Od</label>
                  <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/40" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Do</label>
                  <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/40" />
                </div>
                {hasFilters && (
                  <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                    <X className="w-3.5 h-3.5" />Zrušiť
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Inline filtre pre Chyby */}
          {tab === 'errors' && (
            <div className="px-4 py-3 bg-white/[0.015] border-b border-white/[0.06]">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[160px] sm:max-w-[240px]">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Hľadať</label>
                  <div className="relative">
                    <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Chybová správa, URL..."
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg py-2 pr-3 text-sm text-white focus:outline-none focus:border-accent/40" style={{ paddingLeft: '2.25rem' }} />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Závažnosť</label>
                  <DarkSelect value={severityFilter} onChange={(v) => { setSeverityFilter(v); setPage(1) }} options={[{ value: 'ERROR', label: 'Chyba' }, { value: 'CRITICAL', label: 'Kritická' }, { value: 'WARNING', label: 'Varovanie' }]} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Typ</label>
                  <DarkSelect value={actionFilter} onChange={(v) => { setActionFilter(v); setPage(1) }} options={[{ value: 'API_ERROR', label: 'API chyba' }, { value: 'SYSTEM_ERROR', label: 'Systémová chyba' }]} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Od</label>
                  <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/40" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Do</label>
                  <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/40" />
                </div>
                {hasFilters && (
                  <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                    <X className="w-3.5 h-3.5" />Zrušiť
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-gray-500 text-sm">Načítavam...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">Žiadne záznamy</div>
          ) : tab === 'logins' ? (
            /* ── Prihlásenia: tabuľkový layout ── */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider font-medium pl-4 pr-2 py-3">Dátum</th>
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-3">E-mail</th>
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-3">Úspech</th>
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-3">Dôvod zlyhania</th>
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-3">IP</th>
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 pr-4 py-3">User-Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="pl-4 pr-2 py-3">
                        <span className="text-sm text-gray-300 whitespace-nowrap">{fmtFull(log.createdAt)}</span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="text-sm text-white">{log.userEmail || '–'}</span>
                      </td>
                      <td className="px-2 py-3">
                        {log.success ? (
                          <span className="text-sm text-green-400">Áno</span>
                        ) : (
                          <span className="text-sm text-red-400">Nie</span>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <span className="text-sm text-gray-500">{log.errorMessage || '—'}</span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="text-sm text-gray-400 font-mono">{log.ip || '–'}</span>
                      </td>
                      <td className="px-2 pr-4 py-3">
                        <span className="text-sm text-gray-500 block truncate max-w-[280px]">{parseUA(log.userAgent)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── Ostatné záložky: kartový layout ── */
            <div className="divide-y divide-white/[0.04]">
              {logs.map((log) => {
                const sev = SEVERITY_STYLES[log.severity] || SEVERITY_STYLES.INFO
                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="w-full text-left px-4 py-3 hover:bg-white/[0.025] transition-colors group flex items-center gap-3 overflow-hidden"
                  >
                    <div className="flex-shrink-0">
                      {getActionIcon(log.action, 'w-4 h-4')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-medium truncate">
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                        {!log.success && (
                          <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-semibold leading-none flex-shrink-0">FAIL</span>
                        )}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none flex-shrink-0 ${sev.bg} ${sev.text}`}>
                          {log.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {log.userEmail || '–'}
                        {log.ip && <span className="text-gray-600"> · {log.ip}</span>}
                        {log.errorMessage && <span className="text-red-400/60"> — {log.errorMessage.substring(0, 60)}</span>}
                      </p>
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap flex-shrink-0">{fmtShort(log.createdAt)}</span>
                    <Eye className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
              <p className="text-xs text-gray-500">
                Strana {page} z {totalPages} · {total} záznamov
              </p>
              <div className="flex items-center gap-0.5">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-1.5 rounded-lg text-gray-500 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p: number
                  if (totalPages <= 5) p = i + 1
                  else if (page <= 3) p = i + 1
                  else if (page >= totalPages - 2) p = totalPages - 4 + i
                  else p = page - 2 + i
                  return (
                    <button key={p} onClick={() => setPage(p)} className={`min-w-[30px] h-7 rounded-lg text-xs font-medium ${p === page ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-white hover:bg-white/[0.06]'}`}>{p}</button>
                  )
                })}
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg text-gray-500 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Detail modal ═══ */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setSelectedLog(null)}>
          <div className="bg-dark-100 border-t sm:border border-white/[0.08] sm:rounded-2xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-2 sm:hidden"><span className="w-10 h-1 rounded-full bg-white/20" /></div>

            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 min-w-0">
                {getActionIcon(selectedLog.action, 'w-4 h-4')}
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-white truncate">{ACTION_LABELS[selectedLog.action] || selectedLog.action}</h2>
                  <p className="text-[10px] text-gray-500">{fmtFull(selectedLog.createdAt)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <DField label="Akcia" value={ACTION_LABELS[selectedLog.action] || selectedLog.action} />
                <DField label="Závažnosť" value={selectedLog.severity} />
                <DField label="Úspech" value={selectedLog.success ? 'Áno' : 'Nie'} />
                <DField label="Používateľ" value={selectedLog.userEmail || '–'} />
                <DField label="IP adresa" value={selectedLog.ip || '–'} mono />
                <DField label="User ID" value={selectedLog.userId || '–'} mono />
                <DField label="Resource" value={selectedLog.resource || '–'} />
                <DField label="Resource ID" value={selectedLog.resourceId || '–'} mono />
              </div>

              {selectedLog.userAgent && (
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">User-Agent</p>
                  <p className="text-[11px] text-gray-300 bg-white/[0.03] rounded-lg p-2.5 break-all font-mono leading-relaxed">{selectedLog.userAgent}</p>
                </div>
              )}

              {selectedLog.errorMessage && (
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Chybová správa</p>
                  <p className="text-[11px] text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 break-all font-mono leading-relaxed">{selectedLog.errorMessage}</p>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Detaily</p>
                  <pre className="text-[11px] text-gray-300 bg-white/[0.03] rounded-lg p-2.5 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{JSON.stringify(selectedLog.details, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function StatCard({ icon, bg, label, value, sub }: { icon: React.ReactNode; bg: string; label: string; value: React.ReactNode; sub: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl p-4 border border-white/[0.06]">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>{icon}</div>
        <p className="text-xs text-gray-400 uppercase tracking-wider leading-tight">{label}</p>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  )
}

function DField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm text-white truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  )
}

const DARK_SELECT_SURFACE = '#2D2421'

function DarkSelect({ value, onChange, options, placeholder = 'Všetky' }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)

  const measurePanel = useCallback(() => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPanelPos({
      top: r.bottom + 6,
      left: r.left,
      width: Math.max(r.width, 120),
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setPanelPos(null)
      return
    }
    measurePanel()
    window.addEventListener('scroll', measurePanel, true)
    window.addEventListener('resize', measurePanel)
    return () => {
      window.removeEventListener('scroll', measurePanel, true)
      window.removeEventListener('resize', measurePanel)
    }
  }, [open, measurePanel])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || portalRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  const panel =
    open &&
    panelPos &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={portalRef}
        className="z-[200] overflow-hidden rounded-lg border border-accent/25 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(201,169,110,0.12)] ring-1 ring-[#0a0a0a]"
        style={{
          position: 'fixed',
          top: panelPos.top,
          left: panelPos.left,
          minWidth: panelPos.width,
          width: 'max-content',
          backgroundColor: DARK_SELECT_SURFACE,
          animation: 'slideDown 0.12s ease-out',
        }}
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-[#2D2421] via-accent to-[#2D2421]" aria-hidden />
        <div className="max-h-60 overflow-y-auto py-1" style={{ backgroundColor: DARK_SELECT_SURFACE }}>
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-2 border-l-2 transition-colors ${
              value === '' ? 'border-accent bg-popupRowActive text-accent font-medium' : 'border-transparent text-gray-300 hover:border-accent/25 hover:bg-popupRowHover hover:text-white'
            }`}
          >
            <span className="truncate">{placeholder}</span>
            {value === '' && <Check className="w-4 h-4 flex-shrink-0 text-accent" strokeWidth={2.5} />}
          </button>
          {options.filter(o => o.value !== '').map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-2 border-l-2 transition-colors ${
                value === o.value ? 'border-accent bg-popupRowActive text-accent font-medium' : 'border-transparent text-gray-300 hover:border-accent/25 hover:bg-popupRowHover hover:text-white'
              }`}
            >
              <span className="truncate">{o.label}</span>
              {value === o.value && <Check className="w-4 h-4 flex-shrink-0 text-accent" strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      </div>,
      document.body,
    )

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 bg-popup border rounded-lg px-3 py-2 text-sm text-white hover:bg-popupHover focus:outline-none focus:border-accent/40 transition-all min-w-[120px] ${
          open ? 'border-accent/55 shadow-[0_0_0_3px_rgba(201,169,110,0.14)]' : 'border-white/10 hover:border-white/[0.14]'
        } ${selected && !open ? 'ring-1 ring-accent/15' : ''}`}
      >
        <span className={`flex-1 text-left truncate ${selected ? 'text-white' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${open ? 'rotate-180 text-accent' : 'text-gray-400'}`} />
      </button>
      {panel}
    </div>
  )
}
