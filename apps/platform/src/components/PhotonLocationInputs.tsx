'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import {
  formatAdLocationFromPhoton,
  latLonFromPhotonPoint,
  photonFeatureSubtitle,
  photonSearchClient,
  postalCodeSearchClient,
  postcodeFromPhoton,
  type PhotonFeature,
} from '@/lib/photon'

type Field = 'location' | 'postal'

/** Zodpovedá poliam lokality v AdFormDataState (samostatný typ kvôli cyklickému importu). */
export type LocationFormSlice = {
  location: string
  postalCode: string
  mapLat: number | null
  mapLon: number | null
}

const SEARCH_DEBOUNCE_MS = 240

const PRIORITY_COUNTRIES = new Set(['SK', 'CZ'])

/** SK/CZ výsledky zoradíme na začiatok, ostatné za nimi. */
function prioritizeSK(feats: PhotonFeature[]): PhotonFeature[] {
  const priority: PhotonFeature[] = []
  const rest: PhotonFeature[] = []
  for (const f of feats) {
    if (PRIORITY_COUNTRIES.has(f.properties.countrycode ?? '')) {
      priority.push(f)
    } else {
      rest.push(f)
    }
  }
  return [...priority, ...rest]
}

export default function PhotonLocationInputs<T extends LocationFormSlice>({
  adFormData,
  setAdFormData,
  labelClass,
  inputClass,
  hintClass,
}: {
  adFormData: T
  setAdFormData: Dispatch<SetStateAction<T>>
  labelClass: string
  inputClass: string
  hintClass: string
}) {
  const [openFor, setOpenFor] = useState<Field | null>(null)
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([])
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapLocRef = useRef<HTMLDivElement>(null)
  const wrapPscRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(async (raw: string, field: Field) => {
    const trimmed = raw.trim()
    const minLen = field === 'postal' ? 3 : 2
    if (trimmed.length < minLen) {
      setSuggestions([])
      setOpenFor(null)
      return
    }
    setOpenFor(field)
    setLoading(true)
    try {
      const raw =
        field === 'postal'
          ? await postalCodeSearchClient(trimmed, 10)
          : await photonSearchClient(trimmed, 10)
      const feats = field === 'location' ? prioritizeSK(raw) : raw
      setSuggestions(feats)
      setHighlight(0)
      setOpenFor(field)
    } finally {
      setLoading(false)
    }
  }, [])

  const runSearchRef = useRef(runSearch)
  runSearchRef.current = runSearch

  const scheduleSearch = useCallback((raw: string, field: Field) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      void runSearchRef.current(raw, field)
    }, SEARCH_DEBOUNCE_MS)
  }, [])

  const applyFeature = useCallback(
    (f: PhotonFeature) => {
      const loc = formatAdLocationFromPhoton(f)
      const pc = postcodeFromPhoton(f.properties)
      const { lat, lon } = latLonFromPhotonPoint(f)
      setAdFormData((prev) => ({
        ...prev,
        location: loc || prev.location,
        postalCode: pc || prev.postalCode,
        mapLat: lat,
        mapLon: lon,
      }))
      setSuggestions([])
      setOpenFor(null)
    },
    [setAdFormData],
  )

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const t = e.target as Node
      if (wrapLocRef.current?.contains(t) || wrapPscRef.current?.contains(t)) return
      setOpenFor(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(
    () => () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    },
    [],
  )

  const onKeyDown = (field: Field, e: React.KeyboardEvent) => {
    if (openFor !== field) return
    if (e.key === 'Escape') {
      setOpenFor(null)
      return
    }
    if (suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(suggestions.length - 1, h + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(0, h - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const f = suggestions[highlight]
      if (f) applyFeature(f)
    }
  }

  const dropdownShellClass =
    'absolute left-0 right-0 top-full z-[500] mt-1 max-h-56 overflow-hidden rounded-lg border border-white/[0.12] bg-[#1a1a1a] text-sm shadow-xl ring-1 ring-black/40'

  const renderSuggestionList = (field: Field) => {
    const value = field === 'location' ? adFormData.location : adFormData.postalCode
    const minLen = field === 'postal' ? 3 : 2
    if (openFor !== field || value.trim().length < minLen) return null

    return (
      <div className={dropdownShellClass} role="listbox">
        {loading ? (
          <div className="px-3 py-2.5 text-gray-400">Vyhľadávam…</div>
        ) : suggestions.length === 0 ? (
          <div className="px-3 py-2.5 text-gray-400">Žiadne výsledky</div>
        ) : (
          <ul className="max-h-56 overflow-auto py-1" role="list">
            {suggestions.map((f, i) => {
              const main = formatAdLocationFromPhoton(f) || f.properties.name || '—'
              const sub = photonFeatureSubtitle(f)
              return (
                <li key={`${f.geometry.coordinates.join(',')}-${i}`} role="option" aria-selected={i === highlight}>
                  <button
                    type="button"
                    className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors ${
                      i === highlight ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
                    }`}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => applyFeature(f)}
                  >
                    <span className="font-medium text-white">{main}</span>
                    {sub ? <span className="text-xs text-gray-500">{sub}</span> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  const handleFieldChange = (field: Field, value: string) => {
    if (field === 'location') {
      setAdFormData((prev) => ({ ...prev, location: value, mapLat: null, mapLon: null }))
    } else {
      setAdFormData((prev) => ({ ...prev, postalCode: value, mapLat: null, mapLon: null }))
    }
    const t = value.trim()
    const minLen = field === 'postal' ? 3 : 2
    if (t.length >= minLen) {
      setOpenFor(field)
      setSuggestions([])
      setLoading(true)
    } else {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      setOpenFor(null)
      setSuggestions([])
      setLoading(false)
    }
    scheduleSearch(value, field)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="relative" ref={wrapLocRef}>
        <label className={labelClass}>Lokalita</label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            autoComplete="off"
            value={adFormData.location}
            onChange={(e) => handleFieldChange('location', e.target.value)}
            onFocus={() => {
              if (adFormData.location.trim().length >= 2) void runSearch(adFormData.location, 'location')
            }}
            onKeyDown={(e) => onKeyDown('location', e)}
            className={`${inputClass} pl-10`}
            placeholder="Začnite písať mesto alebo adresu…"
          />
          {loading && openFor === 'location' ? (
            <span className="pointer-events-none absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-xs text-gray-500">
              …
            </span>
          ) : null}
          {renderSuggestionList('location')}
        </div>
        <p className={hintClass}>
          Vyhľadávanie cez Photon – po výbere sa doplní PSČ a presnejšia poloha na mape.
        </p>
      </div>

      <div className="relative" ref={wrapPscRef}>
        <label className={labelClass}>PSČ</label>
        <div className="relative">
          <input
            type="text"
            autoComplete="off"
            value={adFormData.postalCode}
            onChange={(e) => handleFieldChange('postal', e.target.value)}
            onFocus={() => {
              if (adFormData.postalCode.trim().length >= 3) void runSearch(adFormData.postalCode, 'postal')
            }}
            onKeyDown={(e) => onKeyDown('postal', e)}
            className={inputClass}
            placeholder="Napríklad: 811 01"
          />
          {loading && openFor === 'postal' ? (
            <span className="pointer-events-none absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-xs text-gray-500">
              …
            </span>
          ) : null}
          {renderSuggestionList('postal')}
        </div>
        <p className={hintClass}>Zadajte PSČ – po výbere sa doplní aj lokalita.</p>
      </div>
    </div>
  )
}
