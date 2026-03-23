'use client'

import type { Filter } from '@inzertna-platforma/shared'

type SpecValues = Record<string, unknown>

function rangeValue(v: unknown): { min: string; max: string } {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>
    return {
      min: o.min != null ? String(o.min) : '',
      max: o.max != null ? String(o.max) : '',
    }
  }
  return { min: '', max: '' }
}

export default function CategorySpecificationsForm({
  filters,
  values,
  onChange,
}: {
  filters: Filter[]
  values: SpecValues
  onChange: (slug: string, value: unknown) => void
}) {
  if (filters.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center text-sm text-gray-600">
        Pre túto kategóriu zatiaľ nie sú definované špecifikácie. Môžete pokračovať k základným údajom inzerátu.
        <p className="mt-2 text-xs text-gray-500">
          V <strong>admin paneli</strong> otvorte vľavo <strong>Špecifikácie</strong> (alebo pri kategórii v zozname kliknite
          „Upraviť“ v stĺpci špecifikácií).
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {filters.map((f) => {
        const id = `spec-${f.slug}`
        const commonLabel = (
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-800">
            {f.name}
            {f.isRequired ? <span className="text-red-500"> *</span> : null}
          </label>
        )

        if (f.type === 'TEXT') {
          return (
            <div key={f.id} className={f.description ? 'sm:col-span-2' : ''}>
              {commonLabel}
              {f.description ? (
                <p className="mb-1.5 text-xs text-gray-500">{f.description}</p>
              ) : null}
              <input
                id={id}
                type="text"
                value={values[f.slug] != null ? String(values[f.slug]) : ''}
                onChange={(e) => onChange(f.slug, e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-[#1dbf73] focus:outline-none focus:ring-2 focus:ring-[#1dbf73]/30"
                placeholder={f.description || ''}
              />
            </div>
          )
        }

        if (f.type === 'NUMBER') {
          return (
            <div key={f.id}>
              {commonLabel}
              {f.description ? <p className="mb-1.5 text-xs text-gray-500">{f.description}</p> : null}
              <input
                id={id}
                type="number"
                step="any"
                value={values[f.slug] != null && values[f.slug] !== '' ? String(values[f.slug]) : ''}
                onChange={(e) => onChange(f.slug, e.target.value === '' ? '' : e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#1dbf73] focus:outline-none focus:ring-2 focus:ring-[#1dbf73]/30"
              />
            </div>
          )
        }

        if (f.type === 'BOOLEAN') {
          const v = values[f.slug]
          const sel =
            v === true || v === 'true' ? 'true' : v === false || v === 'false' ? 'false' : ''
          return (
            <div key={f.id}>
              {commonLabel}
              {f.description ? <p className="mb-1.5 text-xs text-gray-500">{f.description}</p> : null}
              <select
                id={id}
                value={sel}
                onChange={(e) => {
                  const x = e.target.value
                  if (x === '') onChange(f.slug, undefined)
                  else onChange(f.slug, x === 'true')
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#1dbf73] focus:outline-none focus:ring-2 focus:ring-[#1dbf73]/30"
              >
                {!f.isRequired ? <option value="">— zvoliť —</option> : null}
                <option value="true">Áno</option>
                <option value="false">Nie</option>
              </select>
            </div>
          )
        }

        if (f.type === 'DATE') {
          return (
            <div key={f.id}>
              {commonLabel}
              {f.description ? <p className="mb-1.5 text-xs text-gray-500">{f.description}</p> : null}
              <input
                id={id}
                type="date"
                value={values[f.slug] != null ? String(values[f.slug]).slice(0, 10) : ''}
                onChange={(e) => onChange(f.slug, e.target.value || undefined)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#1dbf73] focus:outline-none focus:ring-2 focus:ring-[#1dbf73]/30"
              />
            </div>
          )
        }

        if (f.type === 'SELECT') {
          return (
            <div key={f.id}>
              {commonLabel}
              {f.description ? <p className="mb-1.5 text-xs text-gray-500">{f.description}</p> : null}
              <select
                id={id}
                value={values[f.slug] != null ? String(values[f.slug]) : ''}
                onChange={(e) => onChange(f.slug, e.target.value || undefined)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#1dbf73] focus:outline-none focus:ring-2 focus:ring-[#1dbf73]/30"
              >
                <option value="">{f.isRequired ? '— vyberte —' : '— voliteľné —'}</option>
                {f.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )
        }

        if (f.type === 'MULTISELECT') {
          const selected = Array.isArray(values[f.slug])
            ? (values[f.slug] as string[])
            : typeof values[f.slug] === 'string' && values[f.slug]
              ? [String(values[f.slug])]
              : []
          const toggle = (opt: string) => {
            const next = selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]
            onChange(f.slug, next.length ? next : undefined)
          }
          return (
            <div key={f.id} className="sm:col-span-2">
              {commonLabel}
              {f.description ? <p className="mb-1.5 text-xs text-gray-500">{f.description}</p> : null}
              <div className="flex flex-wrap gap-2">
                {f.options.map((opt) => (
                  <label
                    key={opt}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      selected.includes(opt)
                        ? 'border-[#1dbf73] bg-[#1dbf73]/10 text-gray-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected.includes(opt)}
                      onChange={() => toggle(opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          )
        }

        if (f.type === 'RANGE') {
          const { min, max } = rangeValue(values[f.slug])
          const setRange = (nextMin: string, nextMax: string) => {
            if (nextMin === '' && nextMax === '') onChange(f.slug, undefined)
            else
              onChange(f.slug, {
                ...(nextMin !== '' ? { min: nextMin } : {}),
                ...(nextMax !== '' ? { max: nextMax } : {}),
              })
          }
          return (
            <div key={f.id} className="sm:col-span-2">
              {commonLabel}
              {f.description ? <p className="mb-1.5 text-xs text-gray-500">{f.description}</p> : null}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-[140px] flex-1 items-center gap-2">
                  <span className="text-xs text-gray-500">Od</span>
                  <input
                    type="number"
                    step="any"
                    value={min}
                    onChange={(e) => setRange(e.target.value, max)}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#1dbf73] focus:outline-none focus:ring-2 focus:ring-[#1dbf73]/30"
                  />
                </div>
                <div className="flex min-w-[140px] flex-1 items-center gap-2">
                  <span className="text-xs text-gray-500">Do</span>
                  <input
                    type="number"
                    step="any"
                    value={max}
                    onChange={(e) => setRange(min, e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#1dbf73] focus:outline-none focus:ring-2 focus:ring-[#1dbf73]/30"
                  />
                </div>
              </div>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
