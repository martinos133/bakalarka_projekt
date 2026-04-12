import { NextRequest, NextResponse } from 'next/server'
import type { PhotonFeature } from '@/lib/photon'

/** Proxy na Photon (Komoot) + Nominatim pre PSČ – bez CORS problémov. */
export const dynamic = 'force-dynamic'

const PHOTON = 'https://photon.komoot.io/api/'
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const SK_LAT = '48.669'
const SK_LON = '19.699'

/** Nominatim výsledok → Photon-kompatibilná Feature (aby frontend nemusel rozlišovať). */
function nominatimToFeature(r: Record<string, unknown>): PhotonFeature {
  const addr = (r.address ?? {}) as Record<string, string>
  const lat = Number(r.lat)
  const lon = Number(r.lon)
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: {
      name: addr.village || addr.town || addr.city || (r.display_name as string) || '',
      city: addr.city || addr.town || undefined,
      village: addr.village || undefined,
      county: addr.county || undefined,
      state: addr.state || undefined,
      country: addr.country || undefined,
      countrycode: (addr.country_code || '').toUpperCase(),
      postcode: addr.postcode || undefined,
      street: addr.road || undefined,
      housenumber: addr.house_number || undefined,
    },
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) {
    return NextResponse.json({ type: 'FeatureCollection', features: [] })
  }
  if (q.length > 256) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 })
  }

  const mode = req.nextUrl.searchParams.get('mode')
  const limit = Math.min(15, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 8))

  if (mode === 'postalcode') {
    const postalcode = q.replace(/\s+/g, ' ')
    const url = new URL(NOMINATIM)
    url.searchParams.set('postalcode', postalcode)
    url.searchParams.set('country', 'SK')
    url.searchParams.set('format', 'json')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', String(limit))

    try {
      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'InzertnaPlatforma/1.0', Accept: 'application/json' },
        next: { revalidate: 0 },
      })
      if (!res.ok) {
        return NextResponse.json({ type: 'FeatureCollection', features: [] })
      }
      const data = (await res.json()) as Record<string, unknown>[]
      const features = Array.isArray(data) ? data.map(nominatimToFeature) : []
      return NextResponse.json({ type: 'FeatureCollection', features })
    } catch {
      return NextResponse.json({ type: 'FeatureCollection', features: [] })
    }
  }

  const allowedLang = new Set(['default', 'de', 'en', 'fr'])
  const rawLang = req.nextUrl.searchParams.get('lang') || 'default'
  const lang = allowedLang.has(rawLang) ? rawLang : 'default'
  const lat = req.nextUrl.searchParams.get('lat') || SK_LAT
  const lon = req.nextUrl.searchParams.get('lon') || SK_LON

  const url = new URL(PHOTON)
  url.searchParams.set('q', q)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('lang', lang)
  url.searchParams.set('lat', lat)
  url.searchParams.set('lon', lon)

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      return NextResponse.json(
        { type: 'FeatureCollection', features: [], error: res.statusText },
        { status: 200 },
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ type: 'FeatureCollection', features: [] })
  }
}
