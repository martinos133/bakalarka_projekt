'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Check,
  ChevronDown,
  ChevronRight,
  ImageOff,
  Info,
  Layers,
  MapPin,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { getCoordsFromLocation } from '@/lib/mapRegions'

const AdMap = dynamic(() => import('@/components/AdMap'), { ssr: false })

interface MapAd {
  id: string
  title: string
  location: string | null
  latitude: number | null
  longitude: number | null
  type: string
  price: number | null
  image: string | null
  category: { id: string; name: string; slug: string } | null
}

type SelectOption = { value: string; label: string }

function formatPriceSk(price: number): string {
  return `${price.toLocaleString('sk-SK', {
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  })} €`
}

function ProSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [])

  const selected = options.find((opt) => opt.value === value) || options[0]

  return (
    <div ref={rootRef}>
      <label htmlFor={id} className="block text-xs font-medium text-gray-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white shadow-sm outline-none transition-all flex items-center justify-between gap-3 ${
            open
              ? 'border-[#1dbf73] ring-2 ring-[#1dbf73]/20'
              : 'border-gray-200 hover:border-gray-300 text-gray-900'
          }`}
        >
          <span className="truncate">{selected?.label || ''}</span>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>

        {open && (
          <div className="absolute z-[1200] mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5 overflow-hidden">
            <ul role="listbox" className="max-h-64 overflow-auto py-1">
              {options.map((opt) => {
                const active = opt.value === value
                return (
                  <li key={`${id}-${opt.value}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(opt.value)
                        setOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors ${
                        active
                          ? 'bg-[#1dbf73]/10 text-[#0f7f4f] font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {active && <Check className="w-4 h-4 shrink-0" aria-hidden />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MapPage() {
  const [categoryId, setCategoryId] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [list, setList] = useState<MapAd[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    api
      .getCategories()
      .then((data: any[]) => {
        const flat = (data || []).flatMap((c) =>
          c.children && c.children.length
            ? [{ id: c.id, name: c.name, slug: c.slug }, ...(c.children || [])]
            : [{ id: c.id, name: c.name, slug: c.slug }],
        )
        const uniq = new Map<string, { id: string; name: string; slug: string }>()
        flat.forEach((c) => {
          if (!uniq.has(c.id)) uniq.set(c.id, c)
        })
        setCategories(Array.from(uniq.values()))
      })
      .catch(() => [])
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .getAdvertisementsForMap({
        categoryId: categoryId || undefined,
        type: typeFilter || undefined,
        region: regionFilter.trim() || undefined,
      })
      .then((data) => {
        if (!cancelled) setList(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setList([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [categoryId, typeFilter, regionFilter])

  const points = useMemo(() => {
    return list
      .map((ad) => {
        let lat: number | null = null
        let lng: number | null = null
        if (ad.latitude != null && ad.longitude != null) {
          lat = ad.latitude
          lng = ad.longitude
        } else {
          const coords = getCoordsFromLocation(ad.location)
          if (coords) {
            lat = coords[0]
            lng = coords[1]
          }
        }
        if (lat == null || lng == null) return null
        return { ...ad, lat, lng }
      })
      .filter((p): p is MapAd & { lat: number; lng: number } => p != null)
  }, [list])

  const notOnMapCount = Math.max(0, list.length - points.length)
  const hasActiveFilters = Boolean(categoryId || typeFilter || regionFilter)
  const categoryOptions = useMemo<SelectOption[]>(
    () => [{ value: '', label: 'Všetky kategórie' }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    [categories],
  )
  const typeOptions: SelectOption[] = [
    { value: '', label: 'Služby aj prenájom' },
    { value: 'SERVICE', label: 'Iba služby' },
    { value: 'RENTAL', label: 'Iba prenájom' },
  ]
  const regionOptions: SelectOption[] = [
    { value: '', label: 'Všetky kraje' },
    { value: 'Bratislava', label: 'Bratislavský' },
    { value: 'Trnava', label: 'Trnavský' },
    { value: 'Trenčín', label: 'Trenčiansky' },
    { value: 'Nitra', label: 'Nitriansky' },
    { value: 'Žilina', label: 'Žilinský' },
    { value: 'Banská Bystrica', label: 'Banskobystrický' },
    { value: 'Prešov', label: 'Prešovský' },
    { value: 'Košice', label: 'Košický' },
  ]

  return (
    <div className="min-h-screen bg-[#f6f7f9] flex flex-col">
      <Header />
      <CategoryNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <nav className="mb-6" aria-label="Drobečková navigácia">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-[#1dbf73] transition-colors">
                Domov
              </Link>
            </li>
            <li aria-hidden="true" className="text-gray-300">
              /
            </li>
            <li className="text-gray-900 font-medium">Mapa inzerátov</li>
          </ol>
        </nav>

        <header className="relative mb-8 rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm overflow-hidden">
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-[#1dbf73]/[0.07]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-emerald-500/[0.06]"
            aria-hidden="true"
          />
          <div className="relative max-w-3xl">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1dbf73] mb-3">
              <MapPin className="w-3.5 h-3.5" aria-hidden />
              Prehľad podľa lokality
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight text-balance">
              Mapa inzerátov
            </h1>
            <p className="mt-3 text-base sm:text-lg text-gray-600 leading-relaxed">
              Objavte služby a ponuky na prenájom priamo na mape Slovenska. Filtrujte podľa kategórie, typu
              inzerátu alebo kraja – výsledky sa okamžite prekreslia a zodpovedajúcim bodom na mape.
            </p>
            <ul className="mt-5 grid sm:grid-cols-3 gap-3 text-sm text-gray-600">
              <li className="flex gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                <Sparkles className="w-4 h-4 text-[#1dbf73] shrink-0 mt-0.5" aria-hidden />
                <span>
                  <span className="font-medium text-gray-800">Kliknite na špendlík</span> – zobrazí sa náhľad
                  inzerátu s odkazom na detail.
                </span>
              </li>
              <li className="flex gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                <Layers className="w-4 h-4 text-[#1dbf73] shrink-0 mt-0.5" aria-hidden />
                <span>
                  <span className="font-medium text-gray-800">Zoznam vpravo</span> je synchronizovaný s mapou –
                  výber zvýrazní príslušný bod.
                </span>
              </li>
              <li className="flex gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                <Info className="w-4 h-4 text-[#1dbf73] shrink-0 mt-0.5" aria-hidden />
                <span>
                  Inzeráty <span className="font-medium text-gray-800">bez miesta alebo súradníc</span> v zozname
                  ostávajú, na mape sa nezobrazia.
                </span>
              </li>
            </ul>
          </div>
        </header>

        <section
          className="mb-6 rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm"
          aria-labelledby="map-filters-heading"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <div>
              <h2 id="map-filters-heading" className="text-sm font-semibold text-gray-900">
                Filtre
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Zúžte výsledky podľa toho, čo hľadáte – mapa aj zoznam sa aktualizujú automaticky.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCategoryId('')
                setTypeFilter('')
                setRegionFilter('')
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors shrink-0"
            >
              <RotateCcw className="w-4 h-4" aria-hidden />
              Resetovať filtre
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ProSelect
              id="map-filter-category"
              label="Kategória"
              value={categoryId}
              options={categoryOptions}
              onChange={setCategoryId}
            />
            <ProSelect
              id="map-filter-type"
              label="Typ inzerátu"
              value={typeFilter}
              options={typeOptions}
              onChange={setTypeFilter}
            />
            <ProSelect
              id="map-filter-region"
              label="Kraj"
              value={regionFilter}
              options={regionOptions}
              onChange={setRegionFilter}
            />
          </div>
        </section>

        {!mounted ? (
          <div className="min-h-[480px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-gray-500">
            <span className="inline-block w-8 h-8 border-2 border-gray-200 border-t-[#1dbf73] rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium">Pripravujeme mapu…</p>
          </div>
        ) : (
          <>
            {loading && (
              <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                <span className="inline-block w-3.5 h-3.5 border-2 border-gray-200 border-t-[#1dbf73] rounded-full animate-spin" />
                Načítavam inzeráty podľa zvolených filtrov…
              </p>
            )}

            <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
              <div className="lg:flex-1 min-h-[420px] lg:min-h-[580px] rounded-2xl overflow-hidden border border-gray-200/90 shadow-md bg-white ring-1 ring-black/[0.03]">
                <AdMap
                  key="sk-map"
                  points={points}
                  selectedPointId={selectedAdId}
                  onMarkerClick={(id) => setSelectedAdId(id)}
                />
              </div>

              <aside className="w-full lg:w-[400px] flex-shrink-0">
                <div className="rounded-2xl border border-gray-200/90 bg-white shadow-md overflow-hidden ring-1 ring-black/[0.03]">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-b from-gray-50/80 to-white">
                    <h2 className="font-semibold text-gray-900 text-base">Inzeráty na mape</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {points.length === 0
                        ? hasActiveFilters
                          ? 'Skúste zmeniť filtre alebo zvoliť iný kraj.'
                          : 'Zatiaľ tu nie sú žiadne inzeráty s vyznačenou polohou.'
                        : `${points.length} ${points.length === 1 ? 'inzerát je' : points.length < 5 ? 'inzeráty sú' : 'inzerátov je'} zobrazených na mape.`}
                    </p>
                    {list.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="inline-flex items-center rounded-lg bg-[#1dbf73]/10 text-[#0f766e] text-xs font-semibold px-2.5 py-1">
                          Na mape: {points.length}
                        </span>
                        <span className="inline-flex items-center rounded-lg bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1">
                          Spolu v výsledku: {list.length}
                        </span>
                        {notOnMapCount > 0 && (
                          <span
                            className="inline-flex items-center rounded-lg bg-amber-50 text-amber-800 text-xs font-medium px-2.5 py-1 border border-amber-100"
                            title="Inzeráty bez súradníc alebo rozpoznateľnej lokality"
                          >
                            Bez mapy: {notOnMapCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="max-h-[420px] lg:max-h-[540px] overflow-y-auto p-3 space-y-3">
                    {points.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
                        <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" aria-hidden />
                        <p className="text-sm font-medium text-gray-800">
                          {regionFilter
                            ? 'V tomto kraji nemáme inzeráty s polohou na mape.'
                            : 'Žiadne body na mape'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                          {regionFilter
                            ? 'Rozšírte výber kraja alebo zrušte filter – inzeráty sa musia dať presadiť na súradnice alebo známe mesto.'
                            : 'Inzerát sa na mape objaví, keď má predajca vyplnenú lokalitu (napr. Bratislava, Košice) alebo presné súradnice. Ostatné stále nájdete v bežnom vyhľadávaní.'}
                        </p>
                      </div>
                    ) : (
                      points.map((ad) => {
                        const active = selectedAdId === ad.id
                        return (
                          <article
                            key={ad.id}
                            className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                              active
                                ? 'border-[#1dbf73] bg-[#1dbf73]/[0.06] shadow-md ring-2 ring-[#1dbf73]/25'
                                : 'border-gray-100 bg-white shadow-sm hover:border-gray-200 hover:shadow'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedAdId(ad.id)}
                              className="w-full text-left p-3.5 flex gap-3.5"
                            >
                              <div className="w-[4.5rem] h-[4.5rem] rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 ring-1 ring-black/[0.04]">
                                {ad.image ? (
                                  <img
                                    src={ad.image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
                                    <ImageOff className="w-6 h-6 opacity-70" aria-hidden />
                                    <span className="text-[10px] font-medium uppercase tracking-wide">
                                      Bez fotky
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1 flex flex-col">
                                {ad.category && (
                                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                    {ad.category.name}
                                  </span>
                                )}
                                <h3 className="font-semibold text-gray-900 leading-snug mt-0.5 line-clamp-2">
                                  {ad.title}
                                </h3>
                                {ad.location && (
                                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-[#1dbf73] shrink-0" aria-hidden />
                                    {ad.location}
                                  </p>
                                )}
                                <div className="mt-auto pt-2 flex items-end justify-between gap-2">
                                  <p
                                    className={`text-sm font-bold tabular-nums ${
                                      ad.price != null ? 'text-[#1dbf73]' : 'text-gray-400 font-medium'
                                    }`}
                                  >
                                    {ad.price != null ? formatPriceSk(ad.price) : 'Cena na vyžiadanie'}
                                  </p>
                                </div>
                              </div>
                            </button>
                            <div className="px-3.5 pb-3.5 -mt-1">
                              <Link
                                href={`/inzerat/${ad.id}`}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-[#1dbf73] hover:text-[#17a062] transition-colors group"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Zobraziť inzerát
                                <ChevronRight
                                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                                  aria-hidden
                                />
                              </Link>
                            </div>
                          </article>
                        )
                      })
                    )}
                  </div>
                </div>
              </aside>
            </div>

            <footer className="mt-6 rounded-xl border border-gray-200/80 bg-white/80 px-4 py-3 sm:px-5 sm:py-4 text-sm text-gray-600 shadow-sm">
              {points.length > 0 ? (
                <p>
                  <span className="font-medium text-gray-800">Zhrnutie:</span> Na mape je{' '}
                  <strong className="text-gray-900">{points.length}</strong>{' '}
                  {points.length === 1 ? 'inzerát' : points.length < 5 ? 'inzeráty' : 'inzerátov'}
                  {notOnMapCount > 0 && list.length > 0 && (
                    <>
                      {' '}
                      Mapa zobrazuje len ponuky s rozpoznateľnou polohou; v aktuálnom výbere ich je ešte{' '}
                      <strong className="text-gray-900">{notOnMapCount}</strong> bez zobrazenia na mape.
                    </>
                  )}
                </p>
              ) : (
                <p>
                  <span className="font-medium text-gray-800">Tip:</span> Inzeráty sa na mape zobrazia po zadaní
                  mesta alebo kraja pri vytváraní ponuky. Ak ste predajca, skontrolujte, či má váš inzerát vyplnenú
                  lokalitu – zvýši to šancu, že vás zákazníci nájdu práve tu.
                </p>
              )}
            </footer>
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
