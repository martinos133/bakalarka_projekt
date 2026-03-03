/**
 * Približné súradnice centier slovenských krajov (pre inzeráty bez lat/lng).
 */
/** Kraj + mesto → [zemepisná šírka, dĺžka] – pre zobrazenie inzerátov na mape */
export const SK_REGION_COORDS: Record<string, [number, number]> = {
  'bratislavský': [48.1486, 17.1077],
  'bratislava': [48.1486, 17.1077],
  'trnavský': [48.3944, 17.5814],
  'trnava': [48.3944, 17.5814],
  'trenčiansky': [48.8945, 18.0444],
  'trenčín': [48.8945, 18.0444],
  'nitriansky': [48.3069, 18.0842],
  'nitra': [48.3069, 18.0842],
  'žilinský': [49.2032, 18.7493],
  'žilina': [49.2032, 18.7493],
  'banskobystrický': [48.7363, 19.1461],
  'banská bystrica': [48.7363, 19.1461],
  'banska bystrica': [48.7363, 19.1461],
  'prešovský': [49.0017, 21.239],
  'prešov': [49.0017, 21.239],
  'presov': [49.0017, 21.239],
  'košický': [48.7164, 21.2611],
  'košice': [48.7164, 21.2611],
  'kosice': [48.7164, 21.2611],
}

const LOWER_REGIONS = Object.keys(SK_REGION_COORDS)

export function getCoordsFromLocation(location: string | null | undefined): [number, number] | null {
  if (!location || typeof location !== 'string') return null
  const lower = location.toLowerCase().trim()
  for (const key of LOWER_REGIONS) {
    if (lower.includes(key)) return SK_REGION_COORDS[key]
  }
  return null
}

export const SK_CENTER: [number, number] = [48.669, 19.699]
export const SK_DEFAULT_ZOOM = 7

/** Hranice Slovenska [juhozápad, severovýchod] – na obmedzenie výstupu a panovania */
export const SK_BOUNDS: [[number, number], [number, number]] = [
  [47.73, 16.83], // juhozápad
  [49.61, 22.57], // severovýchod
]
