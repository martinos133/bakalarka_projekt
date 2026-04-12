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
import { CmsGate } from '@/components/CmsGate'
import { getCoordsFromLocation } from '@/lib/mapRegions'
import {
  latLonFromPhotonPoint,
  photonSearchClient,
  postalCodeSearchClient,
  type PhotonFeature,
} from '@/lib/photon'

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
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted">
        {label}
      </label>
      <div className="relative">
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm text-white shadow-sm outline-none transition-all ${
            open
              ? 'border-accent/45 bg-card ring-2 ring-accent/20'
              : 'border-white/[0.1] bg-card hover:border-white/[0.14]'
          }`}
        >
          <span className="truncate">{selected?.label || ''}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>

        {open && (
          <div className="absolute z-[1200] mt-2 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-popup shadow-xl shadow-black/30">
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
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                        active
                          ? 'bg-accent/10 font-medium text-accent'
                          : 'text-gray-200 hover:bg-popupRowHover'
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

function MapPageInner() {
  const [categoryId, setCategoryId] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [radiusKm, setRadiusKm] = useState('')
  const [geoCenter, setGeoCenter] = useState<{ lat: number; lng: number } | null>(null)
  const geoCenterRef = useRef<{ lat: number; lng: number } | null>(null)
  const geocodedKeyRef = useRef<string>('')
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
    geoCenterRef.current = geoCenter
  }, [geoCenter])

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    const r = radiusKm ? parseFloat(radiusKm) : NaN
    const wantsRadius = Number.isFinite(r) && r > 0
    api
      .getAdvertisementsForMap(
        {
          categoryId: categoryId || undefined,
          type: typeFilter || undefined,
          region: regionFilter.trim() || undefined,
          postalCode: postalCode.trim() || undefined,
          city: city.trim() || undefined,
          ...(wantsRadius && geoCenter ? { centerLat: geoCenter.lat, centerLng: geoCenter.lng, radiusKm: r } : {}),
        },
        { signal: ac.signal },
      )
      .then((data) => {
        setList(Array.isArray(data) ? data : [])
      })
      .catch((err: Error & { name?: string }) => {
        if (ac.signal.aborted || err?.name === 'AbortError') return
        setList([])
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [categoryId, typeFilter, regionFilter, postalCode, city, radiusKm, geoCenter])

  useEffect(() => {
    const r = radiusKm ? parseFloat(radiusKm) : NaN
    if (!Number.isFinite(r) || r <= 0) {
      geoCenterRef.current = null
      setGeoCenter(null)
      geocodedKeyRef.current = ''
      return
    }
    const pc = postalCode.trim()
    const ct = city.trim()
    const q = ct || pc
    if (q.length < 2) {
      geoCenterRef.current = null
      setGeoCenter(null)
      geocodedKeyRef.current = ''
      return
    }
    const key = `${pc}|${ct}`
    if (geocodedKeyRef.current === key && geoCenterRef.current != null) {
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        let features: PhotonFeature[] = []
        if (pc.length >= 3) {
          features = await postalCodeSearchClient(pc)
        }
        if (!features.length && ct.length >= 2) {
          features = await photonSearchClient(`${ct} Slovakia`, 6)
        }
        if (!features.length && pc.length >= 3) {
          features = await photonSearchClient(`${pc} Slovakia`, 6)
        }
        if (cancelled) return
        const first = features[0]
        if (first) {
          const { lat, lon } = latLonFromPhotonPoint(first)
          const coord = { lat, lng: lon }
          geoCenterRef.current = coord
          setGeoCenter(coord)
          geocodedKeyRef.current = key
        } else {
          geoCenterRef.current = null
          setGeoCenter(null)
          geocodedKeyRef.current = ''
        }
      } catch {
        if (!cancelled) {
          geoCenterRef.current = null
          setGeoCenter(null)
          geocodedKeyRef.current = ''
        }
      }
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [postalCode, city, radiusKm])

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
  const hasActiveFilters = Boolean(
    categoryId || typeFilter || regionFilter || postalCode.trim() || city.trim() || radiusKm,
  )
  const radiusOptions: SelectOption[] = [
    { value: '', label: 'Bez obmedzenia okolia' },
    { value: '5', label: 'Okolo 5 km' },
    { value: '10', label: 'Okolo 10 km' },
    { value: '20', label: 'Okolo 20 km' },
    { value: '30', label: 'Okolo 30 km' },
    { value: '50', label: 'Okolo 50 km' },
    { value: '100', label: 'Okolo 100 km' },
  ]
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
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <CategoryNav />

      <div className="mx-auto w-full max-w-[1920px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6" aria-label="Drobečková navigácia">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <li>
              <Link href="/" className="transition-colors hover:text-accent-light">
                Domov
              </Link>
            </li>
            <li aria-hidden="true" className="text-white/25">
              /
            </li>
            <li className="font-medium text-white">Mapa inzerátov</li>
          </ol>
        </nav>

        <header className="card mb-8 overflow-hidden shadow-lg shadow-black/15">
          <div className="border-b border-white/[0.06] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-none lg:text-left">
              <p className="mb-4 inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04] shadow-sm"
                  aria-hidden
                >
                  <MapPin className="h-4 w-4 text-accent" strokeWidth={1.75} />
                </span>
                Prehľad podľa lokality
              </p>
              <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                <span className="font-serif italic text-accent">Mapa</span>{' '}
                <span className="font-sans not-italic">inzerátov</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted sm:text-base lg:mx-0">
                Objavte služby a ponuky na prenájom priamo na mape Slovenska. Filtrujte podľa kategórie, typu
                inzerátu alebo kraja – výsledky sa okamžite prekreslia spolu s bodmi na mape.
              </p>
            </div>
          </div>
          <div className="px-6 py-6 sm:px-8 sm:py-8 lg:px-10">
            <h2 className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted lg:text-left">
              Ako to funguje
            </h2>
            <ul className="grid gap-4 sm:grid-cols-3 lg:gap-5">
              <li className="flex h-full flex-col rounded-xl border border-white/[0.08] bg-dark-100/35 p-5 transition-colors hover:border-white/[0.12] hover:bg-dark-100/55">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                  <Sparkles className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-sm font-semibold text-white">Interaktívna mapa</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Kliknite na špendlík – zobrazí sa náhľad inzerátu s priamym odkazom na detail.
                </p>
              </li>
              <li className="flex h-full flex-col rounded-xl border border-white/[0.08] bg-dark-100/35 p-5 transition-colors hover:border-white/[0.12] hover:bg-dark-100/55">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                  <Layers className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-sm font-semibold text-white">Zoznam a mapa</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Zoznam vpravo je synchronizovaný s mapou – výber záznamu zvýrazní príslušný bod.
                </p>
              </li>
              <li className="flex h-full flex-col rounded-xl border border-white/[0.08] bg-dark-100/35 p-5 transition-colors hover:border-white/[0.12] hover:bg-dark-100/55">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                  <Info className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-sm font-semibold text-white">Poloha inzerátu</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Ponuky bez miesta alebo súradníc zostanú v zozname výsledkov; na mape sa nezobrazia.
                </p>
              </li>
            </ul>
          </div>
        </header>

        <section className="card mb-6 p-4 shadow-lg shadow-black/15 sm:p-5" aria-labelledby="map-filters-heading">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="map-filters-heading" className="text-sm font-semibold text-white">
                Filtre
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Zúžte výsledky podľa toho, čo hľadáte – mapa aj zoznam sa aktualizujú automaticky.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCategoryId('')
                setTypeFilter('')
                setRegionFilter('')
                setPostalCode('')
                setCity('')
                setRadiusKm('')
                geoCenterRef.current = null
                geocodedKeyRef.current = ''
                setGeoCenter(null)
              }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white"
            >
              <RotateCcw className="w-4 h-4" aria-hidden />
              Resetovať filtre
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="map-filter-psc" className="mb-1.5 block text-xs font-medium text-muted">
                PSČ
              </label>
              <input
                id="map-filter-psc"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="napr. 811 01"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-card px-3.5 py-2.5 text-sm text-white shadow-sm outline-none transition-all placeholder:text-white/35 focus:border-accent/45 focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label htmlFor="map-filter-city" className="mb-1.5 block text-xs font-medium text-muted">
                Mesto alebo obec
              </label>
              <input
                id="map-filter-city"
                type="text"
                autoComplete="address-level2"
                placeholder="napr. Bratislava"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-card px-3.5 py-2.5 text-sm text-white shadow-sm outline-none transition-all placeholder:text-white/35 focus:border-accent/45 focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <ProSelect
              id="map-filter-radius"
              label="Polomer okolia"
              value={radiusKm}
              options={radiusOptions}
              onChange={setRadiusKm}
            />
          </div>
          {radiusKm && parseFloat(radiusKm) > 0 && (
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Okolie sa počíta od stredu podľa PSČ (ak je zadané), inak podľa mesta – nie ako text v inzeráte,
              takže v kruhu uvidíte aj ponuky z iných miest (napr. Košice pri stredu v okolí Úporu). Ak nezadáte
              mesto ani PSČ, polomer sa nepoužije. Prioritné inzeráty sú navrchu.
            </p>
          )}
        </section>

        {!mounted ? (
          <div className="flex min-h-[480px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-card text-muted">
            <span className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/[0.08] border-t-accent" />
            <p className="text-sm font-medium text-white">Pripravujeme mapu…</p>
          </div>
        ) : (
          <>
            {loading && (
              <p className="mb-3 flex items-center gap-2 text-sm text-muted">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/[0.08] border-t-accent" />
                Načítavam inzeráty podľa zvolených filtrov…
              </p>
            )}

            <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
              <div className="min-h-[420px] overflow-hidden rounded-2xl border border-white/[0.06] bg-card shadow-lg shadow-black/15 lg:min-h-[580px] lg:flex-1">
                <AdMap
                  key="sk-map"
                  points={points}
                  selectedPointId={selectedAdId}
                  onMarkerClick={(id) => setSelectedAdId(id)}
                />
              </div>

              <aside className="w-full shrink-0 lg:w-[400px]">
                <div className="card overflow-hidden shadow-lg shadow-black/15">
                  <div className="border-b border-white/[0.06] px-5 py-4">
                    <h2 className="text-base font-semibold text-white">Inzeráty na mape</h2>
                    <p className="mt-1 text-sm text-muted">
                      {points.length === 0
                        ? hasActiveFilters
                          ? 'Skúste zmeniť filtre alebo zvoliť iný kraj.'
                          : 'Zatiaľ tu nie sú žiadne inzeráty s vyznačenou polohou.'
                        : `${points.length} ${points.length === 1 ? 'inzerát je' : points.length < 5 ? 'inzeráty sú' : 'inzerátov je'} zobrazených na mape.`}
                    </p>
                    {list.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-md border border-accent/35 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                          Na mape: {points.length}
                        </span>
                        <span className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-muted">
                          Spolu v výsledku: {list.length}
                        </span>
                        {notOnMapCount > 0 && (
                          <span
                            className="inline-flex items-center rounded-md border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-accent"
                            title="Inzeráty bez súradníc alebo rozpoznateľnej lokality"
                          >
                            Bez mapy: {notOnMapCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="max-h-[420px] space-y-3 overflow-y-auto p-3 lg:max-h-[540px]">
                    {points.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/[0.1] bg-dark-100/40 p-6 text-center">
                        <MapPin className="mx-auto mb-3 h-10 w-10 text-muted" aria-hidden />
                        <p className="text-sm font-medium text-white">
                          {regionFilter
                            ? 'V tomto kraji nemáme inzeráty s polohou na mape.'
                            : 'Žiadne body na mape'}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
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
                            className={`overflow-hidden rounded-xl border shadow-sm transition-all duration-200 ${
                              active
                                ? 'border-accent/50 bg-accent/[0.07] shadow-md ring-2 ring-accent/20'
                                : 'border-white/[0.06] bg-card hover:border-white/[0.12] hover:bg-cardHover'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedAdId(ad.id)}
                              className="w-full text-left p-3.5 flex gap-3.5"
                            >
                              <div className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-dark-100 ring-1 ring-black/20">
                                {ad.image ? (
                                  <img
                                    src={ad.image}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted">
                                    <ImageOff className="h-6 w-6 opacity-70" aria-hidden />
                                    <span className="text-[10px] font-medium uppercase tracking-wide">
                                      Bez fotky
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col">
                                {ad.category && (
                                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                                    {ad.category.name}
                                  </span>
                                )}
                                <h3 className="mt-0.5 line-clamp-2 font-semibold leading-snug text-white">
                                  {ad.title}
                                </h3>
                                {ad.location && (
                                  <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                                    {ad.location}
                                  </p>
                                )}
                                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                                  <p
                                    className={`text-sm font-bold tabular-nums ${
                                      ad.price != null ? 'text-accent' : 'font-medium text-muted'
                                    }`}
                                  >
                                    {ad.price != null ? formatPriceSk(ad.price) : 'Cena na vyžiadanie'}
                                  </p>
                                </div>
                              </div>
                            </button>
                            <div className="-mt-1 px-3.5 pb-3.5">
                              <Link
                                href={`/inzerat/${ad.id}`}
                                className="group inline-flex items-center gap-1 text-sm font-semibold text-accent transition-colors hover:text-accent-light"
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

            <footer className="card mt-6 px-4 py-3 text-sm text-muted shadow-lg shadow-black/15 sm:px-5 sm:py-4">
              {points.length > 0 ? (
                <p>
                  <span className="font-medium text-white">Zhrnutie:</span> Na mape je{' '}
                  <strong className="tabular-nums text-accent">{points.length}</strong>{' '}
                  {points.length === 1 ? 'inzerát' : points.length < 5 ? 'inzeráty' : 'inzerátov'}
                  {notOnMapCount > 0 && list.length > 0 && (
                    <>
                      {' '}
                      Mapa zobrazuje len ponuky s rozpoznateľnou polohou; v aktuálnom výbere ich je ešte{' '}
                      <strong className="tabular-nums text-white">{notOnMapCount}</strong> bez zobrazenia na mape.
                    </>
                  )}
                </p>
              ) : (
                <p>
                  <span className="font-medium text-white">Tip:</span> Inzeráty sa na mape zobrazia po zadaní
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

export default function MapPage() {
  return (
    <CmsGate cmsSlug="mapa">
      <MapPageInner />
    </CmsGate>
  )
}
