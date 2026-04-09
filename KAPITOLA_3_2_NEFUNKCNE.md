## 3.2 Nefunkčné požiadavky

Nefunkčné požiadavky určujú prevádzkové vlastnosti a technické obmedzenia systému. Pre inzertnú platformu, ktorá narába s osobnými údajmi a sprostredkováva interakciu medzi cudzími subjektmi, sú kritické najmä oblasti bezpečnosti, výkonu a schopnosti ďalšieho rozširovania.

### 1. Bezpečnosť a ochrana údajov

Bezpečnosť je prioritnou nefunkčnou požiadavkou vzhľadom na spracovanie používateľských profilov a súkromnej komunikácie.

- **Autentifikácia a autorizácia:** Prístup k chráneným častiam API je podmienený platným JSON Web Tokenom (JWT). V NestJS je táto vrstva implementovaná pomocou stratégie `passport-jwt` a chránená globálnymi guardmi (`JwtAuthGuard`, `RolesGuard`), čo zabezpečuje, že identita a rola používateľa sú overené pri každej požiadavke.
- **Hashovanie hesiel:** Heslá používateľov nie sú v databáze PostgreSQL nikdy ukladané v čitateľnej podobe; na ich transformáciu sa využíva kryptografický algoritmus `bcrypt` so soľou (salt).
- **Validácia vstupov a ochrana pred mass assignment:** Systém automaticky odmieta požiadavky obsahujúce neznáme alebo nebezpečné polia. Je to zabezpečené pomocou globálneho nastavenia `ValidationPipe` v NestJS (s parametrami `whitelist: true` a `forbidNonWhitelisted: true`), ktoré v spolupráci s knižnicou `class-validator` a DTO (Data Transfer Objects) triedami filtruje vstupy.
- **CORS (Cross-Origin Resource Sharing):** API explicitne definuje povolené zdroje (origins) pre frontendové aplikácie (napr. porty 3000, 3002, 3003), čím sa predchádza neautorizovaným volaniam z cudzích domén.
- **Ochrana pred zneužitím:** Systém umožňuje administrátorovi okamžite zablokovať prístup nahláseným alebo podvodným používateľom prostredníctvom mechanizmu banovania (polia `banned`, `bannedUntil` a `banReason` v databáze).

### 2. Škálovateľnosť a udržateľnosť kódu

Platforma je navrhnutá tak, aby bolo možné zvyšovať jej výkon alebo pridávať nové funkcie bez nutnosti rozsiahleho refaktoringu.

- **Monorepo architektúra:** Použitie npm workspaces umožňuje logické oddelenie frontendových aplikácií (`apps/platform`, `apps/user`, `apps/admin`) od backendu (`apps/api`). Tento prístup umožňuje využívať zdieľané balíčky (`packages/shared` pre typy a DTO, `packages/database` pre databázové modely) naprieč celým repozitárom, čo zaručuje konzistenciu dátových typov medzi klientom a serverom.
- **Modularita backendu:** NestJS framework vynucuje rozdelenie logiky do samostatných doménových modulov (napr. `AuthModule`, `AdvertisementsModule`, `AnalyticsModule`). Toto rozdelenie umožňuje nezávislý vývoj, testovanie a údržbu jednotlivých častí systému.
- **Databázové migrácie a ORM:** Použitie Prisma ORM zabezpečuje, že zmeny v dátovom modeli (`schema.prisma`) sú typovo bezpečné (type-safe), sledované a verzované. To výrazne uľahčuje nasadenie zmien v produkčnom prostredí (napríklad pomocou príkazu `prisma migrate deploy`).
- **Kontajnerizácia:** Projekt je pripravený na nasadenie pomocou technológie Docker. Súbor `docker-compose.yml` definuje izolované prostredia pre databázu (PostgreSQL) a jednotlivé Node.js služby, čo zabezpečuje identické správanie aplikácie vo vývojovom aj produkčnom prostredí.

### 3. Odozva a optimalizácia pre vyhľadávače (SEO)

Vysoká rýchlosť a dohľadateľnosť obsahu sú kľúčové pre úspech verejného inzertného portálu.

- **Server-side Rendering (SSR):** Využitie Next.js App Routera (verzia 16+) umožňuje generovať obsah inzerátov a kategórií na strane servera. To zabezpečuje okamžitú odozvu pre používateľa a ideálnu indexáciu obsahu robotmi vyhľadávačov, keďže HTML dokument už pri načítaní obsahuje kompletné metadáta (napr. polia `metaTitle`, `metaDescription` z databázy).
- **Efektivita databázových dopytov:** Často vyhľadávané a filtrované polia, ako sú `status`, `slug`, `categoryId` alebo `createdAt`, majú v Prisma schéme definované indexy (`@@index`), aby sa minimalizoval čas potrebný na vrátenie výsledkov pri veľkom objeme dát.
- **Responzívny dizajn:** Používateľské rozhranie je postavené na utility-first CSS frameworku Tailwind CSS. Tento prístup zabezpečuje korektné zobrazenie a plnú funkčnosť na zariadeniach s rôznou veľkosťou obrazovky s dôrazom na mobile-first prístup.
- **Optimalizácia prenosu dát:** API je nakonfigurované na spracovanie väčších objemov dát (napr. limit 50MB pre JSON payload), čo je nevyhnutné pre prenos obrázkov inzerátov kódovaných v base64 formáte.
