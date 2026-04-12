/** GeoJSON z Photon Komoot (zjednodušené typy pre frontend). */

export type PhotonProperties = {
  name?: string
  city?: string
  town?: string
  village?: string
  locality?: string
  county?: string
  state?: string
  country?: string
  countrycode?: string
  postcode?: string
  street?: string
  housenumber?: string
  district?: string
  type?: string
  osm_value?: string
}

export type PhotonFeature = {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: PhotonProperties
}

export type PhotonCollection = {
  type: 'FeatureCollection'
  features: PhotonFeature[]
}

/** Text lokality pre inzerát (mesto alebo ulica, mesto). */
export function formatAdLocationFromPhoton(f: PhotonFeature): string {
  const p = f.properties
  const city = p.city || p.town || p.village || p.locality
  if (p.street) {
    const line = [p.street, p.housenumber].filter(Boolean).join(' ')
    if (city) return `${line}, ${city}`
    return line || city || p.name || ''
  }
  if (city) return city
  return p.name || p.county || ''
}

export function photonFeatureSubtitle(f: PhotonFeature): string {
  const p = f.properties
  const parts = [p.postcode, p.state, p.country].filter(Boolean)
  return parts.join(' · ')
}

/** PSČ z Photon (normalizácia medzier). */
export function postcodeFromPhoton(p: PhotonProperties): string {
  const raw = p.postcode?.trim()
  if (!raw) return ''
  return raw.replace(/\s+/g, ' ')
}

/** GeoJSON: coordinates sú [lon, lat]. */
export function latLonFromPhotonPoint(f: PhotonFeature): { lat: number; lon: number } {
  const [lon, lat] = f.geometry.coordinates
  return { lat, lon }
}

export async function photonSearchClient(q: string, limit = 8): Promise<PhotonFeature[]> {
  const trimmed = q.trim()
  if (trimmed.length < 2) return []
  const params = new URLSearchParams({ q: trimmed, limit: String(limit), lang: 'default' })
  const res = await fetch(`/api/photon/search?${params.toString()}`)
  if (!res.ok) return []
  const data = (await res.json()) as PhotonCollection
  return Array.isArray(data.features) ? data.features : []
}

/** Hľadanie podľa PSČ cez Nominatim (presné výsledky pre SK). */
export async function postalCodeSearchClient(postalCode: string, limit = 8): Promise<PhotonFeature[]> {
  const trimmed = postalCode.trim()
  if (trimmed.length < 3) return []
  const params = new URLSearchParams({ q: trimmed, limit: String(limit), mode: 'postalcode' })
  const res = await fetch(`/api/photon/search?${params.toString()}`)
  if (!res.ok) return []
  const data = (await res.json()) as PhotonCollection
  return Array.isArray(data.features) ? data.features : []
}
