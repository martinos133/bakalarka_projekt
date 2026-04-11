# Inzertná platforma

Monorepo pre **webovú inzertnú platformu** (verejný front-end, používateľské konto, administračný panel a REST API). Tento dokument slúži aj ako **pracovný podklad pre bakalársku prácu**: popisuje skutočnú architektúru repozitára a naväzuje na typickú štruktúru textu (úvod, súčasný stav, ciele, metodika, návrh, implementácia, záver).

## Zhrnutie pre prácu

| Téma v práci | Ako sa premietá do tohto projektu |
|--------------|----------------------------------|
| Problém a motivácia | Centralizovaná správa inzerátov, kategórií, používateľov a obsahu oproti rozptýleným riešeniam (sociálne siete, generické formuláre). |
| Webová aplikácia | Tri Next.js aplikácie (`platform`, `user`, `admin`) + NestJS API; klient–server komunikácia cez HTTP/JSON. |
| Databáza a dátový model | PostgreSQL, Prisma ORM – modely mimo iného `User`, `Category`, `Filter`, `Advertisement`, `Payment`, `Message`, `Favorite`, `Report`, `StaticPage`, `BlogPost`, `SiteMenu`, `ClickEvent`. |
| Bezpečnosť a roly | JWT autentifikácia (`ADMIN` / `USER`); bcrypt pre heslá; validácia vstupov na API (`class-validator`). |
| Nasadenie | Docker Compose v `docker/`; vývoj cez `npm run dev` v jednotlivých aplikáciách. |

Ak má tvoja **knižná práca v obsahu inú doménu** (napr. sklad), štruktúra kapitol z predlohy stále platí — v texte však popisuj **tento repozitár** (inzertná platforma), aby bol dokument v súlade so zdrojovým kódom a obhajobou.

---

## Štruktúra repozitára

```
├── apps/
│   ├── admin/          # Admin panel (Next.js) – CMS, blog, statické stránky, analytika, …
│   ├── user/           # Konto používateľa (Next.js)
│   ├── platform/       # Verejná platforma – kategórie, inzeráty, mapa, vyhľadávanie, …
│   └── api/            # Backend REST API (NestJS)
├── packages/
│   ├── shared/         # Zdieľané typy a pomocné funkcie
│   └── database/       # Prisma schéma a migrácie PostgreSQL
└── docker/             # Docker a Docker Compose
```

---

## Technický základ (pre kapitolu „Metodika“ / „Implementácia“)

- **Monorepo**: npm workspaces (`apps/*`, `packages/*`).
- **Frontend**: [Next.js](https://nextjs.org/) (App Router), React, TypeScript, Tailwind CSS; na mape [Leaflet](https://leafletjs.com/) / `react-leaflet`.
- **Admin CMS**: napr. vizuálny editor (GrapesJS), textový editor (React Quill), grafy (Recharts).
- **Backend**: [NestJS](https://nestjs.com/), TypeScript, Swagger (`@nestjs/swagger`).
- **Databáza**: PostgreSQL s [Prisma](https://www.prisma.io/) — v koreňovom `.env` stačí `DATABASE_URL` (pri PgBouncerovi vieš doplniť `directUrl` v `schema.prisma`).
- **Autentifikácia**: JWT (`@nestjs/jwt`, Passport JWT); heslá cez `bcrypt`.
- **Validácia API**: `class-transformer` + `class-validator` (na fronte môžeš v práci spomenúť doplnkovú schémovú validáciu ako rozšírenie, ak ju pridáš).
- **Identifikátory**: UUID primárne kľúče v Prisma modeloch.
- **Verziovanie**: Git (napr. GitHub) — vhodné pre podkapitolu o vývojovom procese.

Hlavné **API moduly** (orientačný zoznam pre popis funkcií): `auth`, `users`, `categories`, `filters`, `advertisements`, `search`, `messages`, `favorites`, `reports`, `payments`, `blog`, `static-pages`, `menu`, `analytics`, `admin`.

---

## Funkčné celky (náčrt pre kapitolu „Výsledky“ / „Implementácia“)

- **Používatelia**: registrácia, prihlásenie, profil (vrátane firmy), roly, predajné plány (`SellerPlan`).
- **Inzeráty**: služby / prenájom, stavy schvaľovania, špecifikácie podľa filtrov kategórie, obrázky, ceny a balíčky, geografická poloha.
- **Kategórie a filtre**: hierarchia kategórií, SEO polia, dynamické filtre (`FilterType`).
- **Vyhľadávanie a zoraďovanie**: vyhľadávací modul API; zvýraznenie inzerátov (`priorityBoosted`).
- **Komunikácia**: správy (vrátane vlákien), typy správ (dopyt, systém, schválenie inzerátu, …).
- **Obľúbené a platby**: `Favorite`; `Payment` medzi prenájomcom a vlastníkom inzerátu.
- **Moderácia**: nahlasovanie inzerátov (`Report`).
- **Obsah a konfigurácia**: statické stránky, blog, menu (navbar/footer), `SiteConfig`.
- **Analytika**: udalosti kliknutí (`ClickEvent`) podľa segmentov.

Detailné polia a väzby sú v `packages/database/prisma/schema.prisma`.

---

## Rýchly štart (vývoj)

### Požiadavky

- Node.js ≥ 18, npm ≥ 9  
- Docker a Docker Compose (pre lokálny stack v `docker/`)  
- Koreňový súbor **`.env`** (rovnaký koreň ako `package.json`) s **`DATABASE_URL`** — Prisma skripty ho načítavajú cez `dotenv-cli` z `packages/database`

### Inštalácia

```bash
npm install
npm run db:generate   # Prisma Client (vyžaduje koreňový .env s DATABASE_URL)
```

### Databáza

```bash
npm run db:push       # synchronizácia schémy bez migr. súborov (vývoj)
npm run db:migrate    # migrácie (dev)
npm run db:deploy     # migrácie (produkcia / CI)
npm run db:studio     # Prisma Studio
npm run db:seed       # seed (ak je pripravený)
```

**Poznámka:** Nepoužívaj `npx prisma generate` priamo z koreňa bez `--schema` — vždy `npm run db:generate` alebo `cd packages/database && npm run db:generate`. Entitný diagram sa dá do práce priložiť ako export z [dbdiagram.io](https://dbdiagram.io) alebo screenshot z Prisma Studio; pri generovaní klienta už nie je potrebný Chrome.

### Vývojové servery

```bash
# všetky workspaces naraz (podľa root package.json)
npm run dev

# alebo jednotlivo (príklady portov)
cd apps/platform && npm run dev   # často :3000
cd apps/admin && npm run dev      # často :3002
cd apps/api && npm run start:dev
```

### Docker

```bash
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml logs -f
```

### Build

```bash
npm run build
```

---

## Návrh na mapovanie na obsah bakalárskej práce

Nižšie je **vodítko**, nie povinný text školy. Uprav podľa interných predpisov fakulty.

| Časť práce | Čo doplniť z projektu |
|------------|------------------------|
| **Úvod** | Prečo inzertná/mikro-služobná platforma; čo rieši oproti „iba sociálnym sieťam“ alebo e-mailom. |
| **Súčasný stav** | Prehľad podobných systémov (generické bazáre, freelancer portály, no-code nástroje) — **nespájaj s kódom**, je to literárna rešerš. |
| **Ciele** | Konkrétne funkčné a nefunkčné požiadavky založené na moduloch vyššie (časť už je v schéme DB). |
| **Metodika** | Výber stacku (Next.js vs. iné frameworky, PostgreSQL vs. alternatívy), Git workflow, ako dokumentuješ API (Swagger). |
| **Návrh** | Use case / ER alebo logický model z Prisma; architektúrna schéma: tri fronty + API + DB. |
| **Implementácia** | Postupne: UI platformy, admin, API endpointy, validácia, nasadenie; môžeš odkazovať na konkrétne `apps/` priečinky. |
| **Záver** | Splnené ciele, obmedzenia, ďalší rozvoj (napr. platobná brána, e2e testy). |
| **Zoznam literatúry** | Oficiálna dokumentácia Next.js, NestJS, Prisma, PostgreSQL, RFC pre JWT/HTTP. |
| **Prílohy** | Napr. ukážky API z Swaggeru, ER diagram export, screenshoty obrazoviek, výpis `.env.example` (bez tajomstiev). |

Odporúčaná **štruktúra príloh** (prispôsob si názvy):

- Príloha A — ERD / export z nástroja pre `schema.prisma`  
- Príloha B — Ukážka konfigurácie prostredia (redigovaná)  
- Príloha C — Ukážky obrazoviek (platforma, admin)  
- Príloha D — Príklad požiadavky a odpovede REST API  

---

## Obsah bakalárskej práce (navrhovaná štruktúra)

Nižšie je **obsah v rovnakom duchu** ako v predlohe (úvodná část, číslované kapitoly, metodika, návrh, implementácia, záver, literatúra, prílohy). Názvy podkapitol sú upravené tak, aby zodpovedali **tomuto projektu** (webová inzertná platforma). Čísla strán doplníš v dokumente práce.

### Úvodná časť

- Anotačný záznam  
- Poďakovanie  
- Abstrakt (v slovenskom jazyku)  
- Abstrakt (v anglickom jazyku)  
- Zoznam obrázkov a tabuliek  
- Zoznam skratiek a značiek  

### Hlavná časť

**1 Úvod**  
Východiská, kontext problematiky webových inzertných a služobných platforiem, zadanie a rozsah práce.

**2 Súčasný stav riešenej problematiky**  

- 2.1 Existujúce prístupy k publikácii ponúk a dopytu (inzertné portály, platformy pre služby na voľnej nohe)  
- 2.2 Jednoduché a ad hoc riešenia (sociálne siete, tabuľkové nástroje, e-mail)  
- 2.3 Prehľad vybraných komerčných alebo open-source riešení (krátky literárny rozbor)  

**3 Cieľ práce**  
Formulácia hlavného a parciálnych cieľov; funkčné a nefunkčné požiadavky vo vzťahu k implementovanému systému.

**4 Metodika práce a metódy skúmania**  

- 4.1 Webová aplikácia  
  - 4.1.1 Next.js (App Router), React komponenty a štruktúra stránok v TSX/JSX  
  - 4.1.2 Tailwind CSS a responzívny návrh (PostCSS, utility-first štýly)  
  -  *4.1.3 Validácia údajov (napr. na serveri: `class-validator` / DTO v NestJS; voliteľne schémy na klientovi)*  
  - 4.1.4 JavaScript a TypeScript  
  - 4.1.5 Komunikácia medzi klientom a serverom (HTTP, REST, JSON)  
  - 4.1.6 Univerzálny jedinečný identifikátor (UUID)  
- 4.2 Verziovanie softvéru (Git, vzdialený repozitár napr. GitHub)  
- 4.3 Návrh vzhľadu a používateľského rozhrania systému  
- 4.4 Výber aplikačného rámca (frameworku) pre backend a frontend  
- 4.5 Porovnanie frontendových technológií (napr. React, Next.js, Angular, Vue.js) a **odôvodnenie výberu** pre túto prácu  
- 4.6 Porovnanie databázových systémov (napr. PostgreSQL, MySQL, ďalšie podľa rešerše) a **odôvodnenie výberu**  
- 4.7 Základy jazyka SQL v kontexte použitej databázy (DDL, DML, DCL, TCL)  
- 4.8 Diagram prípadov použitia (Use Case)  
- 4.9 Návrh databázového modelu (ER diagram, väzby entít)  

**5 Návrh a realizácia webového riešenia**  

- 5.1 Vizuálna stránka a používateľské rozhranie webového riešenia  
- 5.2 Štruktúra a architektúra projektu (monorepo, klient–server, vrstvy API)  
- 5.3 Validácia formulárov a vstupných údajov  
- 5.4 Vyhľadávanie a prehľad zoznamov údajov  
- 5.5 Nasadenie a prevádzka aplikácie (Docker / hosting – podľa skutočnosti)  
- 5.6 Funkčné moduly aplikácie  
  - 5.6.1 Registrácia používateľa  
  - 5.6.2 Prihlásenie používateľa  
  - 5.6.3 Prehľad platformy, kategórie a zobrazenie inzerátov  
  - 5.6.4 Roly a oprávnenia (administrátor / používateľ), predajné plány  
  - 5.6.5 Správa používateľského profilu a firemných údajov  
  - 5.6.6 Detail inzerátu, špecifikácie a médiá  
  - 5.6.7 Administrácia používateľov a moderácia  
  - 5.6.8 Správa kategórií a filtrov  
  - 5.6.9 Správa obsahu (statické stránky, blog, navigácia)  
  - 5.6.10 Správy medzi používateľmi, obľúbené položky, platobné záznamy (podľa rozsahu práce)  
  - 5.6.11 Prehľady a analytika návštevnosti  

**6 Záver**  
Zhodnotenie splnenia cieľov, prínosy, obmedzenia, možnosti ďalšieho rozvoja.

### Záverečná časť

- **Zoznam použitej literatúry**  
- **Prílohová časť**  
- **Zoznam príloh** (napr. dlhšie výpisy kódu, kompletný výpis API, dodatočné diagramy)

---

## Licencia a citácie

Projekt je označený ako `private` v `package.json`. Pri práci dodržiavaj licencie závislostí a v texte práce cituj dokumentáciu a zdroje podľa smerníc školy.

---

*Posledná aktualizácia README v súlade so štruktúrou monorepa „inzertna-platforma“. Pred odovzdaním práce skontroluj čísla verzií v `package.json` jednotlivých aplikácií.*
