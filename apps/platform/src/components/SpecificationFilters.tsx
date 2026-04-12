'use client'

import { useCallback, useMemo } from 'react'
import type { Filter, FilterType } from '@inzertna-platforma/shared'
import CustomSelect from '@/components/CustomSelect'

export type FilterValues = Record<string, unknown>

export function matchesFilters(
  ad: { price?: number | null; specifications?: Record<string, unknown> | null },
  filters: Filter[],
  values: FilterValues,
): boolean {
  const priceRange = values.__price as { min?: string; max?: string } | undefined
  if (priceRange) {
    const p = ad.price ?? 0
    if (priceRange.min && p < parseFloat(priceRange.min)) return false
    if (priceRange.max && p > parseFloat(priceRange.max)) return false
  }

  const specs = ad.specifications
  for (const f of filters) {
    const val = values[f.slug]
    if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0))
      continue

    const specVal = specs?.[f.slug]

    switch (f.type as FilterType) {
      case 'TEXT':
        if (typeof val === 'string' && val.trim()) {
          const sv = typeof specVal === 'string' ? specVal : ''
          if (!sv.toLowerCase().includes(val.toLowerCase())) return false
        }
        break

      case 'NUMBER': {
        const range = val as { min?: string; max?: string }
        const num = typeof specVal === 'number' ? specVal : parseFloat(String(specVal ?? ''))
        if (Number.isNaN(num)) {
          if (range.min || range.max) return false
          break
        }
        if (range.min && num < parseFloat(range.min)) return false
        if (range.max && num > parseFloat(range.max)) return false
        break
      }

      case 'SELECT':
        if (typeof val === 'string' && val) {
          if (specVal !== val) return false
        }
        break

      case 'MULTISELECT':
        if (Array.isArray(val) && val.length > 0) {
          const sv = Array.isArray(specVal) ? specVal : []
          if (!val.some((v) => sv.includes(v))) return false
        }
        break

      case 'BOOLEAN':
        if (val === true || val === 'true') {
          if (specVal !== true) return false
        }
        break

      default:
        break
    }
  }
  return true
}

type Props = {
  filters: Filter[]
  values: FilterValues
  onChange: (values: FilterValues) => void
  /** Pole inzerátov na výpočet rozsahu cien */
  advertisements?: { price?: number | null }[]
  /** Ak true, nevykreslí vlastný .card wrapper (je už vnorený v karte) */
  embedded?: boolean
}

export default function SpecificationFilters({ filters, values, onChange, advertisements, embedded }: Props) {
  const activeFilters = filters.filter((f) => f.isActive)

  const priceRange = useMemo(() => {
    if (!advertisements || advertisements.length === 0) return null
    const prices = advertisements.map((a) => a.price ?? 0).filter((p) => p > 0)
    if (prices.length === 0) return null
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }, [advertisements])

  const set = useCallback(
    (slug: string, val: unknown) => {
      onChange({ ...values, [slug]: val })
    },
    [values, onChange],
  )

  const reset = useCallback(() => {
    onChange({})
  }, [onChange])

  const hasAnyValue = Object.values(values).some(
    (v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0),
  )

  const showPrice = priceRange !== null
  if (!showPrice && activeFilters.length === 0) return null

  const content = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Filtre
        </h2>
        {hasAnyValue && (
          <button
            type="button"
            onClick={reset}
            className="text-[10px] font-medium text-accent hover:text-accent-light transition-colors"
          >
            Zrušiť
          </button>
        )}
      </div>
      <div className="space-y-4">
        {showPrice && (
          <PriceFilter
            value={values.__price as { min?: string; max?: string } | undefined}
            onChange={(v) => set('__price', v)}
          />
        )}
        {activeFilters.map((f) => (
          <FilterField key={f.id} filter={f} value={values[f.slug]} onChange={(v) => set(f.slug, v)} />
        ))}
      </div>
    </>
  )

  if (embedded) {
    return (
      <div className="border-t border-white/[0.08] p-4">
        {content}
      </div>
    )
  }

  return (
    <div className="card mt-4 p-4 shadow-md shadow-black/10">
      {content}
    </div>
  )
}

function PriceFilter({
  value,
  onChange,
}: {
  value: { min?: string; max?: string } | undefined
  onChange: (v: unknown) => void
}) {
  const v = value ?? {}
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/50">Cena (€)</label>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-white/35">
            Od
          </span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Od"
            aria-label="Cena od"
            value={v.min ?? ''}
            onChange={(e) => {
              const next = { ...v, min: e.target.value || undefined }
              if (!next.min && !next.max) onChange(undefined)
              else onChange(next)
            }}
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/25"
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-white/35">
            Do
          </span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Do"
            aria-label="Cena do"
            value={v.max ?? ''}
            onChange={(e) => {
              const next = { ...v, max: e.target.value || undefined }
              if (!next.min && !next.max) onChange(undefined)
              else onChange(next)
            }}
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/25"
          />
        </div>
      </div>
    </div>
  )
}

function FilterField({
  filter,
  value,
  onChange,
}: {
  filter: Filter
  value: unknown
  onChange: (v: unknown) => void
}) {
  const type = filter.type as FilterType

  if (type === 'BOOLEAN') {
    const checked = value === true || value === 'true'
    return (
      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-0.5 text-sm transition-colors hover:bg-white/[0.04]">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked || undefined)}
          className="sr-only"
        />
        <span
          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors ${
            checked
              ? 'border-accent bg-accent text-dark'
              : 'border-white/20 bg-white/[0.06]'
          }`}
        >
          {checked && (
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span className="text-white/80">{filter.name}</span>
      </label>
    )
  }

  if (type === 'SELECT') {
    const selected = typeof value === 'string' ? value : ''
    const selectOptions = [
      { value: '', label: 'Všetky' },
      ...filter.options.map((opt) => ({ value: opt, label: opt })),
    ]
    return (
      <div>
        <label
          htmlFor={`filter-select-${filter.slug}`}
          className="mb-1.5 block text-xs font-medium text-white/50"
        >
          {filter.name}
        </label>
        <CustomSelect
          id={`filter-select-${filter.slug}`}
          value={selected}
          onChange={(v) => onChange(v === '' ? undefined : v)}
          options={selectOptions}
          placeholder="Všetky"
        />
      </div>
    )
  }

  if (type === 'MULTISELECT') {
    const selected = Array.isArray(value) ? (value as string[]) : []
    const toggle = (opt: string) => {
      const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]
      onChange(next.length > 0 ? next : undefined)
    }
    return (
      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">{filter.name}</label>
        <div className="space-y-1">
          {filter.options.map((opt) => {
            const isOn = selected.includes(opt)
            return (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 text-sm transition-colors hover:bg-white/[0.04]"
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggle(opt)}
                  className="sr-only"
                />
                <span
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors ${
                    isOn
                      ? 'border-accent bg-accent text-dark'
                      : 'border-white/20 bg-white/[0.06]'
                  }`}
                >
                  {isOn && (
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-white/80">{opt}</span>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  if (type === 'NUMBER' || type === 'RANGE') {
    const range = (value as { min?: string; max?: string }) ?? {}
    return (
      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">{filter.name}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Od"
            value={range.min ?? ''}
            onChange={(e) => {
              const next = { ...range, min: e.target.value || undefined }
              if (!next.min && !next.max) onChange(undefined)
              else onChange(next)
            }}
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/25"
          />
          <span className="text-xs text-white/30">–</span>
          <input
            type="number"
            placeholder="Do"
            value={range.max ?? ''}
            onChange={(e) => {
              const next = { ...range, max: e.target.value || undefined }
              if (!next.min && !next.max) onChange(undefined)
              else onChange(next)
            }}
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/25"
          />
        </div>
      </div>
    )
  }

  if (type === 'TEXT') {
    const txt = typeof value === 'string' ? value : ''
    return (
      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">{filter.name}</label>
        <input
          type="text"
          placeholder={`Hľadať ${filter.name.toLowerCase()}…`}
          value={txt}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/25"
        />
      </div>
    )
  }

  return null
}
