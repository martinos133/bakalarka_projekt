'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { SK_CENTER, SK_DEFAULT_ZOOM, SK_BOUNDS } from '@/lib/mapRegions'
import 'leaflet/dist/leaflet.css'

/** Pekný marker – zelený bod s tieňom a bielym obrysom */
function createDotIcon() {
  return L.divIcon({
    className: 'ad-map-dot',
    html: `
      <span class="ad-map-marker-inner">
        <span class="ad-map-marker-pulse"></span>
      </span>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
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
    ? `<img src="${ad.image}" alt="" class="ad-map-popup-img" />`
    : '<div class="ad-map-popup-placeholder"></div>'
  const cat = ad.category ? `<span class="ad-map-popup-cat">${escapeHtml(ad.category.name)}</span>` : ''
  const loc = ad.location ? `<p class="ad-map-popup-loc">📍 ${escapeHtml(ad.location)}</p>` : ''
  const price =
    ad.price != null
      ? `<p class="ad-map-popup-price">${ad.price.toFixed(2)} €</p>`
      : ''
  const link = `<a href="/inzerat/${ad.id}" class="ad-map-popup-link">Zobraziť inzerát →</a>`
  return `
    <div class="ad-map-popup-card">
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
    const icon = createDotIcon()
    points.forEach((ad) => {
      const marker = L.marker([ad.lat, ad.lng], { icon })
      marker.bindPopup(popupContent(ad), { className: 'ad-map-popup' })
      marker.on('click', () => onMarkerClick?.(ad.id))
      marker.addTo(map)
      markersRef.current.push(marker)
    })
  }, [points, onMarkerClick])

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
      className="w-full h-full min-h-[500px] bg-white"
    />
  )
}
