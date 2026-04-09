## 3.3 Návrh architektúry: Model klient–server v prostredí monorepa

Architektúra systému je postavená na modernom koncepte monorepa, ktorý umožňuje efektívnu správu viacerých samostatných aplikácií a zdieľaných knižníc v rámci jedného úložiska (repozitára). Celý ekosystém je rozdelený na klientske aplikácie (front-end) a centrálny server (back-end), ktoré medzi sebou komunikujú prostredníctvom protokolu HTTP a formátu JSON.

### 1. Štruktúra monorepa a zdieľanie kódu

Projekt využíva nástroj npm workspaces, ktorý zabezpečuje logické rozdelenie kódu do dvoch hlavných kategórií: aplikácie (`apps/`) a balíčky (`packages/`).

- **Aplikácie (`apps/`):** Obsahujú tri nezávislé Next.js aplikácie s App Routerom (verzia 16+): verejnú platformu (`apps/platform`), používateľské konto (`apps/user`) a administráciu (`apps/admin`). Štvrtou aplikáciou je centrálny NestJS API server (`apps/api`).
- **Zdieľané balíčky (`packages/`):** Kľúčovým prvkom je balík `packages/shared`, ktorý obsahuje spoločné TypeScript typy, enumerátory (napr. `UserRole`, `AdvertisementStatus`) a DTO (Data Transfer Objects). Vďaka tomu je zaručené, že ak sa zmení štruktúra dát na backende, zmena sa okamžite premietne aj do frontendu, čím sa predchádza nekonzistenciám a chybám pri kompilácii.
- **Databázový balík:** Balík `packages/database` obsahuje definíciu Prisma schémy (`schema.prisma`), vygenerovaného Prisma klienta a migračné skripty. Týmto je prístup k databáze centralizovaný a zdieľaný pre potreby API.

### 2. Model klient–server

Systém funguje na princípe striktného oddelenia prezentácie od aplikačnej logiky a ukladania dát.

- **Backend API (Server):** Je postavený na frameworku NestJS a funguje ako centrálny bod systému. Zabezpečuje komunikáciu s databázou PostgreSQL cez Prisma ORM, vykonáva striktnú validáciu dát (pomocou `ValidationPipe` a `class-validator`) a overuje oprávnenia používateľov cez JWT tokeny (pomocou `Passport.js`). API zároveň poskytuje automaticky generovanú Swagger dokumentáciu (`/api/docs`).
- **Klientske aplikácie (Klienti):** Tri samostatné aplikácie v Next.js komunikujú s API prostredníctvom asynchrónnych HTTP požiadaviek (typicky smerovaných na `NEXT_PUBLIC_API_URL`). Tento prístup umožňuje, aby každá časť systému fungovala nezávisle a mala vlastné, optimalizované používateľské rozhranie prispôsobené konkrétnej role (napr. vizuálny editor GrapesJS v admin paneli vs. interaktívna mapa Leaflet na verejnej platforme).

### 3. Dátový tok a komunikácia

Keď používateľ vykoná akciu (napríklad pridá nový inzerát), proces prebieha v nasledujúcich krokoch:

1. **Iniciácia na klientovi:** Frontend (napr. `apps/user`) zhromaždí dáta z formulára a odošle HTTP `POST` požiadavku. Dáta sú už na strane klienta typované podľa zdieľaných DTO typov z balíka `shared`. Do hlavičky `Authorization` je vložený JWT token prihláseného používateľa.
2. **Prijatie a validácia na serveri:** API server prijme požiadavku. Najprv overí identitu používateľa cez `JwtAuthGuard` (prípadne rolu cez `RolesGuard`). Následne globálna `ValidationPipe` skontroluje telo požiadavky voči DTO triede (odstráni neznáme polia a overí povinné parametre).
3. **Zápis do databázy:** Ak sú dáta validné, príslušný kontrolér (napr. `AdvertisementsController`) posunie požiadavku do aplikačnej služby (`AdvertisementsService`), ktorá pomocou Prisma ORM vykoná asynchrónny zápis do PostgreSQL databázy.
4. **Odpoveď servera:** Server vráti odpoveď v JSON formáte (napr. vytvorený objekt inzerátu s vygenerovaným UUID a HTTP status kódom 201 Created).
5. **Aktualizácia používateľského rozhrania:** Frontend prijme odpoveď a zareaguje aktualizáciou rozhrania (napr. presmerovaním používateľa na detail novovytvoreného inzerátu alebo zobrazením notifikácie o úspechu).
