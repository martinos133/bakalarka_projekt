/** Vestavené routy platformy (Next.js). */
export interface PlatformBuiltInPage {
  path: string
  title: string
  note?: string
  /** Presný slug CMS stránky (publikovaná stránka prepíše vestavený obsah). */
  cmsOverrideSlug?: string
  /**
   * Otvorí formulár so slugom začínajúcim na tento prefix – doplňte zvyšok (napr. kategoria-it-sluzby).
   */
  cmsSlugPrefix?: string
}

export const PLATFORM_BUILT_IN_PAGES: PlatformBuiltInPage[] = [
  { path: '/', title: 'Domov', cmsOverrideSlug: 'home', note: 'CMS slug: home' },
  { path: '/mapa', title: 'Mapa inzerátov', cmsOverrideSlug: 'mapa' },
  { path: '/premium', title: 'Prémiové balíky (RentMe Pro)', cmsOverrideSlug: 'premium' },
  { path: '/blog', title: 'Blog – zoznam', cmsOverrideSlug: 'blog' },
  {
    path: '/blog/[slug]',
    title: 'Blog – článok',
    cmsSlugPrefix: 'blog-cms-',
    note: 'Slug: blog-cms-{rovnaký ako slug článku v URL}',
  },
  { path: '/become-seller', title: 'Stať sa predajcom', cmsOverrideSlug: 'become-seller' },
  { path: '/signin', title: 'Prihlásenie', cmsOverrideSlug: 'signin' },
  { path: '/join', title: 'Registrácia', cmsOverrideSlug: 'join' },
  { path: '/podat-inzerat', title: 'Podanie inzerátu', cmsOverrideSlug: 'podat-inzerat' },
  { path: '/vyhladavanie', title: 'Vyhľadávanie', cmsOverrideSlug: 'vyhladavanie' },
  { path: '/dashboard', title: 'Môj účet / dashboard', cmsOverrideSlug: 'dashboard' },
  {
    path: '/kategoria/[slug]',
    title: 'Kategória',
    cmsSlugPrefix: 'kategoria-',
    note: 'Slug: kategoria-{slug-kategorie}',
  },
  {
    path: '/inzerat/[id]',
    title: 'Detail inzerátu',
    cmsSlugPrefix: 'inzerat-',
    note: 'Slug: inzerat-{id-inzerátu z URL}',
  },
]
