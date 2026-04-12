'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { api } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import Select from '@/components/Select'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar,
  Bell,
  CheckSquare,
  Trash2,
  Edit3,
  Clock,
  Check,
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  type: 'EVENT' | 'REMINDER' | 'TASK'
  date: string
  endDate?: string | null
  allDay: boolean
  color?: string | null
  completed: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

const EVENT_COLORS = [
  { value: '#c9a96e', label: 'Zlatá' },
  { value: '#3b82f6', label: 'Modrá' },
  { value: '#ef4444', label: 'Červená' },
  { value: '#22c55e', label: 'Zelená' },
  { value: '#a855f7', label: 'Fialová' },
  { value: '#f97316', label: 'Oranžová' },
  { value: '#06b6d4', label: 'Tyrkysová' },
  { value: '#ec4899', label: 'Ružová' },
]

const TYPE_CONFIG = {
  EVENT: { label: 'Udalosť', icon: Calendar, color: 'text-blue-400' },
  REMINDER: { label: 'Pripomienka', icon: Bell, color: 'text-amber-400' },
  TASK: { label: 'Úloha', icon: CheckSquare, color: 'text-green-400' },
}

const DAYS_SK = ['po', 'ut', 'st', 'št', 'pi', 'so', 'ne']
const MONTHS_SK = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December',
]

const FILTER_TYPE_OPTIONS = [
  { value: 'all', label: 'Všetky typy' },
  { value: 'EVENT', label: 'Udalosť' },
  { value: 'REMINDER', label: 'Pripomienka' },
  { value: 'TASK', label: 'Úloha' },
]

const FILTER_STATUS_OPTIONS = [
  { value: 'all', label: 'Všetky stavy' },
  { value: 'open', label: 'Aktívne' },
  { value: 'done', label: 'Dokončené' },
]

const MONTH_OPTIONS = [
  { value: '0', label: 'Január' },
  { value: '1', label: 'Február' },
  { value: '2', label: 'Marec' },
  { value: '3', label: 'Apríl' },
  { value: '4', label: 'Máj' },
  { value: '5', label: 'Jún' },
  { value: '6', label: 'Júl' },
  { value: '7', label: 'August' },
  { value: '8', label: 'September' },
  { value: '9', label: 'Október' },
  { value: '10', label: 'November' },
  { value: '11', label: 'December' },
]

const TIME_OPTIONS = (() => {
  const opts: Array<{ value: string; label: string }> = [
    { value: '', label: '—' },
  ]
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const v = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      opts.push({ value: v, label: v })
    }
  }
  return opts
})()

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function parseDateInput(value: string): Date {
  const [y, m, d] = value.split('-').map((x) => Number(x))
  return new Date(y, (m || 1) - 1, d || 1)
}

function clampMonthYear(year: number, month: number) {
  if (month < 0) return { year: year - 1, month: 11 }
  if (month > 11) return { year: year + 1, month: 0 }
  return { year, month }
}

export default function OrganizerPage() {
  const router = useRouter()
  const today = new Date()

  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | CalendarEvent['type']>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'done'>('all')
  const [filterDate, setFilterDate] = useState('') // YYYY-MM-DD alebo ''
  const [filterDateOpen, setFilterDateOpen] = useState(false)
  const [fdpYear, setFdpYear] = useState(today.getFullYear())
  const [fdpMonth, setFdpMonth] = useState(today.getMonth())

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [datePickerOpen, setDatePickerOpen] = useState<null | 'start' | 'end'>(null)
  const [dpYear, setDpYear] = useState(today.getFullYear())
  const [dpMonth, setDpMonth] = useState(today.getMonth())

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'EVENT' as 'EVENT' | 'REMINDER' | 'TASK',
    date: '',
    endDate: '',
    time: '',
    endTime: '',
    allDay: true,
    color: '#c9a96e',
  })

  const [saving, setSaving] = useState(false)

  const loadEvents = useCallback(async () => {
    try {
      setError('')
      const from = new Date(currentYear, currentMonth, 1).toISOString()
      const to = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString()
      const data = await api.getCalendarEvents(from, to)
      setEvents(data)
    } catch (e: any) {
      setError('Nepodarilo sa načítať kalendár. Skúste obnoviť stránku.')
    } finally {
      setLoading(false)
    }
  }, [currentYear, currentMonth])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadEvents()
  }, [loadEvents, router])

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const goToToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1)

  const calendarCells = useMemo(() => {
    const cells: { date: Date; isCurrentMonth: boolean }[] = []

    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({
        date: new Date(currentYear, currentMonth - 1, prevMonthDays - i),
        isCurrentMonth: false,
      })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true,
      })
    }

    const remaining = 42 - cells.length
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: new Date(currentYear, currentMonth + 1, i),
        isCurrentMonth: false,
      })
    }

    return cells
  }, [currentYear, currentMonth, daysInMonth, firstDay, prevMonthDays])

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    const q = query.trim().toLowerCase()
    const filtered = events.filter((ev) => {
      if (filterType !== 'all' && ev.type !== filterType) return false
      if (filterStatus !== 'all') {
        const done = !!ev.completed
        if (filterStatus === 'done' && !done) return false
        if (filterStatus === 'open' && done) return false
      }
      if (filterDate) {
        const d = formatDate(new Date(ev.date))
        if (d !== filterDate) return false
      }
      if (q) {
        const hay = `${ev.title} ${ev.description || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    filtered.forEach((ev) => {
      const key = formatDate(new Date(ev.date))
      if (!map[key]) map[key] = []
      map[key].push(ev)
    })
    return map
  }, [events, query, filterType, filterStatus])

  const filteredCount = useMemo(() => {
    return Object.values(eventsByDate).reduce((sum, arr) => sum + arr.length, 0)
  }, [eventsByDate])

  const openCreateModal = (date?: Date) => {
    const d = date || new Date()
    setEditingEvent(null)
    setDatePickerOpen(null)
    setDpYear(d.getFullYear())
    setDpMonth(d.getMonth())
    setForm({
      title: '',
      description: '',
      type: 'EVENT',
      date: formatDate(d),
      endDate: '',
      time: '',
      endTime: '',
      allDay: true,
      color: '#c9a96e',
    })
    setShowModal(true)
  }

  const openEditModal = (ev: CalendarEvent) => {
    setEditingEvent(ev)
    setDatePickerOpen(null)
    const d = new Date(ev.date)
    setDpYear(d.getFullYear())
    setDpMonth(d.getMonth())
    setForm({
      title: ev.title,
      description: ev.description || '',
      type: ev.type,
      date: formatDate(d),
      endDate: ev.endDate ? formatDate(new Date(ev.endDate)) : '',
      time: ev.allDay ? '' : formatTime(ev.date),
      endTime: ev.endDate && !ev.allDay ? formatTime(ev.endDate) : '',
      allDay: ev.allDay,
      color: ev.color || '#c9a96e',
    })
    setShowModal(true)
  }

  const openDatePicker = (which: 'start' | 'end') => {
    const current = which === 'start' ? form.date : form.endDate || form.date
    const base = current ? parseDateInput(current) : new Date()
    setDpYear(base.getFullYear())
    setDpMonth(base.getMonth())
    setDatePickerOpen(which)
  }

  const dpCells = useMemo(() => {
    const first = getFirstDayOfMonth(dpYear, dpMonth)
    const dim = getDaysInMonth(dpYear, dpMonth)
    const prevDim = getDaysInMonth(dpYear, dpMonth - 1)
    const cells: Array<{ date: Date; inMonth: boolean }> = []

    for (let i = first - 1; i >= 0; i--) {
      cells.push({
        date: new Date(dpYear, dpMonth - 1, prevDim - i),
        inMonth: false,
      })
    }
    for (let i = 1; i <= dim; i++) {
      cells.push({ date: new Date(dpYear, dpMonth, i), inMonth: true })
    }
    while (cells.length < 42) {
      const nextDay = cells.length - (first + dim) + 1
      cells.push({ date: new Date(dpYear, dpMonth + 1, nextDay), inMonth: false })
    }
    return cells
  }, [dpYear, dpMonth])

  const fdpCells = useMemo(() => {
    const first = getFirstDayOfMonth(fdpYear, fdpMonth)
    const dim = getDaysInMonth(fdpYear, fdpMonth)
    const prevDim = getDaysInMonth(fdpYear, fdpMonth - 1)
    const cells: Array<{ date: Date; inMonth: boolean }> = []

    for (let i = first - 1; i >= 0; i--) {
      cells.push({
        date: new Date(fdpYear, fdpMonth - 1, prevDim - i),
        inMonth: false,
      })
    }
    for (let i = 1; i <= dim; i++) {
      cells.push({ date: new Date(fdpYear, fdpMonth, i), inMonth: true })
    }
    while (cells.length < 42) {
      const nextDay = cells.length - (first + dim) + 1
      cells.push({ date: new Date(fdpYear, fdpMonth + 1, nextDay), inMonth: false })
    }
    return cells
  }, [fdpYear, fdpMonth])

  const selectDateFromPicker = (d: Date) => {
    const value = formatDate(d)
    if (datePickerOpen === 'start') {
      setForm((prev) => ({
        ...prev,
        date: value,
        ...(prev.endDate && parseDateInput(prev.endDate) < d ? { endDate: value } : {}),
      }))
    } else if (datePickerOpen === 'end') {
      setForm((prev) => ({ ...prev, endDate: value }))
    }
    setDatePickerOpen(null)
  }

  const yearOptions = useMemo(() => {
    const start = today.getFullYear() - 5
    const end = today.getFullYear() + 5
    const opts: Array<{ value: string; label: string }> = []
    for (let y = start; y <= end; y++) {
      opts.push({ value: String(y), label: String(y) })
    }
    return opts
  }, [today])

  const openFilterDatePicker = () => {
    const base = filterDate ? parseDateInput(filterDate) : new Date(currentYear, currentMonth, 1)
    setFdpYear(base.getFullYear())
    setFdpMonth(base.getMonth())
    setFilterDateOpen(true)
  }

  const selectFilterDate = (d: Date) => {
    const value = formatDate(d)
    setFilterDate(value)
    setSelectedDate(d)
    setCurrentYear(d.getFullYear())
    setCurrentMonth(d.getMonth())
    setFilterDateOpen(false)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      let dateStr = form.date
      if (!form.allDay && form.time) {
        dateStr = `${form.date}T${form.time}:00`
      }

      let endDateStr: string | undefined
      if (form.endDate) {
        endDateStr = form.endDate
        if (!form.allDay && form.endTime) {
          endDateStr = `${form.endDate}T${form.endTime}:00`
        }
      } else if (!form.allDay && form.endTime) {
        endDateStr = `${form.date}T${form.endTime}:00`
      }

      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        date: dateStr,
        endDate: endDateStr || undefined,
        allDay: form.allDay,
        color: form.color,
      }

      if (editingEvent) {
        await api.updateCalendarEvent(editingEvent.id, payload)
      } else {
        await api.createCalendarEvent(payload)
      }

      setShowModal(false)
      loadEvents()
    } catch (e: any) {
      setError(e.message || 'Nepodarilo sa uložiť udalosť')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Naozaj chcete zmazať túto udalosť?')) return
    try {
      await api.deleteCalendarEvent(id)
      loadEvents()
      if (selectedDate) {
        const key = formatDate(selectedDate)
        const remaining = (eventsByDate[key] || []).filter((e) => e.id !== id)
        if (remaining.length === 0) setSelectedDate(null)
      }
    } catch (e: any) {
      setError(e.message || 'Nepodarilo sa zmazať udalosť')
    }
  }

  const handleToggleComplete = async (ev: CalendarEvent) => {
    try {
      await api.updateCalendarEvent(ev.id, { completed: !ev.completed })
      loadEvents()
    } catch (e: any) {
      setError(e.message || 'Nepodarilo sa aktualizovať udalosť')
    }
  }

  const selectedDateEvents = selectedDate
    ? eventsByDate[formatDate(selectedDate)] || []
    : []

  return (
    <DashboardLayout>
      <div className="max-w-[1680px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Organizér</h1>
            <p className="text-muted text-sm mt-1">
              Naplánujte si mesiac: {currentMonth + 1}/{currentYear}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
            >
              Dnes
            </button>
            <button
              onClick={() => openCreateModal()}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-dark font-semibold rounded-xl hover:bg-accent-light transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Nová udalosť
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-card rounded-2xl border border-white/[0.06] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[260px]">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Vyhľadávanie..."
                className="w-full bg-white/[0.06] border border-white/[0.06] rounded-xl px-4 py-2 text-sm text-white
                  placeholder:text-white/30 focus:outline-none focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(201,169,110,0.1)]"
              />
            </div>

            <Select
              value={String(currentYear)}
              onChange={(v) => {
                setCurrentYear(Number(v))
                setSelectedDate(null)
                setFilterDate('')
              }}
              options={yearOptions}
              className="min-w-[140px]"
              placeholder="Rok"
            />

            <Select
              value={String(currentMonth)}
              onChange={(v) => {
                setCurrentMonth(Number(v))
                setSelectedDate(null)
                setFilterDate('')
              }}
              options={MONTH_OPTIONS}
              className="min-w-[180px]"
              placeholder="Mesiac"
            />

            <div className="relative">
              <button
                type="button"
                onClick={() => (filterDateOpen ? setFilterDateOpen(false) : openFilterDatePicker())}
                className={`
                  min-w-[160px] px-4 py-2 text-sm rounded-xl border transition-colors text-left
                  bg-white/[0.06] border-white/[0.06] text-white
                  hover:border-white/[0.12]
                  ${filterDateOpen ? 'border-accent/50 shadow-[0_0_0_3px_rgba(201,169,110,0.1)]' : ''}
                `}
              >
                {filterDate || 'Dátum'}
              </button>

              {filterDateOpen && (
                <div className="absolute z-50 mt-2 w-[320px] bg-popup border border-white/10 rounded-2xl shadow-xl shadow-black/40 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => {
                        const next = clampMonthYear(fdpYear, fdpMonth - 1)
                        setFdpYear(next.year)
                        setFdpMonth(next.month)
                      }}
                      className="p-2 rounded-xl hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
                      aria-label="Predchádzajúci mesiac"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="text-sm font-semibold text-white">
                      {MONTHS_SK[fdpMonth]} {fdpYear}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = clampMonthYear(fdpYear, fdpMonth + 1)
                        setFdpYear(next.year)
                        setFdpMonth(next.month)
                      }}
                      className="p-2 rounded-xl hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
                      aria-label="Nasledujúci mesiac"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 px-3 py-2 border-b border-white/[0.06]">
                    {DAYS_SK.map((d) => (
                      <div key={d} className="text-[10px] font-semibold text-muted uppercase tracking-wider text-center py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 p-3 gap-1">
                    {fdpCells.map((c, i) => {
                      const val = formatDate(c.date)
                      const isSelected = filterDate === val
                      const isToday = isSameDay(c.date, today)
                      return (
                        <button
                          key={`${val}-${i}`}
                          type="button"
                          onClick={() => selectFilterDate(c.date)}
                          className={`
                            h-9 rounded-xl text-sm font-medium transition-colors
                            ${c.inMonth ? 'text-white/80' : 'text-white/25'}
                            ${isSelected ? 'bg-accent text-dark font-bold' : 'hover:bg-white/[0.06]'}
                            ${!isSelected && isToday ? 'ring-1 ring-inset ring-accent/30 text-accent' : ''}
                          `}
                        >
                          {c.date.getDate()}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterDate('')
                        setFilterDateOpen(false)
                        setSelectedDate(null)
                      }}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      Vymazať
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date()
                        selectFilterDate(d)
                      }}
                      className="text-sm text-accent hover:underline"
                    >
                      Dnes
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Select
              value={filterType}
              onChange={(v) => setFilterType(v as any)}
              options={FILTER_TYPE_OPTIONS}
              className="min-w-[190px]"
              placeholder="Typ"
            />

            <Select
              value={filterStatus}
              onChange={(v) => setFilterStatus(v as any)}
              options={FILTER_STATUS_OPTIONS}
              className="min-w-[190px]"
              placeholder="Stav"
            />

            <button
              type="button"
              onClick={() => {
                setQuery('')
                setFilterType('all')
                setFilterStatus('all')
                setFilterDate('')
                setSelectedDate(null)
              }}
              className="px-4 py-2 text-sm rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors"
            >
              Vymazať filtre
            </button>

            <div className="ml-auto text-xs text-white/35">
              Zobrazené: <span className="text-white/60 font-semibold">{filteredCount}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-8">
          {/* Calendar grid */}
          <div className="flex-1">
            <div className="bg-card rounded-2xl border border-white/[0.06] overflow-hidden">
              {/* Month navigation */}
              <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06]">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-white">
                  {MONTHS_SK[currentMonth]} {currentYear}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-white/[0.06]">
                {DAYS_SK.map((day) => (
                  <div
                    key={day}
                    className="px-3 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7">
                {calendarCells.map((cell, idx) => {
                  const key = formatDate(cell.date)
                  const dayEvents = eventsByDate[key] || []
                  const isToday = isSameDay(cell.date, today)
                  const isSelected = selectedDate && isSameDay(cell.date, selectedDate)

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(cell.date)}
                      onDoubleClick={() => openCreateModal(cell.date)}
                      className={`
                        relative min-h-[132px] p-3 border-b border-r border-white/[0.04] text-left
                        transition-colors group
                        ${!cell.isCurrentMonth ? 'opacity-30' : ''}
                        ${isSelected ? 'bg-accent/5 ring-1 ring-inset ring-accent/30' : 'hover:bg-white/[0.02]'}
                      `}
                    >
                      <span
                        className={`
                          inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                          ${isToday ? 'bg-accent text-dark font-bold' : 'text-white/70'}
                          ${isSelected && !isToday ? 'text-accent' : ''}
                        `}
                      >
                        {cell.date.getDate()}
                      </span>

                      {/* Event dots / mini labels */}
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className={`
                              text-[11px] leading-tight px-2 py-0.5 rounded truncate font-medium
                              ${ev.completed ? 'line-through opacity-50' : ''}
                            `}
                            style={{
                              backgroundColor: `${ev.color || '#c9a96e'}22`,
                              color: ev.color || '#c9a96e',
                            }}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-muted pl-1.5">
                            +{dayEvents.length - 3} ďalšie
                          </div>
                        )}
                      </div>

                      {/* Add button on hover */}
                      {cell.isCurrentMonth && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            openCreateModal(cell.date)
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent/10 text-accent
                            flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar - selected day detail */}
          <div className="w-[380px] flex-shrink-0">
            <div className="bg-card rounded-2xl border border-white/[0.06] sticky top-8">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">
                  {selectedDate
                    ? `${selectedDate.getDate()}. ${MONTHS_SK[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
                    : 'Vyberte deň'}
                </h3>
                {selectedDate && (
                  <button
                    onClick={() => openCreateModal(selectedDate)}
                    className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-4 max-h-[700px] overflow-y-auto">
                {!selectedDate ? (
                  <p className="text-muted text-sm text-center py-8">
                    Kliknite na deň v kalendári
                  </p>
                ) : selectedDateEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 text-white/10 mx-auto mb-3" />
                    <p className="text-muted text-sm">Žiadne udalosti</p>
                    <button
                      onClick={() => openCreateModal(selectedDate)}
                      className="mt-3 text-accent text-sm hover:underline"
                    >
                      + Pridať udalosť
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateEvents.map((ev) => {
                      const TypeIcon = TYPE_CONFIG[ev.type].icon
                      return (
                        <div
                          key={ev.id}
                          className={`
                            group/event rounded-xl border transition-colors
                            ${ev.completed
                              ? 'border-white/[0.04] bg-white/[0.01] opacity-60'
                              : 'border-white/[0.06] bg-dark-50 hover:border-white/10'
                            }
                          `}
                        >
                          <div className="p-3">
                            <div className="flex items-start gap-3">
                              {/* Color bar */}
                              <div
                                className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: ev.color || '#c9a96e' }}
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <TypeIcon className={`w-3.5 h-3.5 ${TYPE_CONFIG[ev.type].color} flex-shrink-0`} />
                                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${TYPE_CONFIG[ev.type].color}`}>
                                    {TYPE_CONFIG[ev.type].label}
                                  </span>
                                </div>

                                <h4
                                  className={`text-sm font-medium text-white leading-snug ${
                                    ev.completed ? 'line-through' : ''
                                  }`}
                                >
                                  {ev.title}
                                </h4>

                                {ev.description && (
                                  <p className="text-xs text-muted mt-1 line-clamp-2">
                                    {ev.description}
                                  </p>
                                )}

                                {!ev.allDay && (
                                  <div className="flex items-center gap-1 mt-1.5 text-xs text-muted">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {formatTime(ev.date)}
                                      {ev.endDate && ` – ${formatTime(ev.endDate)}`}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover/event:opacity-100 transition-opacity">
                                {ev.type === 'TASK' && (
                                  <button
                                    onClick={() => handleToggleComplete(ev)}
                                    className={`p-1 rounded-md transition-colors ${
                                      ev.completed
                                        ? 'text-green-400 bg-green-400/10'
                                        : 'text-white/30 hover:text-green-400 hover:bg-green-400/10'
                                    }`}
                                    title={ev.completed ? 'Označiť ako nedokončené' : 'Označiť ako dokončené'}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => openEditModal(ev)}
                                  className="p-1 rounded-md text-white/30 hover:text-accent hover:bg-accent/10 transition-colors"
                                  title="Upraviť"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(ev.id)}
                                  className="p-1 rounded-md text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                  title="Zmazať"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#0a0a0a]" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-card rounded-2xl border border-white/[0.08] shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-lg font-semibold text-white">
                {editingEvent ? 'Upraviť udalosť' : 'Nová udalosť'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              {/* Type selector */}
              <div className="flex gap-2">
                {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map((t) => {
                  const cfg = TYPE_CONFIG[t]
                  const Icon = cfg.icon
                  return (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                        ${form.type === t
                          ? 'bg-accent/10 text-accent border border-accent/30'
                          : 'bg-dark-100 text-muted border border-white/[0.06] hover:border-white/10'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  Názov
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Napr. Stretnutie s klientom"
                  className="w-full px-4 py-2.5 bg-dark-100 border border-white/[0.08] rounded-xl text-white text-sm
                    placeholder:text-white/20 focus:outline-none focus:border-accent/40 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  Popis
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Voliteľný popis..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-dark-100 border border-white/[0.08] rounded-xl text-white text-sm
                    placeholder:text-white/20 focus:outline-none focus:border-accent/40 transition-colors resize-none"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    Dátum začiatku
                  </label>
                  <button
                    type="button"
                    onClick={() => openDatePicker('start')}
                    className={`
                      w-full px-4 py-2.5 text-left rounded-xl border transition-colors text-sm
                      bg-dark-100 border-white/[0.08] text-white
                      hover:border-white/[0.12]
                      ${datePickerOpen === 'start' ? 'border-accent/40 shadow-[0_0_0_3px_rgba(201,169,110,0.1)]' : ''}
                    `}
                  >
                    {form.date || 'Vybrať dátum'}
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    Dátum konca
                  </label>
                  <button
                    type="button"
                    onClick={() => openDatePicker('end')}
                    className={`
                      w-full px-4 py-2.5 text-left rounded-xl border transition-colors text-sm
                      bg-dark-100 border-white/[0.08] text-white
                      hover:border-white/[0.12]
                      ${datePickerOpen === 'end' ? 'border-accent/40 shadow-[0_0_0_3px_rgba(201,169,110,0.1)]' : ''}
                    `}
                  >
                    {form.endDate || '—'}
                  </button>
                </div>
              </div>

              {/* Date picker popover */}
              {datePickerOpen && (
                <div className="relative">
                  <div className="absolute z-50 mt-2 w-full bg-popup border border-white/10 rounded-2xl shadow-xl shadow-black/40 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => {
                          const next = clampMonthYear(dpYear, dpMonth - 1)
                          setDpYear(next.year)
                          setDpMonth(next.month)
                        }}
                        className="p-2 rounded-xl hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
                        aria-label="Predchádzajúci mesiac"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="text-sm font-semibold text-white">
                        {MONTHS_SK[dpMonth]} {dpYear}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = clampMonthYear(dpYear, dpMonth + 1)
                          setDpYear(next.year)
                          setDpMonth(next.month)
                        }}
                        className="p-2 rounded-xl hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
                        aria-label="Nasledujúci mesiac"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 px-3 py-2 border-b border-white/[0.06]">
                      {DAYS_SK.map((d) => (
                        <div key={d} className="text-[10px] font-semibold text-muted uppercase tracking-wider text-center py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 p-3 gap-1">
                      {dpCells.map((c, i) => {
                        const val = formatDate(c.date)
                        const selectedVal = datePickerOpen === 'start' ? form.date : (form.endDate || '')
                        const isSelected = selectedVal === val
                        const isToday = isSameDay(c.date, today)
                        return (
                          <button
                            key={`${val}-${i}`}
                            type="button"
                            onClick={() => selectDateFromPicker(c.date)}
                            className={`
                              h-9 rounded-xl text-sm font-medium transition-colors
                              ${c.inMonth ? 'text-white/80' : 'text-white/25'}
                              ${isSelected ? 'bg-accent text-dark font-bold' : 'hover:bg-white/[0.06]'}
                              ${!isSelected && isToday ? 'ring-1 ring-inset ring-accent/30 text-accent' : ''}
                            `}
                          >
                            {c.date.getDate()}
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => {
                          if (datePickerOpen === 'end') setForm((p) => ({ ...p, endDate: '' }))
                          setDatePickerOpen(null)
                        }}
                        className="text-sm text-white/50 hover:text-white transition-colors"
                      >
                        Vymazať
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date()
                          setDpYear(d.getFullYear())
                          setDpMonth(d.getMonth())
                          selectDateFromPicker(d)
                        }}
                        className="text-sm text-accent hover:underline"
                      >
                        Dnes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* All day toggle + time */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={form.allDay}
                    onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
                    className="w-4 h-4 rounded bg-dark-100 border-white/20 accent-accent"
                  />
                  <span className="text-sm text-white/70">Celodenná udalosť</span>
                </label>
                {!form.allDay && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">
                        Čas začiatku
                      </label>
                      <Select
                        value={form.time}
                        onChange={(v) => setForm({ ...form, time: v })}
                        options={TIME_OPTIONS}
                        placeholder="Vybrať čas"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">
                        Čas konca
                      </label>
                      <Select
                        value={form.endTime}
                        onChange={(v) => setForm({ ...form, endTime: v })}
                        options={TIME_OPTIONS}
                        placeholder="Vybrať čas"
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs font-medium text-muted mb-2">
                  Farba
                </label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setForm({ ...form, color: c.value })}
                      title={c.label}
                      className={`
                        w-7 h-7 rounded-full transition-all
                        ${form.color === c.value ? 'ring-2 ring-offset-2 ring-offset-card scale-110' : 'hover:scale-110'}
                      `}
                      style={{
                        backgroundColor: c.value,
                        ...(form.color === c.value ? { boxShadow: `0 0 0 2px ${c.value}, 0 0 0 4px rgba(0,0,0,0.35)` } : {}),
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors"
              >
                Zrušiť
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="px-5 py-2 bg-accent text-dark font-semibold rounded-xl hover:bg-accent-light transition-colors text-sm
                  disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && (
                  <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                )}
                {editingEvent ? 'Uložiť zmeny' : 'Vytvoriť'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
