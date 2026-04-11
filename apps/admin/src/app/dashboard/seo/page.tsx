'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  RefreshCw,
  Target,
  Hash,
  Lightbulb,
  ChevronRight,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { isAuthenticated } from '@/lib/auth'
import api from '@/lib/api'

type SeoStrength = 'silné' | 'stredné' | 'slabé'

interface SeoPlatformRow {
  id: string
  label: string
  score: number
  strength: SeoStrength
  summary: string
  metrics: { label: string; value: string; ok?: boolean }[]
}

interface SeoKeywordRow {
  term: string
  count: number
  source: string
}

interface SeoInsight {
  id: string
  priority: 'high' | 'medium' | 'low'
  title: string
  detail: string
  actionLabel?: string
  actionPath?: string
}

interface SeoOverview {
  generatedAt: string
  overallScore: number
  overallStrength: SeoStrength
  platforms: SeoPlatformRow[]
  topKeywords: SeoKeywordRow[]
  insights: SeoInsight[]
  counts: {
    activeCategories: number
    publishedStaticPages: number
    publishedBlogPosts: number
    activeAdvertisements: number
  }
}

function strengthStyles(s: SeoStrength) {
  if (s === 'silné') return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', bar: 'bg-emerald-500/80' }
  if (s === 'stredné') return { text: 'text-amber-400', bg: 'bg-amber-500/15', bar: 'bg-amber-500/80' }
  return { text: 'text-red-400', bg: 'bg-red-500/12', bar: 'bg-red-500/70' }
}

function priorityIcon(p: SeoInsight['priority']) {
  if (p === 'high') return <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
  if (p === 'medium') return <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
  return <CheckCircle2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
}

export default function SeoPage() {
  const router = useRouter()
  const [data, setData] = useState<SeoOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login')
  }, [router])

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await api.getSeoOverview()
      setData(res as SeoOverview)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa načítať SEO dáta')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    setLoading(true)
    await load()
    setTimeout(() => setRefreshing(false), 400)
  }

  const overall = data ? strengthStyles(data.overallStrength) : strengthStyles('stredné')

  return (
    <DashboardLayout>
      <div className="space-y-3 overflow-hidden">
        {/* Hlavička sekcie – rovnaký jazyk ako Audit: tmavý panel + zlatý akcent */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-[#1c1917]/90 px-4 py-2 shadow-sm shadow-black/20">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15">
              <TrendingUp className="h-4 w-4 text-accent" strokeWidth={2} />
            </span>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-accent">SEO prehľad</h1>
              <p className="text-[11px] text-gray-500">Silné stránky platformy, kľúčové slová a čo zlepšiť</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className={`inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/[0.08] hover:text-white ${refreshing ? 'opacity-70' : ''}`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Obnoviť dáta
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">{error}</div>
        )}

        {loading && !data ? (
          <div className="rounded-2xl border border-white/[0.06] bg-card py-20 text-center text-sm text-gray-500">Načítavam SEO prehľad…</div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="rounded-xl border border-white/[0.06] bg-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${overall.bg}`}>
                    <Target className={`h-4 w-4 ${overall.text}`} />
                  </div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Celkové SEO</p>
                </div>
                <p className={`text-3xl font-bold tabular-nums ${overall.text}`}>{data.overallScore}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Sila: <span className={overall.text}>{data.overallStrength}</span>
                  <span className="text-gray-600"> · váha kategórie / stránky / blog / inzeráty</span>
                </p>
              </div>
              <MiniStat label="Kategórie" value={data.counts.activeCategories} />
              <MiniStat label="Publ. stránky" value={data.counts.publishedStaticPages} />
              <MiniStat label="Blog + inzeráty" value={`${data.counts.publishedBlogPosts} / ${data.counts.activeAdvertisements}`} />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {data.platforms.map((p) => {
                const st = strengthStyles(p.strength)
                return (
                  <div key={p.id} className="rounded-2xl border border-white/[0.06] bg-card p-4 overflow-hidden">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold text-white">{p.label}</h2>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">{p.summary}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-2xl font-bold tabular-nums ${st.text}`}>{p.score}</span>
                        <p className={`text-[10px] font-medium uppercase tracking-wide ${st.text}`}>{p.strength}</p>
                      </div>
                    </div>
                    <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div className={`h-full rounded-full transition-all ${st.bar}`} style={{ width: `${p.score}%` }} />
                    </div>
                    <ul className="space-y-2">
                      {p.metrics.map((m) => (
                        <li key={m.label} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-gray-500">{m.label}</span>
                          <span className={`font-medium tabular-nums ${m.ok === false ? 'text-amber-400/90' : 'text-gray-200'}`}>{m.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            <div className="grid gap-3 lg:grid-cols-5">
              <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-card p-4 overflow-hidden">
                <div className="mb-3 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-accent" />
                  <h2 className="text-sm font-semibold text-white">Najčastejšie kľúčové výrazy</h2>
                </div>
                <p className="mb-3 text-[11px] text-gray-500">Agregované z kategórií, meta polí a titulkov článkov (normalizované).</p>
                {data.topKeywords.length === 0 ? (
                  <p className="text-sm text-gray-500">Zatiaľ žiadne dáta – doplň meta keywords u kategórií alebo obsah blogu.</p>
                ) : (
                  <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
                    {data.topKeywords.map((k, i) => (
                      <div
                        key={`${k.term}-${i}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-accent/95">{k.term}</p>
                          <p className="truncate text-[10px] text-gray-600">{k.source}</p>
                        </div>
                        <span className="flex-shrink-0 rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">{k.count}×</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-3 rounded-2xl border border-white/[0.06] bg-card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                  <Lightbulb className="h-4 w-4 text-amber-400/90" />
                  <h2 className="text-sm font-semibold text-white">Čo zlepšiť</h2>
                  <span className="ml-auto text-[10px] text-gray-600">
                    {new Date(data.generatedAt).toLocaleString('sk-SK')}
                  </span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {data.insights.map((ins) => (
                    <div key={ins.id} className="flex gap-3 px-4 py-3 hover:bg-white/[0.02]">
                      <div className="pt-0.5">{priorityIcon(ins.priority)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{ins.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">{ins.detail}</p>
                        {ins.actionPath && ins.actionLabel && (
                          <button
                            type="button"
                            onClick={() => router.push(ins.actionPath!)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80"
                          >
                            {ins.actionLabel}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-gray-500">
              <strong className="text-gray-400">Poznámka:</strong> skóre vychádza z údajov v databáze (meta polia, kategórie, dĺžky textov, obrázky).
              Pre kompletnú SEO diagnostiku v produkcii odporúčame ešte Google Search Console, Lighthouse a kontrolu canonical URL a sitemapy.
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-card p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-white">{value}</p>
    </div>
  )
}
