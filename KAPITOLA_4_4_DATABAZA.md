# 4.4 Perzistencia dát: PostgreSQL a Prisma ORM

Efektívna správa dát je základom každej úspešnej webovej aplikácie. V mojom projekte som sa rozhodol pre technologický zásobník, ktorý zaručuje integritu údajov, vysoký výkon pri zložitých dopytoch a vynikajúcu skúsenosť pri vývoji v TypeScripte.

## 1. Relačná databáza PostgreSQL

Ako úložisko dát som zvolil PostgreSQL, čo je pokročilá open-source objektovo-relačná databáza.

- **Spoľahlivosť a integrita:** PostgreSQL striktne dodržiava princípy ACID (Atomicity, Consistency, Isolation, Durability), čo je nevyhnutné pri operáciách, ako je registrácia používateľa alebo spracovanie správ, kde nesmie dôjsť k strate či poškodeniu dát.
- **Podpora geografických dát:** Vzhľadom na to, že platforma využíva mapové podklady, PostgreSQL je ideálnou voľbou vďaka svojej schopnosti efektívne pracovať so súradnicami a priestorovými dopytmi.
- **Výkon pri vyhľadávaní:** Databáza umožňuje vytvárať indexy nad kľúčovými poľami (napr. `slug`, `categoryId`, `createdAt`), čo zabezpečuje bleskovú odozvu pri filtrovaní tisícok inzerátov.
- **Flexibilita s JSONB:** Využitie typu JSONB v PostgreSQL mi umožňuje ukladať dynamické parametre inzerátov (špecifikácie) s vysokým výkonom, pričom nad týmito dátami je možné vykonávať efektívne dopyty takmer rovnako rýchlo ako nad klasickými stĺpcami.

## 2. Prisma ORM (Object-Relational Mapping)

Na komunikáciu medzi NestJS backendom a databázou PostgreSQL využívam Prisma ORM. Na rozdiel od tradičných ORM nástrojov, Prisma funguje na báze deklaratívnej schémy, ktorá slúži ako jediný zdroj pravdy (Single Source of Truth) pre celý projekt.

- **Typová bezpečnosť (Type-safety):** Prisma automaticky generuje TypeScript klient priamo do priečinka `node_modules` na základe definovanej schémy (`schema.prisma`). Vďaka tomu vývojové prostredie (napr. VS Code) presne vie, aké polia má napríklad model `User`, bez nutnosti ručného písania TypeScript rozhraní pre databázu. Pri písaní databázových dopytov tak mám k dispozícii kompletné automatické dopĺňanie kódu a kompilátor ma upozorní na akúkoľvek nezrovnalosť.
- **Prisma Schema:** V tomto súbore definujem nielen tabuľky (modely), ale aj ich vzájomné vzťahy (napr. `@relation` medzi inzerátom a autorom) a enumerátory (`enum`) pre stavy inzerátov či roly používateľov.
- **Migrácie (Prisma Migrate):** Každú zmenu v štruktúre databázy spravujem pomocou migrácií. Prisma sleduje históriu zmien a umožňuje ich bezpečné a reprodukovateľné nasadenie na produkčný server, čím sa eliminuje riziko manuálnych chýb pri správe SQL skriptov.
- **Výkon a optimalizácia (SQL vs. ORM):** Hoci použitie ORM môže v porovnaní s čistým SQL priniesť mierny režijný náklad (overhead), Prisma je vysoko optimalizovaná a generuje efektívne SQL dopyty. Tento minimálny rozdiel vo výkone je bohato kompenzovaný elimináciou ľudských chýb pri písaní dopytov a obrovským zrýchlením vývoja vďaka typovej bezpečnosti.

## 3. Prospech pre Monorepo architektúru

V rámci monorepa je Prisma umiestnená v samostatnom balíku `packages/database`. Tento prístup umožňuje:

- **Zdieľanie schémy:** API aplikácia využíva vygenerovaný klient na zápis a čítanie dát, zatiaľ čo ostatné časti projektu môžu využívať vygenerované typy pre validáciu.
- **Jednoduchá údržba:** Ak potrebujem pridať nové pole do inzerátu (napríklad „vratná kaucia“), zmením to na jednom mieste v schéme, spustím migráciu a zmena sa okamžite prejaví v celom vývojovom prostredí.
