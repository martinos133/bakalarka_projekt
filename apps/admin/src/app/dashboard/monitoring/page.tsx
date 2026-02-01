'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { MousePointerClick, UserCheck, Building, User, Radio, FolderTree, FileText } from 'lucide-react'
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Period = '1d' | '7d' | '30d' | '3m'
type BreakdownPeriod = '1m' | '5m' | '8h' | '1d' | '7d' | '30d' | '3m'

interface ClickStats {
  total: number
  period: string
  startDate: string
  endDate: string
  byGender: { male: number; female: number; other: number; unspecified: number }
  byAccountType: { company: number; individual: number; unspecified: number }
}

interface ClickBreakdown {
  period: string
  startDate: string
  endDate: string
  byTargetType: Record<string, number>
  topCategories: { categoryId: string; name: string; slug: string; count: number }[]
  topAdvertisements: { advertisementId: string; title: string; count: number }[]
}

const LIVE_REFRESH_SEC = 10
const LIVE_SLIDER_MIN = 1
const LIVE_SLIDER_MAX = 480 // 8 hodín

function formatMinutesLabel(minutes: number): string {
  if (minutes < 60) {
    if (minutes === 1) return '1 minútu'
    if (minutes >= 2 && minutes <= 4) return `${minutes} minúty`
    return `${minutes} minút`
  }
  const h = Math.floor(minutes / 60)
  if (h === 1) return '1 hodinu'
  if (h >= 2 && h <= 4) return `${h} hodiny`
  return `${h} hodín`
}

export default function MonitoringPage() {
  const router = useRouter()
  const [stats, setStats] = useState<ClickStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('30d')
  const [live1m, setLive1m] = useState<ClickStats | null>(null)
  const [liveCustomStats, setLiveCustomStats] = useState<ClickStats | null>(null)
  const [liveSliderMinutes, setLiveSliderMinutes] = useState(480) // 8 hodín
  const [liveCountdown, setLiveCountdown] = useState(LIVE_REFRESH_SEC)
  const [breakdown, setBreakdown] = useState<ClickBreakdown | null>(null)
  const [breakdownLoading, setBreakdownLoading] = useState(false)
  const [breakdownFilter, setBreakdownFilter] = useState<'all' | 'categories' | 'ads'>('all')
  const [breakdownPeriod, setBreakdownPeriod] = useState<BreakdownPeriod>('30d')
  const [filterGender, setFilterGender] = useState<string>('all')
  const [filterAccountType, setFilterAccountType] = useState<string>('all')

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getClickStats(period, undefined, filterGender, filterAccountType)
      setStats(data)
    } catch (error) {
      console.error('Chyba pri načítaní štatistík kliknutí:', error)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [period, filterGender, filterAccountType])

  const loadLiveStats = useCallback(async () => {
    try {
      const [data1m, dataCustom] = await Promise.all([
        api.getClickStats('1m', undefined, filterGender, filterAccountType),
        api.getClickStats('30d', liveSliderMinutes, filterGender, filterAccountType),
      ])
      setLive1m(data1m)
      setLiveCustomStats(dataCustom)
    } catch {
      setLive1m(null)
      setLiveCustomStats(null)
    }
  }, [liveSliderMinutes, filterGender, filterAccountType])

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    const clamped = Math.max(LIVE_SLIDER_MIN, Math.min(LIVE_SLIDER_MAX, val))
    setLiveSliderMinutes(clamped)
    setLiveCustomStats(null) // hneď zobraz „–“, kým sa nenačítajú nové dáta
  }, [])

  const loadBreakdown = useCallback(async () => {
    try {
      setBreakdownLoading(true)
      const data = await api.getClickBreakdown(breakdownPeriod)
      setBreakdown(data)
    } catch (err) {
      console.error('Chyba pri načítaní rozkladu:', err)
      setBreakdown(null)
    } finally {
      setBreakdownLoading(false)
    }
  }, [breakdownPeriod])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadStats()
  }, [router, period, loadStats])

  useEffect(() => {
    if (!isAuthenticated()) return
    loadBreakdown()
  }, [loadBreakdown])

  useEffect(() => {
    loadLiveStats()
    const interval = setInterval(loadLiveStats, LIVE_REFRESH_SEC * 1000)
    return () => clearInterval(interval)
  }, [loadLiveStats])

  useEffect(() => {
    const t = setInterval(() => {
      setLiveCountdown((c) => (c <= 1 ? LIVE_REFRESH_SEC : c - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const chartDataByGender = useMemo(() => {
    if (!stats) return []
    const { byGender } = stats
    return [
      { name: 'Muži', count: byGender.male, fill: '#3b82f6' },
      { name: 'Ženy', count: byGender.female, fill: '#ec4899' },
      { name: 'Iné', count: byGender.other, fill: '#8b5cf6' },
      { name: 'Nešpecifikované', count: byGender.unspecified, fill: '#6b7280' },
    ].filter((d) => d.count > 0)
  }, [stats])

  const chartDataByAccountType = useMemo(() => {
    if (!stats) return []
    const { byAccountType } = stats
    return [
      { name: 'Firmy', count: byAccountType.company, fill: '#f59e0b' },
      { name: 'Fyzické osoby', count: byAccountType.individual, fill: '#06b6d4' },
      { name: 'Nešpecifikované', count: byAccountType.unspecified, fill: '#6b7280' },
    ].filter((d) => d.count > 0)
  }, [stats])

  const periodLabel: Record<Period, string> = { '1d': 'Za deň', '7d': '7 dní', '30d': '30 dní', '3m': '3 mesiace' }
  const breakdownPeriodLabel: Record<BreakdownPeriod, string> = {
    '1m': '1 min',
    '5m': '5 min',
    '8h': '8 hodín',
    '1d': 'Za deň',
    '7d': '7 dní',
    '30d': '30 dní',
    '3m': '3 mesiace',
  }

  return (
    <div className="min-h-screen bg-dark text-gray-200 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-200">Monitoring kliknutí</h1>
              <p className="text-sm text-gray-400 mt-1">
                Kto kliká: ženy, muži, firmy, fyzické osoby. Dáta z platformy (prihlásení používatelia).
              </p>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex gap-2">
                {(['1d', '7d', '30d', '3m'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      period === p ? 'bg-primary text-gray-100' : 'bg-card border border-dark text-gray-300 hover:bg-cardHover'
                    }`}
                  >
                    {periodLabel[p]}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 items-center border-l border-dark pl-4">
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  Pohlavie:
                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="bg-card border border-dark rounded-lg px-2 py-1.5 text-gray-200 text-sm"
                  >
                    <option value="all">Všetci</option>
                    <option value="MALE">Muži</option>
                    <option value="FEMALE">Ženy</option>
                    <option value="OTHER">Iné</option>
                    <option value="unspecified">Nešpecifikované</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  Typ účtu:
                  <select
                    value={filterAccountType}
                    onChange={(e) => setFilterAccountType(e.target.value)}
                    className="bg-card border border-dark rounded-lg px-2 py-1.5 text-gray-200 text-sm"
                  >
                    <option value="all">Všetky</option>
                    <option value="company">Firmy</option>
                    <option value="individual">Fyzické osoby</option>
                    <option value="unspecified">Nešpecifikované</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Live monitoring */}
          <div className="mb-6 p-4 rounded-xl bg-card border border-dark border-l-4 border-l-green-500">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <Radio className="w-4 h-4 text-green-400" />
              <h2 className="text-sm font-semibold text-gray-200">Live – teraz</h2>
              <span className="text-xs text-gray-500 ml-auto">Obnoví sa za {liveCountdown} s</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-dark/50 rounded-lg p-4 border border-dark/80">
                <span className="text-xs text-gray-400">Za poslednú minútu</span>
                <div className="text-2xl font-bold text-gray-200 tabular-nums mt-1">
                  {live1m ? live1m.total : '–'}
                </div>
                <span className="text-xs text-gray-500">kliknutí</span>
              </div>
              <div className="bg-dark/50 rounded-lg p-4 border border-dark/80">
                <span className="text-xs text-gray-400">
                  Za posledných {formatMinutesLabel(liveSliderMinutes).toLowerCase()}
                </span>
                <div className="text-2xl font-bold text-gray-200 tabular-nums mt-1">
                  {liveCustomStats ? liveCustomStats.total : '–'}
                </div>
                <span className="text-xs text-gray-500">kliknutí</span>
              </div>
            </div>
            {/* Časový slider – 1 min až 8 hodín po minútach */}
            <div className="mt-4 pt-4 border-t border-dark/60">
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Časové obdobie (druhý blok): ťahaj sliderom (1 min – 8 hodín)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={LIVE_SLIDER_MIN}
                  max={LIVE_SLIDER_MAX}
                  step={1}
                  value={liveSliderMinutes}
                  onInput={handleSliderChange}
                  onChange={handleSliderChange}
                  className="flex-1 h-2 rounded-lg appearance-none bg-dark/80 accent-primary cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-200 min-w-[8rem] tabular-nums">
                  {formatMinutesLabel(liveSliderMinutes)}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-gray-500">
                1 min ← → 8 hodín ({liveSliderMinutes} min)
              </p>
            </div>
          </div>

          {loading ? (
            <div className="bg-card rounded-lg border border-dark p-12 text-center text-gray-400">
              Načítavam štatistiky...
            </div>
          ) : !stats ? (
            <div className="bg-card rounded-lg border border-dark p-12 text-center text-gray-400">
              Nepodarilo sa načítať štatistiky alebo ešte neexistujú žiadne záznamy kliknutí.
            </div>
          ) : (
            <>
              {/* KPI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-card rounded-lg p-6 border border-dark">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <MousePointerClick className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Celkom kliknutí</span>
                      <div className="text-2xl font-bold text-gray-200">{stats.total}</div>
                      <span className="text-xs text-gray-500">({periodLabel[period as Period]})</span>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-6 border border-dark">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/20">
                      <UserCheck className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Ženy</span>
                      <div className="text-2xl font-bold text-gray-200">{stats.byGender.female}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-6 border border-dark">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Muži</span>
                      <div className="text-2xl font-bold text-gray-200">{stats.byGender.male}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-6 border border-dark">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <Building className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Firmy / Fyz. osoby</span>
                      <div className="text-xl font-bold text-gray-200">
                        {stats.byAccountType.company} / {stats.byAccountType.individual}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grafy */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-card rounded-lg p-6 border border-dark">
                  <h3 className="text-lg font-semibold text-gray-200 mb-1">Kliknutia podľa pohlavia</h3>
                  <p className="text-xs text-gray-500 mb-4">Ženy, muži, iné, nešpecifikované.</p>
                  {chartDataByGender.length > 0 ? (
                    <>
                      <div className="flex items-center justify-center" style={{ minHeight: 220 }}>
                        <ResponsiveContainer width="100%" height={220}>
                          <RechartsPieChart>
                            <Pie
                              data={chartDataByGender}
                              dataKey="count"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={2}
                              stroke="transparent"
                            >
                              {chartDataByGender.map((entry, index) => (
                                <Cell key={index} fill={entry.fill} stroke="#1f2937" strokeWidth={2} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af' }}
                              labelStyle={{ color: '#9ca3af' }}
                              cursor={false}
                            />
                            <Legend
                              layout="vertical"
                              align="right"
                              verticalAlign="middle"
                              wrapperStyle={{ fontSize: '12px' }}
                              formatter={(value) => <span className="text-gray-300">{value}</span>}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <table className="w-full text-sm mt-4 border-t border-dark pt-3">
                        <tbody>
                          {[
                            { name: 'Ženy', count: stats.byGender.female },
                            { name: 'Muži', count: stats.byGender.male },
                            { name: 'Iné', count: stats.byGender.other },
                            { name: 'Nešpecifikované', count: stats.byGender.unspecified },
                          ].map((d) => (
                            <tr key={d.name} className="border-b border-dark/50 last:border-0">
                              <td className="py-2 px-0 text-gray-200">{d.name}</td>
                              <td className="py-2 px-0 text-right text-gray-200 font-semibold tabular-nums">{d.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 py-8">Žiadne dáta podľa pohlavia.</p>
                  )}
                </div>

                <div className="bg-card rounded-lg p-6 border border-dark">
                  <h3 className="text-lg font-semibold text-gray-200 mb-1">Kliknutia podľa typu účtu</h3>
                  <p className="text-xs text-gray-500 mb-4">Firmy vs. fyzické osoby.</p>
                  {chartDataByAccountType.length > 0 ? (
                    <>
                      <div className="flex items-center justify-center" style={{ minHeight: 220 }}>
                        <ResponsiveContainer width="100%" height={220}>
                          <RechartsPieChart>
                            <Pie
                              data={chartDataByAccountType}
                              dataKey="count"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={2}
                              stroke="transparent"
                            >
                              {chartDataByAccountType.map((entry, index) => (
                                <Cell key={index} fill={entry.fill} stroke="#1f2937" strokeWidth={2} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af' }}
                              labelStyle={{ color: '#9ca3af' }}
                              cursor={false}
                            />
                            <Legend
                              layout="vertical"
                              align="right"
                              verticalAlign="middle"
                              wrapperStyle={{ fontSize: '12px' }}
                              formatter={(value) => <span className="text-gray-300">{value}</span>}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <table className="w-full text-sm mt-4 border-t border-dark pt-3">
                        <tbody>
                          {[
                            { name: 'Firmy', count: stats.byAccountType.company },
                            { name: 'Fyzické osoby', count: stats.byAccountType.individual },
                            { name: 'Nešpecifikované', count: stats.byAccountType.unspecified },
                          ].map((d) => (
                            <tr key={d.name} className="border-b border-dark/50 last:border-0">
                              <td className="py-2 px-0 text-gray-200">{d.name}</td>
                              <td className="py-2 px-0 text-right text-gray-200 font-semibold tabular-nums">{d.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 py-8">Žiadne dáta podľa typu účtu.</p>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-lg p-4 border border-dark text-sm text-gray-400">
                <strong className="text-gray-300">Ako to funguje:</strong> Platforma pri kliknutí (inzerát, kategória, …) volá API a posiela pohlavie a typ účtu prihláseného používateľa. Nešpecifikované = anonymné kliknutia alebo používatelia bez vyplnených údajov.
                <br />
                <span className="text-gray-500 mt-2 block">Ak sa nič nepočíta: (1) Vytvor tabuľku v DB: v koreni projektu <code className="bg-dark px-1 rounded text-xs">cd packages/database && npx prisma db push</code> alebo <code className="bg-dark px-1 rounded text-xs">npx prisma migrate deploy</code>. (2) V prehliadači (F12 → Console) pri kliku na platforme uvidíš „[trackClick] Odosielam klik“ a „[trackClick] OK“ – ak „Zlyhalo“, API nebeží alebo platforma nemá správne <code className="bg-dark px-1 rounded">NEXT_PUBLIC_API_URL</code>. (3) V termináli API pri kliku uvidíš „[Analytics] Click recorded“.</span>
              </div>
            </>
          )}

          {/* Rozklad podľa kategórií a inzerátov – vždy zobrazený */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-200">Rozklad podľa kategórií a inzerátov</h2>
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-xs text-gray-500">Obdobie:</span>
                {(['1m', '5m', '8h', '1d', '7d', '30d', '3m'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setBreakdownPeriod(p)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      breakdownPeriod === p ? 'bg-primary text-gray-100' : 'bg-card border border-dark text-gray-300 hover:bg-cardHover'
                    }`}
                  >
                    {breakdownPeriodLabel[p]}
                  </button>
                ))}
                <span className="text-gray-600">|</span>
                {(['all', 'categories', 'ads'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setBreakdownFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      breakdownFilter === f
                        ? 'bg-primary text-gray-100'
                        : 'bg-card border border-dark text-gray-300 hover:bg-cardHover'
                    }`}
                  >
                    {f === 'all' ? 'Všetko' : f === 'categories' ? 'Kategórie' : 'Inzeráty'}
                  </button>
                ))}
              </div>
            </div>

            {breakdownLoading ? (
              <div className="bg-card rounded-lg border border-dark p-8 text-center text-gray-400">
                Načítavam rozklad...
              </div>
            ) : breakdown ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-card rounded-lg p-4 border border-dark flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <FolderTree className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Kliknutia na kategórie</span>
                      <div className="text-2xl font-bold text-gray-200 tabular-nums">
                        {breakdown.byTargetType?.CATEGORY ?? 0}
                      </div>
                    </div>
                  </div>
                  <div className="bg-card rounded-lg p-4 border border-dark flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-sky-500/20">
                      <FileText className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Kliknutia na inzeráty</span>
                      <div className="text-2xl font-bold text-gray-200 tabular-nums">
                        {breakdown.byTargetType?.AD ?? 0}
                      </div>
                    </div>
                  </div>
                </div>

                {(breakdownFilter === 'all' || breakdownFilter === 'categories') && (
                  <div className="bg-card rounded-lg border border-dark overflow-hidden">
                    <h3 className="text-sm font-semibold text-gray-200 p-4 border-b border-dark">
                      Podľa kategórie ({breakdownPeriodLabel[breakdownPeriod]})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-dark/50 text-left text-gray-400">
                            <th className="py-3 px-4 font-medium">Kategória</th>
                            <th className="py-3 px-4 font-medium text-right">Kliknutia</th>
                            <th className="py-3 px-4 font-medium text-right">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!breakdown.topCategories?.length ? (
                            <tr>
                              <td colSpan={3} className="py-6 px-4 text-center text-gray-500">
                                Žiadne kliknutia na kategórie v tomto období.
                              </td>
                            </tr>
                          ) : (
                            (() => {
                              const totalCat = breakdown.topCategories.reduce((s, r) => s + r.count, 0)
                              return breakdown.topCategories.map((row) => (
                                <tr key={row.categoryId} className="border-b border-dark/50 last:border-0 hover:bg-dark/30">
                                  <td className="py-2.5 px-4 text-gray-200">
                                    <span className="font-medium">{row.name}</span>
                                    <span className="text-gray-500 ml-2 text-xs">/{row.slug}</span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right text-gray-200 font-semibold tabular-nums">{row.count}</td>
                                  <td className="py-2.5 px-4 text-right text-gray-400 tabular-nums">
                                    {totalCat > 0 ? ((100 * row.count) / totalCat).toFixed(1) : 0}%
                                  </td>
                                </tr>
                              ))
                            })()
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(breakdownFilter === 'all' || breakdownFilter === 'ads') && (
                  <div className="bg-card rounded-lg border border-dark overflow-hidden">
                    <h3 className="text-sm font-semibold text-gray-200 p-4 border-b border-dark">
                      Podľa inzerátu ({breakdownPeriodLabel[breakdownPeriod]})
                    </h3>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-card z-10">
                          <tr className="bg-dark/50 text-left text-gray-400">
                            <th className="py-3 px-4 font-medium">Inzerát</th>
                            <th className="py-3 px-4 font-medium text-right">Kliknutia</th>
                            <th className="py-3 px-4 font-medium text-right">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!breakdown.topAdvertisements?.length ? (
                            <tr>
                              <td colSpan={3} className="py-6 px-4 text-center text-gray-500">
                                Žiadne kliknutia na inzeráty v tomto období.
                              </td>
                            </tr>
                          ) : (
                            (() => {
                              const totalAd = breakdown.topAdvertisements.reduce((s, r) => s + r.count, 0)
                              return breakdown.topAdvertisements.map((row) => (
                                <tr key={row.advertisementId} className="border-b border-dark/50 last:border-0 hover:bg-dark/30">
                                  <td className="py-2.5 px-4 text-gray-200">
                                    <span className="line-clamp-2" title={row.title}>{row.title}</span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right text-gray-200 font-semibold tabular-nums">{row.count}</td>
                                  <td className="py-2.5 px-4 text-right text-gray-400 tabular-nums">
                                    {totalAd > 0 ? ((100 * row.count) / totalAd).toFixed(1) : 0}%
                                  </td>
                                </tr>
                              ))
                            })()
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-dark p-6 text-center text-gray-500 text-sm">
                Nepodarilo sa načítať rozklad alebo ešte nie sú dáta.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
