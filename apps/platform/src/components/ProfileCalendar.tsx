'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DateRange } from 'react-day-picker'
import { ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react'
import {
  CALENDAR_COLOR_BLOCKED,
  CALENDAR_COLOR_BOOKING,
  formatYmdLocal,
  iterateYmdRangeLocal,
  ymdRangeFromStoredEvent,
} from '@inzertna-platforma/shared'
import { api } from '@/lib/api'
import DatePicker from '@/components/DatePicker'

export type ProfileCalendarEvent = {
  id: string
  title: string
  description?: string | null
  color: string | null
  date: string
  endDate: string | null
  allDay: boolean
}

type Props = {
  /** Zvýšte po zmene mimo komponentu (napr. potvrdenie zo správ), aby sa znovu načítali udalosti. */
  refreshKey?: number
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function toNoonUtcIso(ymd: string): string {
  return `${ymd}T12:00:00.000Z`
}

function eventTag(ev: ProfileCalendarEvent): string {
  if (ev.color === CALENDAR_COLOR_BLOCKED) return 'Blokovaný čas'
  if (ev.color === CALENDAR_COLOR_BOOKING) return 'Rezervácia'
  return 'Udalosť'
}

function dedupeEventsById(events: ProfileCalendarEvent[]): ProfileCalendarEvent[] {
  const m = new Map<string, ProfileCalendarEvent>()
  for (const e of events) m.set(e.id, e)
  return [...m.values()]
}

/** Rovnaký typ ako v `title` API — bez opakovania pred štítkom (napr. „Rezervácia: Rezervácia: …“). */
function displayEventTitle(ev: ProfileCalendarEvent): string {
  const t = (ev.title ?? '').trim()
  if (!t) return ''
  if (ev.color === CALENDAR_COLOR_BOOKING) {
    const cleaned = t.replace(/^rezerv[aá]cia\s*:\s*/iu, '').trim()
    return cleaned || t
  }
  if (ev.color === CALENDAR_COLOR_BLOCKED) {
    const cleaned = t.replace(/^blokovan[yý]\s*čas\s*:\s*/iu, '').trim()
    return cleaned || t
  }
  return t
}

/** V náhľade zjednotí omylom zdvojené riadky (rovnaký typ, názov a rozsah). */
function dedupeEventsForPreview(events: ProfileCalendarEvent[]): ProfileCalendarEvent[] {
  const byId = dedupeEventsById(events)
  const seen = new Set<string>()
  const out: ProfileCalendarEvent[] = []
  for (const e of byId) {
    const d0 = new Date(e.date)
    const d1 = e.endDate ? new Date(e.endDate) : d0
    const { startYmd, endYmd } = ymdRangeFromStoredEvent(d0, d1)
    const key = `${e.color ?? ''}|${(e.title ?? '').trim()}|${startYmd}|${endYmd}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(e)
  }
  return out
}

function formatEventRangeSk(ev: ProfileCalendarEvent): string {
  const d0 = new Date(ev.date)
  const d1 = ev.endDate ? new Date(ev.endDate) : d0
  const { startYmd, endYmd } = ymdRangeFromStoredEvent(d0, d1)
  if (startYmd === endYmd) {
    return new Date(startYmd + 'T12:00:00.000Z').toLocaleDateString('sk-SK')
  }
  return `${new Date(startYmd + 'T12:00:00.000Z').toLocaleDateString('sk-SK')} – ${new Date(endYmd + 'T12:00:00.000Z').toLocaleDateString('sk-SK')}`
}

function eventToDateRange(ev: ProfileCalendarEvent): DateRange {
  return {
    from: new Date(ev.date),
    to: ev.endDate ? new Date(ev.endDate) : new Date(ev.date),
  }
}

/** Pondelok = 0 … nedeľa = 6 */
function mondayWeekdayIndex(d: Date): number {
  const w = d.getDay()
  return w === 0 ? 6 : w - 1
}

export default function ProfileCalendar({ refreshKey = 0 }: Props) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()))
  const [events, setEvents] = useState<ProfileCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [blockRange, setBlockRange] = useState<DateRange | undefined>(undefined)
  const [savingBlock, setSavingBlock] = useState(false)
  const [sheetDay, setSheetDay] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<ProfileCalendarEvent | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editRange, setEditRange] = useState<DateRange | undefined>(undefined)
  const [sheetBusy, setSheetBusy] = useState(false)
  const [hoverPreview, setHoverPreview] = useState<{
    top: number
    left: number
    items: ProfileCalendarEvent[]
  } | null>(null)
  const hoverLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const monthLabel = useMemo(
    () =>
      viewMonth.toLocaleDateString('sk-SK', {
        month: 'long',
        year: 'numeric',
      }),
    [viewMonth],
  )

  const fromTo = useMemo(() => {
    const a = startOfMonth(viewMonth)
    const b = endOfMonth(viewMonth)
    return { from: formatYmdLocal(a), to: formatYmdLocal(b) }
  }, [viewMonth])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.getCalendarEvents(fromTo.from, fromTo.to)
      setEvents(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || 'Nepodarilo sa načítať kalendár')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [fromTo.from, fromTo.to])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  const dayKinds = useMemo(() => {
    const map = new Map<string, 'blocked' | 'booking' | 'mixed' | 'legacy'>()
    for (const ev of events) {
      const dt = new Date(ev.date)
      const endDt = ev.endDate ? new Date(ev.endDate) : dt
      const { startYmd, endYmd } = ymdRangeFromStoredEvent(dt, endDt)
      const kind =
        ev.color === CALENDAR_COLOR_BLOCKED
          ? 'blocked'
          : ev.color === CALENDAR_COLOR_BOOKING
            ? 'booking'
            : 'legacy'
      for (const ymd of iterateYmdRangeLocal(startYmd, endYmd)) {
        const prev = map.get(ymd)
        if (!prev) map.set(ymd, kind)
        else if (prev === kind) continue
        else if (prev === 'mixed') map.set(ymd, 'mixed')
        else if (
          (prev === 'blocked' && kind === 'booking') ||
          (prev === 'booking' && kind === 'blocked')
        )
          map.set(ymd, 'mixed')
        else if (prev === 'legacy') map.set(ymd, kind)
        else if (kind === 'legacy') map.set(ymd, prev)
        else map.set(ymd, 'mixed')
      }
    }
    return map
  }, [events])

  /** Všetky udalosti, ktoré zasahujú do daného kalendárneho dňa (pre detail / úpravu). */
  const eventsByYmd = useMemo(() => {
    const m = new Map<string, ProfileCalendarEvent[]>()
    for (const ev of events) {
      const d0 = new Date(ev.date)
      const d1 = ev.endDate ? new Date(ev.endDate) : d0
      const { startYmd, endYmd } = ymdRangeFromStoredEvent(d0, d1)
      for (const ymd of iterateYmdRangeLocal(startYmd, endYmd)) {
        const arr = m.get(ymd)
        if (arr) {
          if (!arr.some((e) => e.id === ev.id)) arr.push(ev)
        } else {
          m.set(ymd, [ev])
        }
      }
    }
    return m
  }, [events])

  const gridDays = useMemo(() => {
    const first = startOfMonth(viewMonth)
    const last = endOfMonth(viewMonth)
    const pad = mondayWeekdayIndex(first)
    const totalCells = pad + last.getDate()
    const rows = Math.ceil(totalCells / 7)
    const cells: { n: number | null; ymd: string | null }[] = []
    for (let i = 0; i < rows * 7; i++) {
      const dayNum = i - pad + 1
      if (dayNum < 1 || dayNum > last.getDate()) {
        cells.push({ n: null, ymd: null })
      } else {
        const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), dayNum)
        cells.push({ n: dayNum, ymd: formatYmdLocal(d) })
      }
    }
    return cells
  }, [viewMonth])

  const handleAddBlock = async () => {
    const from = blockRange?.from
    const to = blockRange?.to
    if (!from || !to) {
      setError('Vyberte rozsah dátumov pre blokovanie.')
      return
    }
    if (from > to) {
      setError('Dátum „do“ musí byť neskôr alebo rovnaký ako „od“.')
      return
    }
    try {
      setSavingBlock(true)
      setError('')
      const startYmd = formatYmdLocal(from)
      const endYmd = formatYmdLocal(to)
      await api.createCalendarEvent({
        title: 'Blokovaný čas',
        description: 'Časť kalendára je nedostupná pre nové rezervácie.',
        date: toNoonUtcIso(startYmd),
        endDate: toNoonUtcIso(endYmd),
        allDay: true,
        color: CALENDAR_COLOR_BLOCKED,
      })
      setBlockRange(undefined)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Nepodarilo sa uložiť blok')
    } finally {
      setSavingBlock(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Odstrániť túto položku z kalendára?')) return
    try {
      await api.deleteCalendarEvent(id)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Zmazanie zlyhalo')
    }
  }

  const closeDaySheet = useCallback(() => {
    setSheetDay(null)
    setEditingEvent(null)
    setEditTitle('')
    setEditDescription('')
    setEditRange(undefined)
  }, [])

  const startEditEvent = (ev: ProfileCalendarEvent) => {
    setEditingEvent(ev)
    setEditTitle(ev.title)
    setEditDescription(ev.description?.trim() ?? '')
    setEditRange(eventToDateRange(ev))
  }

  const handleSaveEdit = async () => {
    if (!editingEvent || !editRange?.from || !editRange?.to) {
      setError('Vyberte platný rozsah dátumov.')
      return
    }
    if (editRange.from > editRange.to) {
      setError('Dátum „do“ musí byť neskôr alebo rovnaký ako „od“.')
      return
    }
    const title = editTitle.trim()
    if (!title) {
      setError('Zadajte názov.')
      return
    }
    try {
      setSheetBusy(true)
      setError('')
      const startYmd = formatYmdLocal(editRange.from)
      const endYmd = formatYmdLocal(editRange.to)
      await api.updateCalendarEvent(editingEvent.id, {
        title,
        description: editDescription.trim() || undefined,
        date: toNoonUtcIso(startYmd),
        endDate: toNoonUtcIso(endYmd),
        allDay: true,
        ...(editingEvent.color ? { color: editingEvent.color } : {}),
      })
      setEditingEvent(null)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Uloženie zlyhalo')
    } finally {
      setSheetBusy(false)
    }
  }

  const handleDeleteFromSheet = async (id: string) => {
    if (!confirm('Naozaj chcete odstrániť túto položku?')) return
    const key = sheetDay
    const beforeCount = key ? (eventsByYmd.get(key)?.length ?? 0) : 0
    try {
      setSheetBusy(true)
      setError('')
      await api.deleteCalendarEvent(id)
      if (editingEvent?.id === id) setEditingEvent(null)
      await load()
      if (beforeCount <= 1) closeDaySheet()
    } catch (e: any) {
      setError(e?.message || 'Zmazanie zlyhalo')
    } finally {
      setSheetBusy(false)
    }
  }

  useEffect(() => {
    if (sheetDay) setHoverPreview(null)
  }, [sheetDay])

  useEffect(
    () => () => {
      if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current)
    },
    [],
  )

  useEffect(() => {
    if (!sheetDay) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDaySheet()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [sheetDay, closeDaySheet])

  const sheetDayEvents = sheetDay ? eventsByYmd.get(sheetDay) ?? [] : []
  const sheetDayLabel = sheetDay
    ? new Date(sheetDay + 'T12:00:00.000Z').toLocaleDateString('sk-SK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const cellClass = (ymd: string | null) => {
    // aspect-square + 7× fr — bunky rastú so šírkou karty, stĺpce ostanú zarovnané s hlavičkami.
    const empty =
      'flex aspect-square w-full min-h-0 min-w-0 items-center justify-center rounded-lg bg-transparent text-transparent pointer-events-none select-none'
    if (!ymd) return empty
    const k = dayKinds.get(ymd)
    const today = formatYmdLocal(new Date())
    const base =
      'relative flex aspect-square w-full min-h-0 min-w-0 items-center justify-center rounded-lg text-[13px] font-medium tabular-nums transition-colors box-border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:text-sm'
    if (k === 'blocked')
      return `${base} bg-slate-500/45 text-slate-50 ring-1 ring-inset ring-white/20 hover:bg-slate-500/55`
    if (k === 'booking')
      return `${base} bg-accent/30 text-amber-100 ring-1 ring-inset ring-accent/45 hover:bg-accent/[0.38]`
    if (k === 'mixed')
      return `${base} bg-accent/18 text-white ring-1 ring-inset ring-accent/30`
    if (k === 'legacy')
      return `${base} bg-zinc-600/45 text-zinc-100 ring-1 ring-inset ring-white/18 hover:bg-zinc-600/55`
    if (ymd === today) return `${base} text-white ring-1 ring-inset ring-accent/55 bg-white/[0.06]`
    return `${base} text-gray-200 hover:bg-white/[0.07]`
  }

  return (
    <div className="space-y-8">
      <div className="card overflow-hidden p-5 shadow-lg shadow-black/25 sm:p-6">
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* items-stretch: pravý panel môže byť vyšší — legenda pod mriežkou vyplní spodný priestor (mt-auto). */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)] lg:items-stretch lg:gap-10">
          {/* Blokovaný čas — vľavo na desktope, pod kalendárom na mobile */}
          <aside className="order-2 min-w-0 lg:order-1">
            <div className="flex h-full min-h-0 flex-col rounded-xl border border-white/[0.09] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 shadow-inner shadow-black/20">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Blokovaný čas
              </p>
              <h3 className="mt-1.5 text-balance font-serif text-lg font-medium tracking-tight text-white">
                Vyhradené voľno predajcu
              </h3>
              <p className="mt-2.5 text-xs leading-relaxed text-gray-400">
                V označenom rozsahu nie je možná rezervácia. Kupujúci uvidia dni ako obsadené a pri žiadosti im
                systém nepovolí prekrývajúci termín.
              </p>
              <div className="mt-5 flex min-h-0 flex-1 flex-col border-t border-white/[0.07] pt-5">
                <div className="shrink-0">
                  <DatePicker
                    mode="range"
                    label="Rozsah (od – do)"
                    value={blockRange}
                    onChange={setBlockRange}
                    minDate={new Date()}
                  />
                  <button
                    type="button"
                    disabled={savingBlock}
                    onClick={() => void handleAddBlock()}
                    className="mt-4 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-dark shadow-md shadow-black/30 transition hover:bg-accent-light hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingBlock ? 'Ukladám…' : 'Pridať blokovaný čas'}
                  </button>
                </div>
                <div className="min-h-3 flex-1" aria-hidden />
                <p className="mt-4 shrink-0 rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2.5 text-[11px] leading-relaxed text-gray-500">
                  Obsadené dni upravíte alebo zrušíte kliknutím na číslo v kalendári. Pri podržaní kurzora uvidíte
                  stručný prehľad.
                </p>
              </div>
            </div>
          </aside>

          {/* Kalendár + legenda v jednom paneli; legenda prilepená nadol vyplní voľný priestor vedľa formulára. */}
          <section className="order-1 flex h-full min-h-0 min-w-0 flex-col lg:order-2">
            {loading ? (
              <div className="flex min-h-[12rem] flex-1 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-8 lg:min-h-0">
                <p className="text-sm text-gray-500">Načítavam udalosti…</p>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-white/[0.09] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-4 sm:p-5">
                <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                  <h2 className="text-balance font-serif text-xl font-medium capitalize tracking-tight text-white sm:text-2xl">
                    {monthLabel}
                  </h2>
                  <div className="flex shrink-0 items-center gap-0.5 rounded-lg bg-black/30 p-0.5 ring-1 ring-white/12">
                    <button
                      type="button"
                      onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                      className="rounded-md p-1.5 text-gray-400 transition hover:bg-white/[0.08] hover:text-white"
                      aria-label="Predchádzajúci mesiac"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMonth(startOfMonth(new Date()))}
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/[0.08] hover:text-white"
                    >
                      Dnes
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                      className="rounded-md p-1.5 text-gray-400 transition hover:bg-white/[0.08] hover:text-white"
                      aria-label="Ďalší mesiac"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {/* Mriežka v jemnom ráme — lepšia hierarchia oproti legende. */}
                <div className="w-full min-w-0 shrink-0 pt-1">
                  <div className="rounded-xl bg-black/30 p-2 ring-1 ring-inset ring-white/[0.06] sm:p-2.5">
                    <div
                      className="grid w-full grid-cols-7 gap-1.5 sm:gap-2"
                      role="grid"
                      aria-label={`Kalendár — ${monthLabel}`}
                    >
                    {['po', 'ut', 'st', 'št', 'pi', 'so', 'ne'].map((d) => (
                      <div
                        key={d}
                        className="flex aspect-square w-full min-h-0 items-center justify-center text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-gray-400 sm:text-[11px]"
                      >
                        {d}
                      </div>
                    ))}
                    {gridDays.map((cell, idx) => {
                      const list = cell.ymd ? (eventsByYmd.get(cell.ymd) ?? []) : []
                      const previewList = dedupeEventsForPreview(list)
                      const interactive = Boolean(cell.ymd && list.length > 0 && cell.n != null)
                      const cls = cellClass(cell.ymd)
                      const ariaDetail =
                        previewList.length === 0
                          ? ''
                          : previewList.length === 1
                            ? `${eventTag(previewList[0])}: ${displayEventTitle(previewList[0])}`
                            : `${previewList.length} položky`
                      if (interactive && cell.ymd) {
                        const clearHoverTimer = () => {
                          if (hoverLeaveTimer.current) {
                            clearTimeout(hoverLeaveTimer.current)
                            hoverLeaveTimer.current = null
                          }
                        }
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`${cls} cursor-pointer font-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]`}
                            aria-label={
                              ariaDetail
                                ? `Deň ${cell.n}, ${ariaDetail}. Otvoriť detail.`
                                : `Deň ${cell.n}. Otvoriť detail.`
                            }
                            onMouseEnter={(e) => {
                              clearHoverTimer()
                              const r = e.currentTarget.getBoundingClientRect()
                              const pad = 8
                              const maxW = 280
                              setHoverPreview({
                                top: r.bottom + pad,
                                left: Math.max(8, Math.min(r.left, window.innerWidth - maxW - 8)),
                                items: previewList,
                              })
                            }}
                            onMouseLeave={() => {
                              clearHoverTimer()
                              hoverLeaveTimer.current = setTimeout(() => setHoverPreview(null), 160)
                            }}
                            onClick={() => setSheetDay(cell.ymd)}
                          >
                            {cell.n}
                          </button>
                        )
                      }
                      return (
                        <div key={idx} className={cls}>
                          {cell.n != null ? cell.n : ''}
                        </div>
                      )
                    })}
                    </div>
                  </div>
                </div>

                <div className="mt-auto min-h-0 border-t border-white/[0.08] pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Legenda</p>
                  <p className="mt-1 max-w-prose text-xs text-gray-500 sm:text-sm">
                    Farby v mriežke zodpovedajú stavu termínu.
                  </p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <li className="flex gap-3 rounded-lg border border-white/[0.06] bg-black/20 p-3 sm:p-3.5">
                      <span
                        className="mt-0.5 inline-block h-4 w-4 shrink-0 self-start rounded-md bg-accent/30 ring-1 ring-inset ring-accent/45"
                        aria-hidden
                      />
                      <span className="min-w-0 text-xs leading-snug text-gray-300 sm:text-[13px]">
                        <span className="font-medium text-white">Potvrdená rezervácia</span>
                        <span className="text-gray-500"> — termín je obsadený, kupujúci ho nevyberie.</span>
                      </span>
                    </li>
                    <li className="flex gap-3 rounded-lg border border-white/[0.06] bg-black/20 p-3 sm:p-3.5">
                      <span
                        className="mt-0.5 inline-block h-4 w-4 shrink-0 self-start rounded-md bg-slate-500/50 ring-1 ring-inset ring-white/20"
                        aria-hidden
                      />
                      <span className="min-w-0 text-xs leading-snug text-gray-300 sm:text-[13px]">
                        <span className="font-medium text-white">Blokovaný čas</span>
                        <span className="text-gray-500"> — vyhradené voľno predajcu, rezervácia nie je možná.</span>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {hoverPreview &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[90] max-w-[280px] rounded-lg border border-white/10 bg-[#1f1f1f] px-3 py-2.5 shadow-xl ring-1 ring-black/40"
            style={{ top: hoverPreview.top, left: hoverPreview.left }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Prehľad</p>
            <ul className="mt-1.5 space-y-2">
              {hoverPreview.items.slice(0, 3).map((ev) => (
                <li key={ev.id} className="text-xs leading-snug text-gray-200">
                  <span className="text-gray-500">{eventTag(ev)}</span>
                  <span className="text-gray-600"> — </span>
                  <span className="font-medium text-white">{displayEventTitle(ev)}</span>
                  {ev.description?.trim() ? (
                    <span className="mt-0.5 block text-[11px] text-gray-500 line-clamp-2">
                      {ev.description.trim()}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            {hoverPreview.items.length > 3 ? (
              <p className="mt-2 text-[10px] text-gray-500">+{hoverPreview.items.length - 3} ďalších…</p>
            ) : (
              <p className="mt-2 text-[10px] text-gray-500">Kliknutím otvoríte úpravy a odstránenie.</p>
            )}
          </div>,
          document.body,
        )}

      {sheetDay &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-4"
            role="presentation"
            onClick={closeDaySheet}
          >
            <div
              className="max-h-[min(90dvh,32rem)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl sm:max-h-[85vh] sm:rounded-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="day-sheet-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p id="day-sheet-title" className="font-serif text-lg font-medium text-white sm:text-xl">
                    {editingEvent ? 'Upraviť položku' : 'Obsadený termín'}
                  </p>
                  <p className="mt-1 text-sm capitalize text-gray-400">{sheetDayLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={closeDaySheet}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-white/[0.08] hover:text-white"
                  aria-label="Zavrieť"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {editingEvent ? (
                <div className="space-y-4 border-t border-white/[0.08] pt-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Názov
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Poznámka / kupujúci
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={4}
                      className="w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                    />
                  </div>
                  <DatePicker
                    mode="range"
                    label="Termín (od – do)"
                    value={editRange}
                    onChange={setEditRange}
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={sheetBusy}
                      onClick={() => void handleSaveEdit()}
                      className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-accent-light disabled:opacity-50"
                    >
                      {sheetBusy ? 'Ukladám…' : 'Uložiť zmeny'}
                    </button>
                    <button
                      type="button"
                      disabled={sheetBusy}
                      onClick={() => setEditingEvent(null)}
                      className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/[0.06]"
                    >
                      Späť na zoznam
                    </button>
                  </div>
                </div>
              ) : sheetDayEvents.length === 0 ? (
                <p className="text-sm text-gray-500">Pre tento deň nie sú žiadne záznamy.</p>
              ) : (
                <ul className="space-y-3 border-t border-white/[0.08] pt-4">
                  {sheetDayEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          {eventTag(ev)}
                        </span>
                      </div>
                      <p className="mt-1 font-medium text-white">{displayEventTitle(ev)}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatEventRangeSk(ev)}</p>
                      {ev.description?.trim() ? (
                        <p className="mt-2 text-sm leading-relaxed text-gray-400">{ev.description.trim()}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={sheetBusy}
                          onClick={() => startEditEvent(ev)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-gray-200 transition hover:bg-white/[0.06] disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Upraviť
                        </button>
                        <button
                          type="button"
                          disabled={sheetBusy}
                          onClick={() => void handleDeleteFromSheet(ev.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-950/50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Odstrániť
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>,
          document.body,
        )}

      <div className="card p-6">
        <h3 className="text-md font-semibold text-white mb-4">Udalosti v tomto mesiaci</h3>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">Žiadne záznamy.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {events.map((ev) => {
              const d0 = new Date(ev.date)
              const d1 = ev.endDate ? new Date(ev.endDate) : d0
              const { startYmd, endYmd } = ymdRangeFromStoredEvent(d0, d1)
              const rangeLabel =
                startYmd === endYmd
                  ? new Date(startYmd + 'T12:00:00.000Z').toLocaleDateString('sk-SK')
                  : `${new Date(startYmd + 'T12:00:00.000Z').toLocaleDateString('sk-SK')} – ${new Date(endYmd + 'T12:00:00.000Z').toLocaleDateString('sk-SK')}`
              const tag =
                ev.color === CALENDAR_COLOR_BLOCKED
                  ? 'Blok'
                  : ev.color === CALENDAR_COLOR_BOOKING
                    ? 'Rezervácia'
                    : 'Udalosť'
              return (
                <li
                  key={ev.id}
                  className="py-3 flex items-start justify-between gap-3 text-sm text-gray-300"
                >
                  <div>
                    <span className="text-xs uppercase tracking-wide text-gray-500 mr-2">{tag}</span>
                    <span className="text-white font-medium">{displayEventTitle(ev)}</span>
                    <p className="text-xs text-gray-500 mt-1">{rangeLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDelete(ev.id)}
                    className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/[0.04]"
                    title="Zmazať"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
