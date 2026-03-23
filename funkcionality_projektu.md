# Funkcionality projektu, ktoré už fungujú

Tento dokument sumarizuje funkcionality, ktoré sú v projekte už implementované (backend API + základné UI toky).

## Štart a dokumentácia API

- Backend: `Nest.js` (aplikácia v `apps/api`)
- Swagger dokumentácia: dostupná na `GET http://localhost:3001/api/docs`
- Autentifikácia: `JWT` (bearer token)

## Autentifikácia a používateľský účet

- Registrácia používateľa: `POST /auth/register`
- Prihlásenie používateľa: `POST /auth/login`
- Získanie aktuálneho používateľa (overenie tokenu): `GET /auth/me` (`JwtAuthGuard`)
- Používateľské profilové funkcie (vyžaduje autentifikáciu):
  - Získanie profilu: `GET /users/me/profile`
  - Úprava profilu: `PATCH /users/me/profile`
  - Zmena hesla: `PATCH /users/me/password`

## Správa inzerátov (advertisements)

- Vytvorenie inzerátu (autentifikovaný používateľ): `POST /advertisements`
- Zoznam / vyhľadávanie inzerátov:
  - Zoznam: `GET /advertisements`
  - Vyhľadávanie v inzerátoch podľa `q`: `GET /advertisements?q=...`
- Inzeráty na mape: `GET /advertisements/map` (voliteľné query parametre: `categoryId`, `type`, `region`)
- Populárne služby: `GET /advertisements/popular/services`
- Top freelanceri: `GET /advertisements/top-freelancers?limit=...`
- Inzeráty podľa kategórie (slug): `GET /advertisements/category/:slug` (v UI používané aj cez iný alias `GET /advertisements/category/:slug`)
- Inzeráty používateľa: `GET /advertisements/user/:userId`
- Vlastné inzeráty: `GET /advertisements/me/my-advertisements`
- Detail inzerátu: `GET /advertisements/:id`
- Úprava inzerátu: `PATCH /advertisements/:id` (len vlastník / kontrola cez `req.user.userId` v service)
- Odstránenie inzerátu: `DELETE /advertisements/:id`

### Schvaľovanie inzerátov (len `ADMIN`)

- Zoznam čakajúcich inzerátov: `GET /advertisements/pending/all` (roles `ADMIN`)
- Schválenie inzerátu: `PATCH /advertisements/:id/approve` (roles `ADMIN`)
- Zamietnutie inzerátu: `PATCH /advertisements/:id/reject` (roles `ADMIN`, voliteľne `reason`)

## Kategórie (categories)

- Vytvorenie kategórie: `POST /categories` (len `ADMIN`)
- Zoznam kategórií: `GET /categories`
- Aktívne kategórie: `GET /categories/active`
- Kategória podľa slug: `GET /categories/slug/:slug`
- Kategória podľa ID: `GET /categories/:id`
- Aktualizácia kategórie: `PATCH /categories/:id` (len `ADMIN`)
- Odstránenie kategórie: `DELETE /categories/:id` (len `ADMIN`)
- Zmena poradia kategórií: `PUT /categories/order` (len `ADMIN`)

## Filtre (filters)

- Vytvorenie filtra: `POST /filters` (len `ADMIN`)
- Zoznam filtrov (voliteľné `categoryId`): `GET /filters?categoryId=...`
- Aktívne filtre (voliteľné `categoryId`): `GET /filters/active?categoryId=...`
- Filter podľa ID: `GET /filters/:id`
- Aktualizácia filtra: `PATCH /filters/:id` (len `ADMIN`)
- Odstránenie filtra: `DELETE /filters/:id` (len `ADMIN`)

## Vyhľadávanie (search)

- Návrhy pre vyhľadávanie: `GET /search/suggestions?q=...`

## Obľúbené inzeráty (favorites)

- Zoznam obľúbených inzerátov: `GET /favorites` (autentifikácia)
- Kontrola, či je inzerát v obľúbených: `GET /favorites/check/:advertisementId`
- Pridanie do obľúbených: `POST /favorites/:advertisementId`
- Odstránenie z obľúbených: `DELETE /favorites/:advertisementId`

## Správy a konverzácie (messages)

- Vytvorenie inquiry/dopytu k inzerátu: `POST /messages/inquiry`
- Zoznam správ (autentifikácia) s filtrami:
  - `GET /messages?status=...&type=...` (voliteľné query `status`, `type`)
- Počet neprečítaných správ: `GET /messages/unread/count`
- Celá konverzácia (chat) k správe: `GET /messages/:id/conversation`
- Odpoveď v konverzácii: `POST /messages/:id/reply`
- Detail správy: `GET /messages/:id`
- Označenie správy ako prečítanej: `PATCH /messages/:id/read`
- Archivácia správy: `PATCH /messages/:id/archive`

## Nahlasovanie (reports)

- Nahlásenie inzerátu (autentifikácia): `POST /reports`
- Čakajúce nahlásenia (len `ADMIN`): `GET /reports/pending`
- Všetky nahlásenia (len `ADMIN`): `GET /reports`
- Detail nahlásenia (len `ADMIN`): `GET /reports/:id`
- Vyriešenie nahlásenia (len `ADMIN`): `PATCH /reports/:id/resolve`
- Odstránenie nahláseného inzerátu (len `ADMIN`):
  - `DELETE /reports/advertisement/:id` (body očakáva `reportId`)

## Blog (blog)

### Verejné

- Publikované články: `GET /blog/posts` (voliteľné `limit`)
- Článok podľa slug: `GET /blog/posts/slug/:slug`

### Admin (len `ADMIN`)

- Zoznam všetkých príspevkov: `GET /blog`
- Detail podľa ID: `GET /blog/:id`
- Vytvorenie: `POST /blog`
- Aktualizácia: `PATCH /blog/:id`
- Odstránenie: `DELETE /blog/:id`

## Menu a konfigurácia platformy

### Menu (menu)

- Verejné položky:
  - `GET /menu/navbar`
  - `GET /menu/footer`
  - `GET /menu/categoryNav`
  - `GET /menu/madeOnRentMe`
  - `GET /menu/popularCategories`
- Admin aktualizácie (len `ADMIN`):
  - `GET /menu/:type`
  - `PUT /menu/:type`

### Config (config)

- Verejné:
  - `GET /config/platform`
  - `GET /config/admin` (len pre admin použitie v praxi)
- Admin:
  - `GET /config/:key` (`platform` alebo `admin`)
  - `PUT /config/:key`

## Statické stránky (static-pages)

### Verejné

- Stránka podľa slug: `GET /static-pages/slug/:slug`

### Admin

- Zoznam stránok: `GET /static-pages/list`
- Detail podľa ID: `GET /static-pages/:id`
- Vytvorenie: `POST /static-pages`
- Aktualizácia: `PATCH /static-pages/:id`
- Odstránenie: `DELETE /static-pages/:id`

## Analytika kliknutí (analytics)

### Zber dát

- Zaznamenanie kliknutia (verejné, volá sa z frontendu): `POST /analytics/click`
  - V tele sa posielajú minimálne `eventType`, `targetType`, `targetId` a voliteľne `sessionId`, `userId`, `gender`, `isCompany`.
  - Frontend posiela gender/type podľa prihláseného používateľa (ak sú dostupné).

### Admin reporty

- Štatistiky kliknutí podľa filtra:
  - `GET /analytics/stats?period=...&minutes=...&gender=...&accountType=...` (len `ADMIN`)
- Rozklad kliknutí podľa kategórií a inzerátov:
  - `GET /analytics/stats/breakdown?period=...` (len `ADMIN`)

## Admin endpointy (admin)

Všetko je chránené `JwtAuthGuard` + rola `ADMIN`.

- Platform štatistiky: `GET /admin/stats`
- Zoznam používateľov: `GET /admin/users`
- Zoznam inzerátov: `GET /admin/advertisements`
- Dáta pre graf: `GET /admin/chart?period=...` (podporované `7d`, `30d`, `3m`)
- Správy pre admina (kontakt formuláre / správy):
  - `GET /admin/messages?status=...&type=...`

## UI funkcionality v jednotlivých appkách (zjednodušený prehľad)

- `apps/platform` (verejná platforma + používateľské flow)
  - Prihlásenie/registrácia flow: `/signin`, `/join`, prípadne prepojené stránky
  - Prehľady: home stránka (`/`), kategórie (`/kategoria/[slug]`), vyhľadávanie (`/vyhladavanie`)
  - Detail inzerátu: `/inzerat/[id]`
  - Mapa: `/mapa`
  - Blog: `/blog` a `/blog/[slug]`
  - Klik tracking: komponent `TrackedLink` volá `POST /analytics/click`

- `apps/user` (používateľské konto)
  - Login: `/login`
  - Register: `/register`

- `apps/admin` (admin dashboard)
  - Admin login: `/login`
  - Dashboard pre správu:
    - kategórií a inzerátov
    - čakajúcich inzerátov (`pending`)
    - nahlásených inzerátov (`reported`)
    - používateľov (ban/unban + profily)
    - menu/config/static pages
    - monitoring/analytika (klik štatistiky)

