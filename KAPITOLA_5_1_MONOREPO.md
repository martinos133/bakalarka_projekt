# 5 Realizácia a implementácia systému

Implementácia systému prebiehala v súlade s princípmi moderného full-stack vývoja. V tejto kapitole detailne rozoberám vnútornú štruktúru projektu, spôsob zdieľania kódu a konkrétne technické riešenia jednotlivých modulov.

## 5.1 Štruktúra monorepa a zdieľanie typov

Pre správu celého ekosystému som zvolil architektúru monorepa s využitím nástroja npm workspaces. Tento prístup mi umožnil sústrediť frontendovú aj backendovú logiku do jedného úložiska, čo výrazne zjednodušilo refaktoring a správu závislostí.

### 1. Organizácia adresárovej štruktúry

Projekt je rozdelený do dvoch hlavných priečinkov, ktoré jasne oddeľujú spustiteľné aplikácie od knižníc. Pre lepšiu orientáciu uvádzam zjednodušenú štruktúru projektu:

```text
.
├── apps/
│   ├── admin/          # Next.js (Admin panel)
│   ├── api/            # NestJS (Backend)
│   ├── platform/       # Next.js (Verejný web)
│   └── user/           # Next.js (Používateľská zóna)
├── packages/
│   ├── database/       # Prisma schéma a klient
│   └── shared/         # DTOs, TypeScript typy, Enums
├── package.json        # Konfigurácia npm workspaces
└── docker-compose.yml  # Orchestrácia celého monorepa
```

- **`apps/`:** Obsahuje štyri samostatné projekty: `api` (NestJS), `platform` (verejný Next.js web), `user` (používateľská zóna) a `admin` (správcovský panel). Každá z týchto aplikácií má vlastnú konfiguráciu a beží na samostatnom porte.
- **`packages/`:** Obsahuje zdieľané moduly, ktoré nie sú samostatne spustiteľné, ale poskytujú logiku pre ostatné aplikácie. Najdôležitejšími sú `database` (Prisma schéma a klient) a `shared` (spoločné typy).

### 2. Implementácia `packages/shared` a zdieľanie typov

Jednou z najväčších výziev pri vývoji oddeleného frontendu a backendu je udržanie konzistentných dátových typov. V mojom projekte som tento problém vyriešil vytvorením balíka `shared`, ktorý slúži ako „jediný zdroj pravdy“.

- **Zdieľané Rozhrania (Interfaces):** V tomto balíku definujem štruktúru všetkých objektov, ktoré prechádzajú cez sieť. Ak napríklad definujem rozhranie `IAdvertisement`, obe strany (API aj Frontend) presne vedia, aké polia (napr. `title`, `price`, `images`) má daný objekt obsahovať.
- **DTO (Data Transfer Objects):** Pomocou knižnice `class-validator` definujem v tomto balíku aj pravidlá pre validáciu vstupov. Tieto DTO triedy využíva NestJS na kontrolu prichádzajúcich požiadaviek a zároveň ich Next.js využíva na definovanie typov vo formulároch. Je dôležité zdôrazniť rozdelenie zodpovednosti: kým TypeScript stráži typy počas vývoja (compile-time), `class-validator` stráži dáta počas behu aplikácie (runtime) a overuje napríklad to, či je zadaný textový reťazec skutočne platným e-mailom.
- **End-to-End bezpečnosť:** Vďaka tomuto prepojeniu ma kompilátor TypeScriptu okamžite upozorní, ak na backende zmením názov poľa v databáze, ale na frontende sa ho stále pokúšam zobraziť. Týmto spôsobom som eliminoval veľké množstvo chýb, ktoré bežne vznikajú pri manuálnom prepisovaní typov.

### 3. Mechanizmus npm workspaces

Nástroj npm workspaces zabezpečuje, že všetky balíky v rámci monorepa sú navzájom prepojené prostredníctvom symbolických odkazov (symlinks). To znamená, že pri lokálnom vývoji nemusím balík `shared` zakaždým publikovať; zmeny vykonané v zdieľanom kóde sa okamžite prejavia vo všetkých aplikáciách, ktoré ho importujú. Tento mechanizmus je kľúčový pre agilný vývoj a rýchle prototypovanie nových funkcií. 

Okrem toho npm workspaces rieši problém s duplicitnými závislosťami (tzv. hoisting). Všetky aplikácie zdieľajú jeden spoločný priečinok `node_modules` v koreni projektu, čo výrazne šetrí miesto na disku a zrýchľuje inštaláciu závislostí.
