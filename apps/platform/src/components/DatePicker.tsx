'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar } from 'lucide-react'
import { DayPicker, getDefaultClassNames, type DateRange } from 'react-day-picker'
import { sk } from 'date-fns/locale'
import { format } from 'date-fns'
import type { Matcher } from 'react-day-picker'

import 'react-day-picker/style.css'

type CommonProps = {
  label?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  /** YYYY-MM-DD – dni nedostupné (obsadené / blok), zobrazia sa ako obsadené a nie je ich možné vybrať */
  occupiedDays?: string[]
}

type SingleProps = CommonProps & {
  mode: 'single'
  value: Date | undefined
  onChange: (value: Date | undefined) => void
}

type RangeProps = CommonProps & {
  mode: 'range'
  value: DateRange | undefined
  onChange: (value: DateRange | undefined) => void
}

type Props = SingleProps | RangeProps

const defaults = getDefaultClassNames()

/** Merge default rdp class with extra tailwind classes. */
function cx(key: keyof typeof defaults, extra: string) {
  return `${defaults[key]} ${extra}`
}

const classNames = {
  root: cx('root', 'rdp-dark'),
  months: cx('months', ''),
  month: cx('month', ''),
  month_caption: cx('month_caption', ''),
  caption_label: cx('caption_label', ''),
  nav: cx('nav', ''),
  button_previous: cx('button_previous', ''),
  button_next: cx('button_next', ''),
  chevron: cx('chevron', ''),
  month_grid: cx('month_grid', ''),
  weekdays: cx('weekdays', ''),
  weekday: cx('weekday', ''),
  weeks: cx('weeks', ''),
  week: cx('week', ''),
  day: cx('day', ''),
  day_button: cx('day_button', ''),
  today: cx('today', ''),
  selected: cx('selected', ''),
  outside: cx('outside', ''),
  disabled: cx('disabled', ''),
  hidden: cx('hidden', ''),
  range_start: cx('range_start', ''),
  range_end: cx('range_end', ''),
  range_middle: cx('range_middle', ''),
  focused: cx('focused', ''),
}

export default function DatePicker(props: Props) {
  const { label, className = '', disabled, minDate, occupiedDays } = props
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const displayValue = useMemo(() => {
    if (props.mode === 'single') {
      return props.value ? format(props.value, 'dd.MM.yyyy', { locale: sk }) : ''
    }
    const from = props.value?.from
    const to = props.value?.to
    if (!from && !to) return ''
    if (from && !to) return `${format(from, 'dd.MM.yyyy', { locale: sk })} –`
    if (from && to) {
      return `${format(from, 'dd.MM.yyyy', { locale: sk })} – ${format(to, 'dd.MM.yyyy', { locale: sk })}`
    }
    return ''
  }, [props])

  const occKey = occupiedDays?.length ? occupiedDays.join('|') : ''

  const disabledMatchers: Matcher | Matcher[] | undefined = useMemo(() => {
    const occ = new Set(occupiedDays ?? [])
    const parts: Matcher[] = []
    if (minDate) parts.push({ before: minDate })
    if (occ.size) parts.push((d: Date) => occ.has(format(d, 'yyyy-MM-dd')))
    if (parts.length === 0) return undefined
    if (parts.length === 1) return parts[0]
    return parts
  }, [minDate, occKey])

  const modifiers = useMemo(() => {
    const occ = new Set(occupiedDays ?? [])
    if (!occ.size) return undefined
    return {
      occupied: (d: Date) => occ.has(format(d, 'yyyy-MM-dd')),
    }
  }, [occKey])

  const modifiersClassNames = { occupied: 'rdp-day_occupied' }

  return (
    <div ref={rootRef} className={`w-full ${className}`}>
      {label && (
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
          disabled
            ? 'cursor-not-allowed border-white/[0.08] bg-white/[0.04] text-gray-500'
            : 'border-white/[0.12] bg-white/[0.06] text-white hover:border-white/[0.2] focus:border-[#c9a96e]/60 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/25'
        }`}
      >
        <span className={displayValue ? 'text-white' : 'text-gray-500'}>
          {displayValue || 'Vyberte dátum'}
        </span>
        <Calendar className="h-4 w-4 text-gray-500" />
      </button>

      {open && (
        <div className="relative">
          <div className="absolute z-50 mt-2 rounded-xl border border-white/[0.08] bg-[#1a1a1a] p-4 shadow-2xl shadow-black/40">
            {props.mode === 'single' ? (
              <DayPicker
                mode="single"
                selected={props.value}
                onSelect={(d) => {
                  props.onChange(d)
                }}
                locale={sk}
                weekStartsOn={1}
                showOutsideDays
                disabled={disabledMatchers}
                modifiers={modifiers}
                modifiersClassNames={modifiers ? modifiersClassNames : undefined}
                classNames={classNames}
              />
            ) : (
              <DayPicker
                mode="range"
                required={false}
                selected={props.value}
                onSelect={(r) => {
                  props.onChange(r)
                }}
                locale={sk}
                weekStartsOn={1}
                showOutsideDays
                disabled={disabledMatchers}
                modifiers={modifiers}
                modifiersClassNames={modifiers ? modifiersClassNames : undefined}
                classNames={classNames}
              />
            )}

            {occupiedDays && occupiedDays.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                Sivé / červené dni sú obsadené – nie je možné ich vybrať.
              </p>
            )}

            <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/[0.06] pt-3">
              <button
                type="button"
                className="rounded-lg border border-white/[0.12] bg-transparent px-3 py-2 text-xs font-medium text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                onClick={() => setOpen(false)}
              >
                Zavrieť
              </button>
              <button
                type="button"
                disabled={
                  props.mode === 'single'
                    ? !props.value
                    : !props.value?.from || !props.value?.to
                }
                className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-dark transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-45"
                onClick={() => setOpen(false)}
              >
                Použiť
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
