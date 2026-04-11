'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
  Filter,
  X,
  BarChart3,
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import Select from '@/components/Select'
import { isAuthenticated } from '@/lib/auth'
import api from '@/lib/api'

type SeoStrength = 'silné' | 'stredné' | 'slabé'

type SeoSection = 'categories' | 'static-pages' | 'blog' | 'advertisements'

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

interface SeoOverviewExtras {
  advertisements?: {
    avgTitleLen: number
    avgDescLen: number
    avgImageCount: number
    inDateRange: number
  }
  blog?: { inDateRange: number }
  staticPages?: { inDateRange: number }
  categories?: { inDateRange: number }
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
  filters: Record<string, unknown>
  extras: SeoOverviewExtras
}

const ALL_SECTIONS: SeoSection[] = ['categories', 'static-pages', 'blog', 'advertisements']
const AD_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ACTIVE', label: 'Aktívny' },
  { value: 'PENDING', label: 'Čaká' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'INACTIVE', label: 'Neaktívny' },
  { value: 'ARCHIVED', label: 'Archivovaný' },
]

const BLOG_SCOPE_OPTIONS = [
  { value: 'published', label: 'Publikované' },
  { value: 'draft', label: 'Draft' },
  { value: 'both', label: 'Všetky' },
] as const

const STATIC_SCOPE_OPTIONS = [
  { value: 'published', label: 'Publikované' },
  { value: 'draft', label: 'Draft / neaktívne' },
  { value: 'both', label: 'Všetky' },
] as const

const DATE_FIELD_OPTIONS = [
  { value: 'updatedAt', label: 'Posledná úprava' },
  { value: 'createdAt', label: 'Vytvorenie' },
] as const

interface CategoryOpt {
  id: string
  name: string
}

interface FilterForm {
  sections: Set<SeoSection>
  adStatuses: Set<string>
  blogScope: 'published' | 'draft' | 'both'
  staticScope: 'published' | 'draft' | 'both'
  adsCategoryId: string
  adsPriorityOnly: boolean
  categoryIds: Set<string>
  dateFrom: string
  dateTo: string
  dateField: 'createdAt' | 'updatedAt'
  minAdTitleLen: number
  minAdDescLen: number
  keywordLimit: number
  kwCategoryNames: boolean
  kwCategoryMeta: boolean
  kwBlog: boolean
  kwStatic: boolean
}

function defaultFilterForm(): FilterForm {
  return {
    sections: new Set(ALL_SECTIONS),
    adStatuses: new Set(['ACTIVE']),
    blogScope: 'published',
    staticScope: 'published',
    adsCategoryId: '',
    adsPriorityOnly: false,
    categoryIds: new Set(),
    dateFrom: '',
    dateTo: '',
    dateField: 'updatedAt',
    minAdTitleLen: 12,
    minAdDescLen: 120,
    keywordLimit: 20,
    kwCategoryNames: true,
    kwCategoryMeta: true,
    kwBlog: true,
    kwStatic: true,
  }
}

function formToQuery(f: FilterForm): Record<string, string> {
  const q: Record<string, string> = {}
  const sec = ALL_SECTIONS.filter((s) => f.sections.has(s))
  if (sec.length) q.sections = sec.join(',')
  q.adStatuses = [...f.adStatuses].join(',')
  q.blogScope = f.blogScope
  q.staticScope = f.staticScope
  if (f.adsCategoryId) q.adsCategoryId = f.adsCategoryId
  if (f.adsPriorityOnly) q.adsPriorityOnly = 'true'
  if (f.categoryIds.size) q.categoryIds = [...f.categoryIds].join(',')
  if (f.dateFrom) q.dateFrom = f.dateFrom
  if (f.dateTo) q.dateTo = f.dateTo
  q.dateField = f.dateField
  q.minAdTitleLen = String(f.minAdTitleLen)
  q.minAdDescLen = String(f.minAdDescLen)
  q.keywordLimit = String(f.keywordLimit)
  q.kwCategoryNames = f.kwCategoryNames ? 'true' : 'false'
  q.kwCategoryMeta = f.kwCategoryMeta ? 'true' : 'false'
  q.kwBlog = f.kwBlog ? 'true' : 'false'
  q.kwStatic = f.kwStatic ? 'true' : 'false'
  return q
}

function countActiveFilters(f: FilterForm): number {
  const d = defaultFilterForm()
  let n = 0
  if (f.sections.size !== d.sections.size) n++
  if (f.adStatuses.size !== d.adStatuses.size || ![...f.adStatuses].every((x) => d.adStatuses.has(x))) n++
  if (f.blogScope !== d.blogScope) n++
  if (f.staticScope !== d.staticScope) n++
  if (f.adsCategoryId) n++
  if (f.adsPriorityOnly) n++
  if (f.categoryIds.size) n++
  if (f.dateFrom || f.dateTo) n++
  if (f.dateField !== d.dateField) n++
  if (f.minAdTitleLen !== d.minAdTitleLen) n++
  if (f.minAdDescLen !== d.minAdDescLen) n++
  if (f.keywordLimit !== d.keywordLimit) n++
  if (!f.kwCategoryNames || !f.kwCategoryMeta || !f.kwBlog || !f.kwStatic) n++
  return n
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
  const [form, setForm] = useState<FilterForm>(defaultFilterForm)
  const [appliedQuery, setAppliedQuery] = useState<Record<string, string>>(() => formToQuery(defaultFilterForm()))
  const [data, setData] = useState<SeoOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(true)
  const [categories, setCategories] = useState<CategoryOpt[]>([])

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login')
  }, [router])

  useEffect(() => {
    api
      .getActiveCategories()
      .then((list: unknown) => {
        if (!Array.isArray(list)) return
        setCategories(
          list.map((c: { id?: string; name?: string }) => ({
            id: String(c.id || ''),
            name: String(c.name || ''),
          })),
        )
      })
      .catch(() => setCategories([]))
  }, [])

  const categorySelectOptions = useMemo(
    () => [{ value: '', label: 'Všetky kategórie' }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    [categories],
  )

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await api.getSeoOverview(appliedQuery)
      setData(res as SeoOverview)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa načítať SEO dáta')
    } finally {
      setLoading(false)
    }
  }, [appliedQuery])

  useEffect(() => {
    load()
  }, [load])

  const activeFilterCount = useMemo(() => countActiveFilters(form), [form])

  const applyFilters = () => {
    setLoading(true)
    setAppliedQuery(formToQuery(form))
  }

  const resetFilters = () => {
    const d = defaultFilterForm()
    setForm(d)
    setLoading(true)
    setAppliedQuery(formToQuery(d))
  }

  const setLastDays = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setForm((prev) => ({
      ...prev,
      dateFrom: start.toISOString().slice(0, 10),
      dateTo: end.toISOString().slice(0, 10),
    }))
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setLoading(true)
    await load()
    setTimeout(() => setRefreshing(false), 400)
  }

  const overall = data ? strengthStyles(data.overallStrength) : strengthStyles('stredné')

  const toggleSection = (s: SeoSection) => {
    setForm((prev) => {
      const next = new Set(prev.sections)
      if (next.has(s)) {
        if (next.size <= 1) return prev
        next.delete(s)
      } else next.add(s)
      return { ...prev, sections: next }
    })
  }

  const toggleAdStatus = (st: string) => {
    setForm((prev) => {
      const next = new Set(prev.adStatuses)
      if (next.has(st)) {
        if (next.size <= 1) return prev
        next.delete(st)
      } else next.add(st)
      return { ...prev, adStatuses: next }
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-3 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-[#1c1917]/90 px-4 py-2 shadow-sm shadow-black/20">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15">
              <TrendingUp className="h-4 w-4 text-accent" strokeWidth={2} />
            </span>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-accent">SEO prehľad</h1>
              <p className="text-[11px] text-gray-500">Filtre, prahy a merania podľa výberu dát</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'border-accent/30 bg-accent/10 text-accent'
                  : 'border-white/[0.08] bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtre a merania
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-accent/25 px-1.5 py-0 text-[10px] font-bold">{activeFilterCount}</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className={`inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/[0.08] hover:text-white ${refreshing ? 'opacity-70' : ''}`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Obnoviť
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="rounded-2xl border border-white/[0.06] bg-card p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 w-full sm:w-auto sm:mr-2">Rýchle obdobia</span>
              <button type="button" onClick={() => setLastDays(7)} className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs text-gray-300 hover:text-white">
                7 dní
              </button>
              <button type="button" onClick={() => setLastDays(30)} className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs text-gray-300 hover:text-white">
                30 dní
              </button>
              <button type="button" onClick={() => setLastDays(90)} className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs text-gray-300 hover:text-white">
                90 dní
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, dateFrom: '', dateTo: '' }))}
                className="rounded-lg px-2.5 py-1 text-xs text-gray-500 hover:text-white"
              >
                Zrušiť dátum
              </button>
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-2">Zahrnúť do celkového skóre</p>
              <div className="flex flex-wrap gap-2">
                {ALL_SECTIONS.map((s) => {
                  const labels: Record<SeoSection, string> = {
                    categories: 'Kategórie',
                    'static-pages': 'Statické stránky',
                    blog: 'Blog',
                    advertisements: 'Inzeráty',
                  }
                  const on = form.sections.has(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSection(s)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        on ? 'border-accent/40 bg-accent/15 text-accent' : 'border-white/[0.08] text-gray-500 hover:border-white/[0.15]'
                      }`}
                    >
                      {labels[s]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-2">Stav inzerátu</p>
                <div className="flex flex-wrap gap-1.5">
                  {AD_STATUS_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleAdStatus(o.value)}
                      className={`rounded-lg border px-2 py-1 text-[11px] ${
                        form.adStatuses.has(o.value) ? 'border-accent/35 bg-accent/10 text-accent' : 'border-white/[0.06] text-gray-500'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-2">Blog (stav)</p>
                <Select
                  value={form.blogScope}
                  onChange={(v) => setForm((p) => ({ ...p, blogScope: v as FilterForm['blogScope'] }))}
                  options={[...BLOG_SCOPE_OPTIONS]}
                  placeholder="Vyber stav"
                />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-2">Statické stránky</p>
                <Select
                  value={form.staticScope}
                  onChange={(v) => setForm((p) => ({ ...p, staticScope: v as FilterForm['staticScope'] }))}
                  options={[...STATIC_SCOPE_OPTIONS]}
                  placeholder="Vyber stav"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">Inzeráty len v kategórii</p>
                <Select
                  value={form.adsCategoryId}
                  onChange={(v) => setForm((p) => ({ ...p, adsCategoryId: v }))}
                  options={categorySelectOptions}
                  placeholder="Všetky kategórie"
                />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">Časové pole</p>
                <Select
                  value={form.dateField}
                  onChange={(v) => setForm((p) => ({ ...p, dateField: v as 'createdAt' | 'updatedAt' }))}
                  options={[...DATE_FIELD_OPTIONS]}
                  placeholder="Vyber pole"
                />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">Od</p>
                <input
                  type="date"
                  value={form.dateFrom}
                  onChange={(e) => setForm((p) => ({ ...p, dateFrom: e.target.value }))}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none"
                />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">Do</p>
                <input
                  type="date"
                  value={form.dateTo}
                  onChange={(e) => setForm((p) => ({ ...p, dateTo: e.target.value }))}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">Min. dĺžka titulku inzerátu</p>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={form.minAdTitleLen}
                  onChange={(e) => setForm((p) => ({ ...p, minAdTitleLen: Number(e.target.value) || 1 }))}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none"
                />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">Min. dĺžka popisu inzerátu</p>
                <input
                  type="number"
                  min={1}
                  max={20000}
                  value={form.minAdDescLen}
                  onChange={(e) => setForm((p) => ({ ...p, minAdDescLen: Number(e.target.value) || 1 }))}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none"
                />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">Top kľúčových slov</p>
                <input
                  type="number"
                  min={5}
                  max={80}
                  value={form.keywordLimit}
                  onChange={(e) => setForm((p) => ({ ...p, keywordLimit: Number(e.target.value) || 5 }))}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 pt-6 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.adsPriorityOnly}
                  onChange={(e) => setForm((p) => ({ ...p, adsPriorityOnly: e.target.checked }))}
                  className="rounded border-white/20 bg-white/10"
                />
                Len zvýraznené inzeráty
              </label>
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-2">Zdroje kľúčových slov</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.kwCategoryNames} onChange={(e) => setForm((p) => ({ ...p, kwCategoryNames: e.target.checked }))} className="rounded border-white/20" />
                  Názvy kategórií
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.kwCategoryMeta} onChange={(e) => setForm((p) => ({ ...p, kwCategoryMeta: e.target.checked }))} className="rounded border-white/20" />
                  Meta kategórií
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.kwBlog} onChange={(e) => setForm((p) => ({ ...p, kwBlog: e.target.checked }))} className="rounded border-white/20" />
                  Blog
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.kwStatic} onChange={(e) => setForm((p) => ({ ...p, kwStatic: e.target.checked }))} className="rounded border-white/20" />
                  Statické stránky
                </label>
              </div>
            </div>

            {categories.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-2">Obmedziť blok „Kategórie“ na výber ID (voliteľné)</p>
                <div className="max-h-36 overflow-y-auto rounded-lg border border-white/[0.06] p-2 space-y-1">
                  {categories.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-gray-300 hover:bg-white/[0.04]">
                      <input
                        type="checkbox"
                        checked={form.categoryIds.has(c.id)}
                        onChange={() =>
                          setForm((p) => {
                            const next = new Set(p.categoryIds)
                            if (next.has(c.id)) next.delete(c.id)
                            else next.add(c.id)
                            return { ...p, categoryIds: next }
                          })
                        }
                        className="rounded border-white/20"
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
              <button type="button" onClick={applyFilters} className="rounded-xl bg-accent/20 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent/30">
                Použiť filtre
              </button>
              <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] px-4 py-2 text-xs text-gray-400 hover:text-white">
                <X className="h-3.5 w-3.5" />
                Predvolené
              </button>
            </div>
          </div>
        )}

        {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">{error}</div>}

        {loading && !data ? (
          <div className="rounded-2xl border border-white/[0.06] bg-card py-20 text-center text-sm text-gray-500">Načítavam SEO prehľad…</div>
        ) : data ? (
          <>
            {data.extras.advertisements && (
              <div className="rounded-2xl border border-white/[0.06] bg-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  <h2 className="text-sm font-semibold text-white">Merania inzerátov (aktuálny výber)</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                  <div>
                    <p className="text-gray-500">Priem. dĺžka titulku</p>
                    <p className="text-lg font-semibold text-white">{data.extras.advertisements.avgTitleLen} znakov</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Priem. dĺžka popisu</p>
                    <p className="text-lg font-semibold text-white">{data.extras.advertisements.avgDescLen} znakov</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Priem. počet obrázkov</p>
                    <p className="text-lg font-semibold text-white">{data.extras.advertisements.avgImageCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Počet v súčte</p>
                    <p className="text-lg font-semibold text-white">{data.extras.advertisements.inDateRange}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[11px] text-gray-500">
              <span className="text-gray-400">Aplikované filtre:</span>{' '}
              <code className="text-gray-600 break-all">{JSON.stringify(data.filters)}</code>
            </div>

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
                  <span className="text-gray-600"> · len zvolené sekcie</span>
                </p>
              </div>
              <MiniStat label="Kategórie (výber)" value={data.counts.activeCategories} />
              <MiniStat label="Publ. stránky" value={data.counts.publishedStaticPages} />
              <MiniStat label="Blog / inzeráty" value={`${data.counts.publishedBlogPosts} / ${data.counts.activeAdvertisements}`} />
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
                  <h2 className="text-sm font-semibold text-white">Kľúčové výrazy</h2>
                </div>
                <p className="mb-3 text-[11px] text-gray-500">
                  Podľa zdrojov v poslednom výsledku. Limit:{' '}
                  {typeof data.filters.keywordLimit === 'number' ? data.filters.keywordLimit : '–'}.
                </p>
                {data.topKeywords.length === 0 ? (
                  <p className="text-sm text-gray-500">Žiadne výsledky – skús zapnúť zdroje alebo rozšíriť obsah.</p>
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
                  <span className="ml-auto text-[10px] text-gray-600">{new Date(data.generatedAt).toLocaleString('sk-SK')}</span>
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
              <strong className="text-gray-400">Poznámka:</strong> dátum filtruje kategórie, statické stránky, blog aj inzeráty podľa zvoleného poľa (vytvorenie / úprava). Celkové skóre sa prepočíta len z aktívnych sekcií v pill tlačidlách.
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
