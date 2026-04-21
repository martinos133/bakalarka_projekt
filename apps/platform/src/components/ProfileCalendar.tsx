'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
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

  const cellClass = (ymd: string | null) => {
    // aspect-square + 7× fr — bunky rastú so šírkou karty, stĺpce ostanú zarovnané s hlavičkami.
    const empty =
      'flex aspect-square w-full min-h-0 min-w-0 items-center justify-center rounded-lg bg-transparent text-transparent pointer-events-none select-none'
    if (!ymd) return empty
    const k = dayKinds.get(ymd)
    const today = formatYmdLocal(new Date())
    const base =
      'relative flex aspect-square w-full min-h-0 min-w-0 items-center justify-center rounded-lg text-[13px] font-medium tabular-nums transition-colors box-border sm:text-sm'
    if (k === 'blocked') return `${base} bg-gray-600/40 text-gray-100 ring-1 ring-inset ring-white/10`
    if (k === 'booking') return `${base} bg-accent/25 text-accent ring-1 ring-inset ring-accent/40`
    if (k === 'mixed') return `${base} bg-accent/15 text-white ring-1 ring-inset ring-gray-500/50`
    if (k === 'legacy') return `${base} bg-white/[0.06] text-gray-200 ring-1 ring-inset ring-white/10`
    if (ymd === today) return `${base} text-white ring-1 ring-inset ring-accent/50 bg-white/[0.04]`
    return `${base} text-gray-300 hover:bg-white/[0.06]`
  }

  return (
    <div className="space-y-8">
      <div className="card overflow-hidden p-5 sm:p-6">
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* items-stretch: pravý panel môže byť vyšší — legenda pod mriežkou vyplní spodný priestor (mt-auto). */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)] lg:items-stretch lg:gap-10">
          {/* Blokovaný čas — vľavo na desktope, pod kalendárom na mobile */}
          <aside className="order-2 min-w-0 lg:order-1">
            <div className="flex h-full min-h-0 flex-col rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.02] p-5 shadow-sm shadow-black/20">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                Blokovaný čas
              </p>
              <h3 className="mt-1 font-serif text-lg font-medium tracking-tight text-white">
                Vyhradené voľno predajcu
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">
                V označenom rozsahu nie je možná rezervácia. Kupujúci uvidia dni ako obsadené a pri žiadosti im
                systém nepovolí prekrývajúci termín.
              </p>
              <div className="mt-5 flex flex-1 flex-col border-t border-white/[0.06] pt-5">
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
                  className="mt-4 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-dark transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingBlock ? 'Ukladám…' : 'Pridať blokovaný čas'}
                </button>
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
              <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
                <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                  <h2 className="font-serif text-xl font-medium capitalize tracking-tight text-white sm:text-2xl">
                    {monthLabel}
                  </h2>
                  <div className="flex shrink-0 items-center gap-1 rounded-lg bg-black/20 p-0.5 ring-1 ring-white/10">
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
                {/* Mriežka na celú šírku panela — bunky sa prispôsobia (7× rovnaký stĺpec). */}
                <div className="w-full min-w-0 shrink-0 pt-0.5">
                  <div
                    className="grid w-full grid-cols-7 gap-1.5 sm:gap-2"
                    role="grid"
                    aria-label={`Kalendár — ${monthLabel}`}
                  >
                    {['po', 'ut', 'st', 'št', 'pi', 'so', 'ne'].map((d) => (
                      <div
                        key={d}
                        className="flex aspect-square w-full min-h-0 items-center justify-center text-[10px] font-semibold uppercase leading-none tracking-wide text-gray-500 sm:text-[11px]"
                      >
                        {d}
                      </div>
                    ))}
                    {gridDays.map((cell, idx) => (
                      <div key={idx} className={cellClass(cell.ymd)}>
                        {cell.n != null ? cell.n : ''}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto min-h-0 border-t border-white/[0.08] pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Legenda</p>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                    Farby v mriežke zodpovedajú stavu termínu.
                  </p>
                  <ul className="mt-3 space-y-3 text-xs leading-snug text-gray-300 sm:space-y-3.5 sm:text-[13px]">
                    <li className="flex gap-2.5 sm:gap-3">
                      <span
                        className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded-md bg-accent/25 ring-1 ring-inset ring-accent/40 sm:h-4 sm:w-4"
                        aria-hidden
                      />
                      <span>
                        <span className="font-medium text-white/90">Potvrdená rezervácia</span>
                        <span className="text-gray-500"> — termín je obsadený, kupujúci ho nevyberie.</span>
                      </span>
                    </li>
                    <li className="flex gap-2.5 sm:gap-3">
                      <span
                        className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded-md bg-gray-600/50 ring-1 ring-inset ring-white/10 sm:h-4 sm:w-4"
                        aria-hidden
                      />
                      <span>
                        <span className="font-medium text-white/90">Blokovaný čas</span>
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
                    <span className="text-white font-medium">{ev.title}</span>
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
