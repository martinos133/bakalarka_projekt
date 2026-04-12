/**
 * Približné súradnice z textu lokality (zhoda s krajom/mestom) – rovnaká logika ako platform mapRegions.
 */
const SK_REGION_COORDS: Record<string, [number, number]> = {
  bratislavský: [48.1486, 17.1077],
  bratislava: [48.1486, 17.1077],
  trnavský: [48.3944, 17.5814],
  trnava: [48.3944, 17.5814],
  trenčiansky: [48.8945, 18.0444],
  trenčín: [48.8945, 18.0444],
  nitriansky: [48.3069, 18.0842],
  nitra: [48.3069, 18.0842],
  žilinský: [49.2032, 18.7493],
  žilina: [49.2032, 18.7493],
  banskobystrický: [48.7363, 19.1461],
  'banská bystrica': [48.7363, 19.1461],
  'banska bystrica': [48.7363, 19.1461],
  prešovský: [49.0017, 21.239],
  prešov: [49.0017, 21.239],
  presov: [49.0017, 21.239],
  košický: [48.7164, 21.2611],
  košice: [48.7164, 21.2611],
  kosice: [48.7164, 21.2611],
}

const LOWER_KEYS = Object.keys(SK_REGION_COORDS)

export function getCoordsFromLocationString(location: string | null | undefined): [number, number] | null {
  if (!location || typeof location !== 'string') return null
  const lower = location.toLowerCase().trim()
  for (const key of LOWER_KEYS) {
    if (lower.includes(key)) return SK_REGION_COORDS[key]
  }
  return null
}

/** Vzdialenosť dvoch bodov na zemeguli v km (WGS84). */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
