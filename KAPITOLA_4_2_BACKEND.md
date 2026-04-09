# 4.2 Backend: Framework NestJS a modulárna architektúra

Backendová časť aplikácie (`apps/api`) je vyvinutá v prostredí NestJS. Ide o progresívny framework pre Node.js, ktorý využíva TypeScript a kombinuje prvky objektovo orientovaného programovania, funkcionálneho programovania a reaktívneho programovania.

## 1. Modulárna štruktúra a organizácia kódu

Hlavnou výhodou NestJS je jeho striktná modulárna architektúra. Každá logická časť platformy je zapuzdrená do samostatného modulu, ktorý obsahuje vlastné kontroléry, služby a dátové modely.

- **Zapuzdrenie logiky:** Napríklad `AdvertisementsModule` sa stará výhradne o inzeráty, zatiaľ čo `AuthModule` rieši autentifikáciu. Tieto moduly sú navzájom nezávislé a striktne dodržiavajú princíp jednej zodpovednosti (Single Responsibility Principle - SRP), čo uľahčuje testovanie a umožňuje pridávanie nových funkcií (napr. platobný modul) bez rizika narušenia existujúceho kódu. Všetky tieto doménové moduly sú následne spojené do jedného hlavného stromu aplikácie prostredníctvom koreňového modulu (`app.module.ts`).
- **Dekorátory a metadáta:** NestJS intenzívne využíva dekorátory (napr. `@Get()`, `@Post()`, `@UseGuards()`), ktoré robia kód čitateľnejším a deklaratívnym. Už na prvý pohľad je jasné, ktorý endpoint je verejný a ktorý vyžaduje administrátorské oprávnenia.

*Príklad použitia dekorátorov v kontroléri (ukážka z `AdvertisementsController`):*
```typescript
@Controller('advertisements')
export class AdvertisementsController {
  constructor(private readonly advertisementsService: AdvertisementsService) {}

  @Get('pending/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findPending() {
    return this.advertisementsService.findPending();
  }
}
```
V tejto ukážke je jasne vidieť, ako dekorátory `@UseGuards` a `@Roles` zabezpečujú ochranu endpointu tak, aby k nemu mal prístup iba administrátor.

## 2. Dependency Injection (Injektovanie závislostí)

Framework využíva návrhový vzor Dependency Injection (DI), ktorý automatizuje správu inštancií tried. 

V praxi to znamená, že ak služba `AdsService` potrebuje pristupovať k databáze cez `PrismaService`, stačí túto závislosť definovať v konštruktore a NestJS sa postará o jej vytvorenie a prepojenie. 

Tento prístup zvyšuje modularitu a umožňuje jednoduchú výmenu komponentov, čo je v súlade s princípmi čistého kódu (Clean Code).

## 3. Middleware a Guardy pre bezpečnosť

NestJS poskytuje robustný systém na spracovanie životného cyklu požiadavky (Request Lifecycle). Každá prichádzajúca HTTP požiadavka prechádza presne definovanou cestou: najprv sa vykoná *Middleware*, následne *Guards* (strážcovia prístupu), *Interceptors* (zachytávače), *Pipes* (validácia a transformácia dát), až sa nakoniec dostane do samotného kontroléra a služby. Tento jasne štruktúrovaný tok umožňuje oddeliť biznis logiku od infraštruktúrnych a bezpečnostných úloh.

- **Guards (Strážcovia):** Využívam ich na ochranu endpointov. `JwtAuthGuard` overuje platnosť tokenu a `RolesGuard` kontroluje, či má používateľ rolu `ADMIN`.
- **Interceptors a Pipes:** Tieto nástroje slúžia na transformáciu dát (napr. úprava formátu odpovede) a ich validáciu. Vďaka `ValidationPipe` je zaručené, že do systému sa nedostanú nekorektné dáta, ktoré by mohli spôsobiť pád aplikácie alebo bezpečnostnú dieru.

## 4. Integrácia s Prisma ORM

NestJS sa výborne dopĺňa s nástrojom Prisma. V projekte som vytvoril dedikovaný `PrismaModule`, ktorý spracováva pripojenie k PostgreSQL databáze. Služba `PrismaService` priamo rozširuje triedu `PrismaClient` a využíva zabudované hooky životného cyklu NestJS, konkrétne `onModuleInit`. Vďaka tomu sa spojenie s databázou nadviaže hneď pri štarte aplikácie, čo zaručuje, že API nezačne prijímať požiadavky skôr, než je databáza plne pripravená.

Prisma funguje ako typovo bezpečný most (ORM), ktorý mi umožňuje pracovať s databázou pomocou bežných TypeScript objektov namiesto písania surových SQL dopytov. 

Výsledkom je kód, ktorý je menej náchylný na chyby a oveľa rýchlejšie sa vyvíja.
