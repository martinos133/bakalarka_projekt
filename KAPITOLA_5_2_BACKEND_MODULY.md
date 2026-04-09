# 5.2 Realizácia backendových modulov

Každý modul v systéme pozostáva z troch základných vrstiev: Controller (vstupná brána a definícia endpointov), Service (aplikačná logika a komunikácia s databázou) a Module (konfigurácia závislostí).

## 1. Modul Auth: Autentifikácia a autorizácia

Tento modul je zodpovedný za bezpečnosť a správu identít. Implementácia využíva knižnicu `@nestjs/passport` a stratégie pre JWT.

- **Registrácia a Login:** Služba `AuthService` využíva bcrypt na porovnávanie hashovaných hesiel. Pri úspešnom prihlásení vygeneruje bezpečne podpísaný JWT token s exspiráciou. Payload tohto tokenu obsahuje identifikátor používateľa (`sub`) a jeho rolu (`role`), čo minimalizuje nutnosť dopytovať sa do databázy pri každom overovaní oprávnení.
- **Zabezpečenie:** Na ochranu endpointov som vytvoril globálne guardy. `JwtAuthGuard` extrahuje token z hlavičky `Authorization: Bearer` a validuje ho, zatiaľ čo `RolesGuard` v spolupráci s dekorátorom `@Roles()` kontroluje úroveň oprávnení (napr. prístup k mazaniu používateľov).

## 2. Modul Ads: Správa inzerátov a médií

Modul `AdsModule` je najrozsiahlejšou časťou backendu, nakoľko spracováva hlavnú entitu systému – inzerát.

- **CRUD operácie:** Implementoval som endpointy pre vytvorenie, čítanie, aktualizáciu a mazanie inzerátov. Pri vytváraní inzerátu sa automaticky generuje unikátny slug z názvu pre SEO účely.
- **Spracovanie polohy:** Inzeráty ukladajú GPS súradnice (latitúda, longitúda), ktoré sú nevyhnutné pre zobrazenie na mape vo frontende.
- **Stavy inzerátov:** Logika v `AdsService` zabezpečuje prechody medzi stavmi `PENDING` (čakajúci na schválenie), `ACTIVE` (viditeľný) a `ARCHIVED`.

*Ukážka schvaľovacieho procesu inzerátu z `AdvertisementsService`:*
```typescript
async approve(id: string) {
  const advertisement = await prisma.advertisement.findUnique({ where: { id } });

  if (!advertisement) throw new NotFoundException('Inzerát nebol nájdený');
  if (advertisement.status !== 'PENDING') throw new ForbiddenException('Inzerát už bol spracovaný');

  const updated = await prisma.advertisement.update({
    where: { id },
    data: { status: 'ACTIVE' },
  });

  // systémová správa o schválení pre používateľa
  await this.messagesService.createSystemMessage(
    advertisement.userId,
    'AD_APPROVED',
    'Váš inzerát bol schválený',
    `Váš inzerát "${advertisement.title}" bol schválený a je teraz aktívny na platforme.`,
    { advertisementId: id }
  );

  return updated;
}
```
Táto ukážka jasne demonštruje, ako je služba napísaná odolne voči chybám (využitím `NotFoundException` a `ForbiddenException`). Kombinuje validáciu stavu, aktualizáciu v databáze a komunikáciu s iným modulom (`MessagesService`) pre odoslanie notifikácie používateľovi ako vedľajší efekt.

## 3. Modul Categories a dynamické filtre

Tento modul spravuje hierarchickú štruktúru portálu.

- **Stromová štruktúra:** Kategórie podporujú rekurzívne vnorenie (Parent-Child). API vracajú stromovú štruktúru dát, ktorá sa využíva v navigačnom menu platformy.
- **Logika filtrov:** Každá kategória môže mať pridelenú sadu filtrov. Služba zabezpečuje, že pri vyhľadávaní v kategórii "Autá" sa vrátia inzeráty filtrované podľa špecifických polí uložených v JSON objekte v databáze. Využívam tu schopnosť Prisma ORM dopytovať sa priamo do vnútra `JSONB` stĺpcov, čím sa zachováva vysoký výkon vyhľadávania aj pri neštruktúrovaných dátach.

## 4. Modul Search: Full-textové vyhľadávanie a analytika

Pre efektívne vyhľadávanie som implementoval dedikovanú logiku, ktorá kombinuje viaceré parametre.

- **Filtrovanie:** Vyhľadávanie prebieha kombináciou full-textového hľadania v názve a popise inzerátu s presným filtrovaním podľa kategórie, ceny a lokality.
- **ClickEvent integrácia:** Každé zobrazenie detailu inzerátu vyvolá asynchrónne volanie v `AnalyticsService`, ktoré zaznamená udalosť `ClickEvent`. Vďaka asynchrónnemu spracovaniu „na pozadí“ používateľ vôbec nečaká na zapísanie štatistiky do databázy a inzerát sa mu zobrazí okamžite. Tieto dáta sa ukladajú s informáciou o type používateľa (pohlavie, vek), čo neskôr slúži na generovanie štatistík v admin paneli.
