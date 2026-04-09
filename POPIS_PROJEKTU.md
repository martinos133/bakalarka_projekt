# Popis projektu – inzertná platforma (technický a funkčný prehľad)

Tento dokument podrobne opisuje repozitár **inzertnej platformy**: jeho funkcionality, architektúru, technologický stack, databázový model, bezpečnostné mechanizmy a spôsob spustenia/nasadenia. Je pripravený tak, aby sa dal priamo použiť ako podklad do bakalárskej práce (kapitoly návrh/implementácia/výsledky).

---

## Prehľad systému (čo projekt rieši)

Projekt implementuje **webovú platformu pre publikovanie a správu inzerátov** (ponuky služieb alebo prenájmu). Systém je rozdelený na viacero samostatných aplikácií:

- **Verejná platforma** – návštevník prehliada kategórie, inzeráty, vyhľadáva, používa mapu a číta obsah (blog, statické stránky).
- **Používateľské konto** – registrovaný používateľ spravuje profil, inzeráty, obľúbené a komunikuje cez správy.
- **Admin panel** – administrátor spravuje obsah (CMS), blog, statické stránky, menu, kategórie/filtre, používateľov, moderáciu a prehľady.
- **Backend API** – centrálny server poskytujúci REST API, autentifikáciu, autorizáciu, validáciu vstupov a prístup do databázy.

Z pohľadu architektúry ide o klasický model **klient–server**, kde front-end aplikácie komunikujú s API cez HTTP (JSON), a API pracuje s databázou.

---

## Monorepo a štruktúra kódu

Repozitár je monorepo riadené cez **npm workspaces**:

```
apps/
  platform/   (Next.js) – verejný web
  user/       (Next.js) – používateľské konto
  admin/      (Next.js) – administračný panel + vizuálny editor obsahu
  api/        (NestJS)  – REST API
packages/
  database/   (Prisma) – schéma databázy + migrácie + Prisma Client
  shared/     (TS)     – zdieľané typy/DTO (používané naprieč FE a BE)
docker/
  docker-compose.yml + Dockerfile.* pre služby
```

Tento spôsob umožňuje:

- zdieľať typy/DTO medzi FE a BE (znižuje počet nekonzistencií),
- koordinovať build a spúšťanie viacerých aplikácií z jedného repozitára,
- zjednodušiť nasadenie cez Docker Compose.

---

## Použité technológie a frameworky

### Frontend (apps/platform, apps/user, apps/admin)

- **Next.js** (verzia 16.x) s App Routerom – serverové/klientské komponenty, routovanie, rendering.
- **React 18** + **TypeScript**.
- **Tailwind CSS** + PostCSS – utility-first štýlovanie a responzívny dizajn.
- **Mapy**: `leaflet` + `react-leaflet` (platforma).
- **Admin vizuálny editor**: `grapesjs` + `grapesjs-preset-webpage`.
- **Rich text editor**: `react-quill-new` (admin).
- **Grafy**: `recharts` (admin – štatistiky, grafy vývoja).

### Backend (apps/api)

- **NestJS** – modulárna architektúra, kontroléry/služby, middleware/guardy.
- **Validácia vstupov**: `ValidationPipe` + `class-validator` (DTO) s režimami:
  - `whitelist: true` (odstránenie neznámych polí),
  - `forbidNonWhitelisted: true` (zákaz neznámych polí),
  - `transform: true` (transformácia typov).
- **Swagger** dokumentácia: `@nestjs/swagger` (endpoint `GET /api/docs`).
- **Autentifikácia**: JWT (`@nestjs/jwt`, `passport`, `passport-jwt`).
- **Heslá**: `bcrypt` (hash a porovnanie).

### Databáza a ORM (packages/database)

- **PostgreSQL**:
  - v tomto projekte je databáza reálne používaná **v cloude (Neon)** cez `DATABASE_URL` (poolované pripojenie pre runtime API),
  - zároveň je pripravená možnosť spustiť **lokálny Postgres cez Docker Compose** (najmä na vývoj/testovanie),
  - na migrácie Prisma sa používa `DIRECT_DATABASE_URL` (priame pripojenie bez poolera).
- **Prisma** – definícia schémy v `schema.prisma`, generovanie Prisma Client a migrácie.

---

## Architektúra (logický pohľad)

### 1) Základný tok požiadaviek

1. Používateľ pracuje s UI (platform/user/admin).
2. UI volá REST API na `apps/api` (typicky cez `NEXT_PUBLIC_API_URL`).
3. API overí vstupy (validácia), prípadne overí prístup (JWT + roly).
4. API vykoná logiku v službe (service) a pracuje s databázou cez Prisma Client.
5. API vráti JSON odpoveď klientovi.

### 2) Rozdelenie do aplikácií

- **Platform (3000)**: verejné stránky (landing, kategórie, detail inzerátu, blog, statické stránky, mapa, vyhľadávanie).
- **Admin (3002)**: správa obsahu a administrácia (moderácia, správy, prehľady, konfigurácia menu).
- **User (3003)**: používateľský profil, správa inzerátov a ďalšie používateľské akcie.
- **API (3001)**: spoločný backend pre všetky tri front-endy.

Poznámka: presné porty vyplývajú zo `package.json` a z Docker konfigurácie.

---

## Backend – modulárna štruktúra a zodpovednosti

Backend je postavený modulárne (NestJS moduly). V `AppModule` sú importované napr.:

- **Auth** – registrácia, login, JWT token, `GET /auth/me`.
- **Users** – správa používateľov (profil, výpisy).
- **Advertisements** – CRUD a logika inzerátov (typ, status, parametre, media).
- **Categories** – kategórie, hierarchia, SEO polia, väzby na inzeráty.
- **Filters** – dynamické filtre pre kategórie (TEXT/NUMBER/SELECT/…).
- **Search** – vyhľadávanie a filtrovanie výsledkov.
- **Messages** – správy/konverzácie, admin prehľady správ.
- **Favorites** – obľúbené inzeráty používateľa.
- **Reports** – nahlasovanie inzerátov (moderácia).
- **Static pages** – statické stránky spravované cez admin (HTML obsah).
- **Blog** – blogové príspevky (draft/published).
- **Menu** – konfigurácia navigácie a footer menu.
- **Config (SiteConfig)** – všeobecné nastavenia platformy/adminu.
- **Analytics** – click eventy a jednoduché metriky.
- **Admin** – admin-only endpointy (štatistiky, graf, výpisy).

V praxi je každá doména rozdelená na:

- `*.controller.ts` – definícia REST endpointov,
- `*.service.ts` – aplikačná logika,
- DTO typy v `packages/shared` (zdieľané medzi FE/BE),
- prístup do DB cez Prisma (z balíka `@inzertna-platforma/database`).

---

## Bezpečnosť (autentifikácia, autorizácia, validácia)

### 1) JWT autentifikácia

- Pri registrácii alebo prihlásení API vráti **JWT token**.
- Token sa posiela v hlavičke `Authorization: Bearer <token>`.
- `JwtStrategy` extrahuje token a overí podpis pomocou `JWT_SECRET`.
- Payload typicky obsahuje `userId`, `email` a `role`.

### 2) Autorizácia podľa rolí

Systém podporuje roly (napr. `ADMIN`, `USER`). Pre admin endpointy sa používa kombinácia:

- `JwtAuthGuard` – vyžaduje platný token,
- `RolesGuard` – kontrola, či `request.user.role` patrí medzi požadované roly,
- dekorátor `@Roles(...)` – deklaratívne určuje roly pre controller alebo endpoint.

### 3) Bezpečné ukladanie hesiel

Heslá sa nikdy neukladajú v plaintext:

- pri registrácii sa hashujú cez `bcrypt.hash(..., 10)`,
- pri prihlásení sa porovnávajú cez `bcrypt.compare(...)`.

### 4) Validácia a ochrana API pred „nečistými“ vstupmi

Globálny `ValidationPipe` je nastavený tak, aby:

- odstraňoval neznáme polia (`whitelist`),
- zakazoval neznáme polia (`forbidNonWhitelisted`),
- transformoval typy vstupov (`transform`).

To je dôležité pre konzistenciu DTO a pre obmedzenie útokov typu „mass assignment“.

### 5) CORS a oddelené front-end aplikácie

API povoľuje CORS pre lokálne originy:

- `http://localhost:3000` (platform),
- `http://localhost:3002` (admin),
- `http://localhost:3003` (user),
- a voliteľne `FRONTEND_URL` z prostredia.

### 6) Ochrana účtov (banovanie)

Pri prihlásení systém kontroluje stav `banned`, `bannedUntil` a `banReason`. V prípade aktívneho banu:

- dočasný ban vráti informáciu o platnosti a dôvode,
- trvalý ban vráti informáciu o trvalom zablokovaní,
- po uplynutí banu systém používateľa automaticky odblokuje.

---

## Databáza – schéma a hlavné entity

Databázová schéma je definovaná v:

- `packages/database/prisma/schema.prisma`

### Kľúčové entity (výber)

- **User** – používateľský účet, profil, rola, firemné údaje, predajný plán (seller plan), banovanie, posledné prihlásenie.
- **Advertisement** – inzerát (title, description, price…), typ (SERVICE/RENTAL), status (PENDING/DRAFT/ACTIVE/…), lokalita + GPS, obrázky, špecifikácie, zvýraznenie.
- **Category** – kategórie so slugom, hierarchiou (parent/children), SEO polia a poradie.
- **Filter** – dynamické filtre pre kategórie, typ filtra (TEXT/NUMBER/SELECT/…).
- **Favorite** – prepojenie používateľa a obľúbeného inzerátu.
- **Message** – správy medzi používateľmi a systémové správy (vláknovanie cez `parentId`).
- **Report** – nahlásenia inzerátov (dôvod, stav riešenia).
- **Payment** – platobné záznamy medzi prenajímateľom a vlastníkom inzerátu.
- **StaticPage** – statické stránky s HTML obsahom (draft/published).
- **BlogPost** – blogové príspevky (draft/published, SEO polia).
- **SiteConfig** – JSON konfigurácia (napr. pre platform/admin).
- **SiteMenu** – JSON menu pre navbar/footer (editovateľné v admin paneli).
- **ClickEvent** – analytika kliknutí a segmentácia (pohlavie, firma vs fyzická osoba).

### Identifikátory, vzťahy a indexy

- Primárne kľúče sú UUID (`@default(uuid())`).
- Väzby sú riešené cez Prisma relácie (napr. `User -> Advertisement[]`, `Category -> Advertisement[]`).
- V schéme sú definované indexy pre často filtrované polia (napr. `status`, `slug`, `createdAt`).

---

## Funkcionality podľa používateľských rolí

### Administrátor platformy (ADMIN)

Administrátor je používateľ s rolou `ADMIN`, ktorý riadi a spravuje celú platformu (v praxi cez admin panel).

- štatistiky a grafy platformy (počty používateľov a inzerátov, trendy),
- prehľad a správa používateľov,
- prehľad a správa inzerátov (moderácia, schvaľovanie/archivácia podľa statusov),
- správa správ / kontaktných formulárov (admin prehľad),
- správa kategórií a filtrov (dáta pre vyhľadávanie a formuláre inzerátov),
- správa obsahu (statické stránky, blog),
- konfigurácia menu a globálnych nastavení (navbar/footer, `SiteConfig`).

### Návštevník (neprihlásený / „neaktívny“ používateľ)

- prehliadanie verejného obsahu (kategórie, zoznamy, detail inzerátu),
- vyhľadávanie a filtrovanie,
- mapové zobrazenie (ak je súčasťou UI),
- čítanie blogu a statických stránok.

### Prihlásený používateľ (USER) – „konto“ / vlastná správa (mini-admin)

Prihlásený používateľ má svoju časť aplikácie (používateľské konto), kde spravuje vlastné dáta a inzeráty.

- registrácia a prihlásenie,
- správa profilu (osobné údaje / firma),
- tvorba a správa vlastných inzerátov (vytvorenie, úprava, práca so stavmi, médiami a parametrami),
- obľúbené inzeráty,
- správy (komunikácia),
- interakcie, ktoré systém zaznamenáva do analytiky (napr. kliky).

---

## Správa obsahu (CMS) a „statické“ stránky

Systém podporuje spravovanie obsahu v databáze:

- **StaticPage** – HTML obsah pre URL podľa slug-u (napr. „stať sa predajcom“, „premium“, …).
- **BlogPost** – blogové príspevky s publikovaním a SEO metadátami.
- **SiteMenu** – navigácia (navbar/footer) uložená ako JSON, editovateľná v admin paneli.

Týmto prístupom sa obsah nemusí „hardcodovať“ do frontendu a dá sa upravovať bez redeployu.

---

## Vyhľadávanie, filtrovanie a kategórie

Jedným z kľúčových prvkov platformy je kombinácia:

- kategórií (hierarchia, slug, SEO),
- filtrov viazaných na kategóriu (`FilterType` – text/číslo/select/range…),
- špecifikácií inzerátu (`specifications` ako JSON), ktoré umožňujú ukladať hodnoty filtrov flexibilne.

Táto kombinácia je vhodná pre platformu, kde sa kategórie a ich parametre môžu časom rozširovať bez potreby meniť databázové stĺpce pri každom novom filtre.

---

## Prevádzka a nasadenie (Docker)

Repozitár obsahuje `docker/docker-compose.yml`, ktorý spúšťa služby:

- `postgres` (PostgreSQL 16),
- `api` (NestJS API),
- `admin` (Next.js),
- `user` (Next.js),
- `platform` (Next.js).

Typický spôsob spustenia:

```bash
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml logs -f
```

V compose sú definované environment premenné (napr. `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`) a závislosti medzi službami (API čaká na zdravý postgres).

---

## Dokumentácia API (Swagger)

Backend generuje Swagger dokumentáciu automaticky. Po spustení API je dostupná na:

- `GET /api/docs`

Táto dokumentácia je vhodná ako príloha bakalárskej práce (ukážka endpointov, DTO, autentifikácie).

---

## Vývojové spustenie (lokálne)

Z rootu monorepa:

```bash
npm install
npm run db:generate
npm run dev
```

Alebo jednotlivo v jednotlivých aplikáciách (podľa potreby).

---

## Poznámky k bezpečnosti a konfigurácii prostredia (pre kapitolu „Diskusia“)

- **Tajomstvá (secrets)** ako `JWT_SECRET` a prístupové údaje do DB majú byť vždy v `.env` alebo v prostredí nasadenia, nie priamo v príkazoch alebo v repozitári.
- Odporúčaný postup do práce: popísať, že projekt používa premenné prostredia `DATABASE_URL`, `DIRECT_DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, a že produkčné hodnoty sa nastavujú mimo kódu.

---

## Čo sa dá doplniť do bakalárky (návrhy rozšírení)

Ak budeš potrebovať rozšíriť prácu alebo implementáciu, prirodzené pokračovania sú:

- e2e testy (napr. Playwright) + testovacia databáza,
- audit log (kto a kedy zmenil inzerát/kategóriu),
- robustnejšia analytika (eventy, dashboardy),
- integrácia platobnej brány (ak sú platby len evidované),
- ukladanie obrázkov mimo DB (napr. objektové úložisko) a nie ako base64.

