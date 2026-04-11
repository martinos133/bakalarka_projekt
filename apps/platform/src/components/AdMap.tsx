'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { SK_CENTER, SK_DEFAULT_ZOOM, SK_BOUNDS } from '@/lib/mapRegions'
import 'leaflet/dist/leaflet.css'

function formatPriceSk(price: number): string {
  return `${price.toLocaleString('sk-SK', {
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  })} €`
}

/** Špendlík bez štítka (cena je v popup) – vybraný stav je tmavší accent, stále v značke */
function createPinIcon(isSelected: boolean) {
  const fill = isSelected ? '#a8884e' : '#c9a96e'
  return L.divIcon({
    className: 'ad-map-pin-root',
    html: `
      <div class="ad-map-pin ${isSelected ? 'ad-map-pin--selected' : ''}">
        <svg class="ad-map-pin-svg" viewBox="0 0 32 42" width="34" height="44" aria-hidden="true">
          <path fill="${fill}" stroke="#ffffff" stroke-width="2"
            d="M16 2C9.4 2 4 7.2 4 13.5c0 8.2 12 24.5 12 24.5s12-16.3 12-24.5C28 7.2 22.6 2 16 2z"/>
          <circle cx="16" cy="14" r="4" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [1, -40],
  })
}

export interface MapPoint {
  id: string
  title: string
  location: string | null
  price: number | null
  image: string | null
  category: { id: string; name: string; slug: string } | null
  lat: number
  lng: number
}

function popupContent(ad: MapPoint): string {
  const img = ad.image
    ? `<img src="${escapeHtml(ad.image)}" alt="" class="ad-map-popup-img" />`
    : `<div class="ad-map-popup-placeholder" role="img" aria-label="Bez fotografie">
         <span class="ad-map-popup-placeholder-text">Bez fotografie</span>
       </div>`
  const cat = ad.category ? `<span class="ad-map-popup-cat">${escapeHtml(ad.category.name)}</span>` : ''
  const loc = ad.location
    ? `<p class="ad-map-popup-loc"><span class="ad-map-popup-loc-icon" aria-hidden="true">📍</span> ${escapeHtml(ad.location)}</p>`
    : ''
  const price =
    ad.price != null
      ? `<p class="ad-map-popup-price">${escapeHtml(formatPriceSk(ad.price))}</p>`
      : '<p class="ad-map-popup-price ad-map-popup-price--muted">Cena na vyžiadanie</p>'
  const link = `<a href="/inzerat/${ad.id}" class="ad-map-popup-link">Otvoriť detail inzerátu<span class="ad-map-popup-link-arrow" aria-hidden="true"> →</span></a>`
  return `
    <div class="ad-map-popup-card">
      <p class="ad-map-popup-kicker">Rýchly náhľad</p>
      <div class="ad-map-popup-img-wrap">${img}</div>
      <div class="ad-map-popup-body">
        ${cat}
        <h3 class="ad-map-popup-title">${escapeHtml(ad.title)}</h3>
        ${loc}
        ${price}
        ${link}
      </div>
    </div>
  `
}

function escapeHtml(s: string): string {
  const el = document.createElement('div')
  el.textContent = s
  return el.innerHTML
}

export interface AdMapProps {
  points: MapPoint[]
  selectedPointId?: string | null
  onMarkerClick?: (id: string) => void
}

export default function AdMap({ points, selectedPointId, onMarkerClick }: AdMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const lastSelectedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const bounds = L.latLngBounds(
      L.latLng(SK_BOUNDS[0][0], SK_BOUNDS[0][1]),
      L.latLng(SK_BOUNDS[1][0], SK_BOUNDS[1][1])
    )
    const map = L.map(containerRef.current, {
      center: SK_CENTER,
      zoom: SK_DEFAULT_ZOOM,
      scrollWheelZoom: true,
      maxBounds: bounds,
      maxBoundsViscosity: 1,
    })
    map.fitBounds(bounds)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM &copy; CARTO',
    }).addTo(map)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = []
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    points.forEach((ad) => {
      const icon = createPinIcon(ad.id === selectedPointId)
      const marker = L.marker([ad.lat, ad.lng], { icon })
      marker.bindPopup(popupContent(ad), {
        className: 'ad-map-popup',
        maxWidth: 340,
        autoPanPadding: [16, 16],
      })
      marker.on('click', () => onMarkerClick?.(ad.id))
      marker.addTo(map)
      markersRef.current.push(marker)
    })
  }, [points, onMarkerClick, selectedPointId])

  // Pri zmene selectedPointId posun mapu na marker a otvor popup
  useEffect(() => {
    const map = mapRef.current
    if (!selectedPointId) {
      lastSelectedIdRef.current = null
      return
    }
    if (!map) return
    if (selectedPointId === lastSelectedIdRef.current) return
    lastSelectedIdRef.current = selectedPointId
    const idx = points.findIndex((p) => p.id === selectedPointId)
    if (idx < 0) return
    const marker = markersRef.current[idx]
    if (marker) {
      map.panTo(marker.getLatLng(), { animate: true, duration: 0.3 })
      marker.openPopup()
    }
  }, [selectedPointId, points])

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[500px] bg-dark"
    />
  )
}
