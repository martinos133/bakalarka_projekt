'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { MousePointerClick, UserCheck, Building, User, Radio } from 'lucide-react'
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Period = '1d' | '7d' | '30d' | '3m'

interface ClickStats {
  total: number
  period: string
  startDate: string
  endDate: string
  byGender: { male: number; female: number; other: number; unspecified: number }
  byAccountType: { company: number; individual: number; unspecified: number }
}

const LIVE_REFRESH_SEC = 10

export default function MonitoringPage() {
  const router = useRouter()
  const [stats, setStats] = useState<ClickStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('30d')
  const [live1m, setLive1m] = useState<ClickStats | null>(null)
  const [live5m, setLive5m] = useState<ClickStats | null>(null)
  const [liveCountdown, setLiveCountdown] = useState(LIVE_REFRESH_SEC)

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getClickStats(period)
      setStats(data)
    } catch (error) {
      console.error('Chyba pri načítaní štatistík kliknutí:', error)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [period])

  const loadLiveStats = useCallback(async () => {
    try {
      const [data1m, data5m] = await Promise.all([
        api.getClickStats('1m'),
        api.getClickStats('5m'),
      ])
      setLive1m(data1m)
      setLive5m(data5m)
    } catch {
      setLive1m(null)
      setLive5m(null)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadStats()
  }, [router, period, loadStats])

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
                <span className="text-xs text-gray-400">Za posledných 5 minút</span>
                <div className="text-2xl font-bold text-gray-200 tabular-nums mt-1">
                  {live5m ? live5m.total : '–'}
                </div>
                <span className="text-xs text-gray-500">kliknutí</span>
              </div>
            </div>
            {/* Nápoveda, ak sú Live vždy 0 – chýba tabuľka v DB */}
            {live1m && live5m && live1m.total === 0 && live5m.total === 0 && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
                <strong>Live kliknutia sú 0?</strong> Aby sa kliky z platformy ukladali a zobrazovali tu, musí v databáze existovať tabuľka <code className="bg-dark/60 px-1 rounded">ClickEvent</code>. V termináli (v koreni projektu, s nastavenou <code className="bg-dark/60 px-1 rounded">DATABASE_URL</code>) spusti: <code className="block mt-2 bg-dark/80 p-2 rounded text-xs overflow-x-auto">cd packages/database && npx prisma migrate deploy</code> Potom reštartuj API a klikni na platforme na kategórie/inzeráty – čísla sa naplnia.
              </div>
            )}
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
        </main>
      </div>
    </div>
  )
}
