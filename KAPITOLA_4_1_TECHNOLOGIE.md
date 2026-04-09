# 4 Metodika a použité technológie

Pri vývoji komplexnej inzertnej platformy som zvolil prístup, ktorý kladie dôraz na rýchlosť vývoja, bezpečnosť kódu a jednoduchú údržbu. Celý ekosystém je postavený na moderných JavaScriptových technológiách, ktoré umožňujú zdieľanie logiky medzi serverovou a klientskou časťou.

## 4.1 Full-stack vývoj v jazyku TypeScript

Základným stavebným kameňom celého projektu je jazyk TypeScript. Ide o nadstavbu JavaScriptu, ktorá do dynamického sveta webového vývoja prináša statické typovanie. Pre projekt tohto rozsahu, kde komunikujú tri frontendové aplikácie s jedným API, je použitie TypeScriptu kľúčovým rozhodnutím z niekoľkých dôvodov:

### 1. Typová bezpečnosť a eliminácia chýb
TypeScript umožňuje definovať presné štruktúry dát (rozhrania a typy) už počas písania kódu. Vďaka tomu dokáže vývojové prostredie (IDE) okamžite upozorniť na chyby, ktoré by sa v čistom JavaScripte prejavili až počas behu aplikácie (napr. prístup k neexistujúcemu poľu objektu). V projekte sú takto ošetrené všetky kľúčové entity, ako sú inzeráty, používatelia či správy. Zatiaľ čo TypeScript zabezpečuje internú konzistenciu kódu počas vývoja (compile-time), v kombinácii s knižnicou `class-validator` na backende garantuje, že do systému nevstúpia nevalidné dáta ani z externých HTTP požiadaviek (runtime).

### 2. Zdieľanie kódu v monorepe
Využitie TypeScriptu v prostredí monorepa mi dovoľuje vytvoriť balík `packages/shared`, kde sú definované DTO (Data Transfer Objects). Tieto objekty slúžia ako záväzný kontrakt medzi backendom a frontendom.

Keď v `api` zmením štruktúru odpovede pre detail inzerátu, TypeScript ma v aplikáciách `platform` alebo `admin` automaticky upozorní na všetkých miestach, kde je potrebné kód aktualizovať.

Tento mechanizmus zabezpečuje end-to-end typovú bezpečnosť, čo dramaticky zvyšuje stabilitu systému pri zmenách v databázovom modeli.

*Príklad zdieľaného DTO v balíku `packages/shared` (využitie tried pre runtime validáciu):*
```typescript
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateAdvertisementDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  price?: number;
  
  // ...
}
```
*(Poznámka: V NestJS sa pre DTO odporúča používať triedy (`class`) namiesto rozhraní (`interface`). Dôvodom je, že rozhrania v JavaScripte po kompilácii úplne zmiznú, kým triedy zostávajú zachované aj v runtime. To umožňuje knižniciam ako `class-validator` alebo Swagger čítať metadáta o typoch polí.)*

### 3. Lepšia čitateľnosť, dokumentácia a Developer Experience (DX)
Kód napísaný v TypeScripte je v podstate „samodokumentovateľný“. Akýkoľvek iný vývojár (alebo administrátor systému) dokáže z definícií typov okamžite pochopiť, aké dáta funkcia prijíma a čo vracajú jednotlivé API endpointy. To je dôležité najmä pri modulárnej architektúre NestJS, kde sú jednotlivé služby a kontroléry jasne definované pomocou dekorátorov a typov.

Zároveň TypeScript výrazne zlepšuje *Developer Experience (DX)* vďaka autokompletizácii (IntelliSense) v moderných IDE (ako je VS Code). Pre vývojára to znamená, že nemusí neustále prepínať okná a pozerať sa do databázovej schémy, pretože mu editor sám našepkáva dostupné polia inzerátu alebo používateľa.

### 4. Moderné funkcie, dekorátory a kompatibilita
TypeScript mi umožňuje využívať najnovšie funkcie jazyka ECMAScript (ako asynchrónne funkcie, deštrukturalizáciu či voliteľné reťazenie), ktoré sú následne kompilované do optimalizovaného JavaScriptu. To zaručuje, že aplikácia beží efektívne v prostredí Node.js na serveri aj v moderných webových prehliadačoch.

Keďže backend využíva NestJS, naplno sa tu prejavuje sila TypeScriptu aj cez dekorátory (`@Controller`, `@Get`, `@Injectable`). Tie umožňujú reflexiu metadát, čo je pokročilá funkcia, vďaka ktorej NestJS vie, ako poskladať závislosti (Dependency Injection).
