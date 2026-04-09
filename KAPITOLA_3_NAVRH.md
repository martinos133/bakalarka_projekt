# 3 Analýza a návrh systému

Návrh systému vychádza z rozdelenia platformy na štyri základné časti: verejná platforma, používateľské konto, admin panel a backend API. Tento prístup, realizovaný pomocou monorepo štruktúry a oddelených Next.js aplikácií, umožňuje presne definovať oprávnenia pre rôzne skupiny používateľov a izolovať ich používateľské rozhrania.

## 3.1 Funkčné požiadavky

Funkčné požiadavky sú rozdelené podľa rolí, ktoré v systéme vystupujú. Každá rola má priradený špecifický rozsah akcií, ktoré môže v rámci aplikácie vykonávať. Na úrovni databázy je rola používateľa definovaná enumerátorom `UserRole` (s hodnotami `ADMIN` a `USER`).

### 1. Rola: Návštevník (Neprihlásený používateľ)

Návštevník je anonymný používateľ, ktorý primárne konzumuje verejne dostupný obsah bez potreby registrácie.

- **Prehliadanie obsahu:** Používateľ môže prehliadať kategórie, zoznamy inzerátov a detaily jednotlivých ponúk.
- **Vyhľadávanie a filtrácia:** Možnosť vyhľadávať inzeráty podľa kľúčových slov a filtrovať výsledky na základe dynamických parametrov kategórie.
- **Mapové zobrazenie:** Prístup k interaktívnej mape, ktorá vizualizuje polohu inzerovaných služieb a prenájmov.
- **Čítanie blogu:** Možnosť čítať publikované články a statické informačné stránky (napr. podmienky používania).
- **Registrácia:** Návštevník má možnosť vytvoriť si používateľský účet.

### 2. Rola: Používateľ (Registrovaný člen)

Používateľ má po prihlásení prístup k funkciám, ktoré umožňujú aktívnu participáciu na trhu služieb. Prístup k týmto funkciám je na backende chránený pomocou JWT autentifikácie (v NestJS implementovanej cez `JwtAuthGuard`).

- **Správa profilu:** Úprava osobných údajov, firemných údajov (napr. IČO, DIČ) a zmena prístupového hesla.
- **Manažment inzerátov:** Tvorba nových inzerátov (služba alebo prenájom), ich úprava, mazanie a sledovanie stavu schválenia. V databáze môže inzerát nadobúdať stavy definované enumerátorom `AdvertisementStatus` (`PENDING`, `DRAFT`, `ACTIVE`, `INACTIVE`, `ARCHIVED`).
- **Komunikačný modul:** Odosielanie a prijímanie správ (dopytov) k inzerátom prostredníctvom integrovaného chatu.
- **Obľúbené položky:** Ukladanie zaujímavých inzerátov do vlastného zoznamu pre neskorší návrat (entita `Favorite`).
- **Nahlasovanie (Reportovanie):** Možnosť nahlásiť inzerát, ktorý porušuje pravidlá platformy.

### 3. Rola: Administrátor

Administrátor má najvyššiu úroveň oprávnení a dohliada na technický a obsahový chod platformy cez dedikovaný admin panel. Na úrovni API sú tieto endpointy chránené kombináciou `JwtAuthGuard` a vlastného `RolesGuard`, ktorý overuje, či má prihlásený používateľ rolu `ADMIN`.

*Ukážka zabezpečenia administrátorského endpointu v NestJS:*

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  // ...
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }
}
```

- **Moderácia obsahu:** Schvaľovanie, zamietanie alebo archivácia inzerátov a riešenie prijatých nahlásení od používateľov.
- **Správa používateľov:** Prehľad o registrovaných členoch s možnosťou udelenia dočasného alebo trvalého banu (blokovania účtu). Databázový model `User` obsahuje na tento účel polia `banned`, `bannedUntil` a `banReason`.
- **CMS (Content Management System):** Tvorba a editácia statických stránok, blogových príspevkov a správa položiek v navigačnom menu.
- **Konfigurácia systému:** Nastavovanie kategórií, hierarchie filtrov a globálnych parametrov platformy.
- **Analytika a prehľady:** Sledovanie štatistík návštevnosti, kliknutí (`ClickEvent`) a trendov v inzercii prostredníctvom grafov.
