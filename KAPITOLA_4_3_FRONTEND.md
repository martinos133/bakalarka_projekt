    # 4.3 Frontend: Next.js (App Router), React a Tailwind CSS

    Frontendová architektúra pozostáva z troch samostatných aplikácií (`platform`, `user`, `admin`), ktoré zdieľajú rovnaký technologický základ. Tento prístup umožňuje izolovať používateľské rozhrania podľa ich účelu, pričom sa zachováva konzistentný vývojový proces.

    ## 1. Next.js a architektúra App Router

    Použitie Next.js (verzia 16+) prináša do projektu revolučný prístup k vykresľovaniu stránok prostredníctvom App Routera.

    - **React Server Components (RSC):** Väčšina komponentov je predvolene vykresľovaná na strane servera. To znamená, že klient dostane hotový HTML dokument, čo dramaticky zrýchľuje prvé načítanie stránky a zlepšuje SEO, keďže vyhľadávače nemusia spúšťať zložitý JavaScript, aby videli obsah inzerátov. Okrem výkonu prinášajú RSC aj bezpečnostné výhody – umožňujú pristupovať k citlivým dátam alebo environmentálnym premenným (napr. API kľúčom) priamo na serveri bez toho, aby boli tieto údaje odoslané do prehliadača klienta.
    - **Smerovanie (File-based Routing):** Next.js využíva adresárovú štruktúru na definovanie trás. Vďaka tomu je navigácia v aplikácii intuitívna a podporuje pokročilé funkcie ako paralelné trasy alebo intercepcia trás (napr. zobrazenie detailu inzerátu v modálnom okne bez straty kontextu zoznamu).
    - **Optimalizácia:** Framework automaticky optimalizuje obrázky, fonty a skripty, čo zabezpečuje plynulý chod aplikácie aj na slabších mobilných zariadeniach.

    ## 2. Deklaratívne UI s knižnicou React

    Samotné používateľské rozhranie je postavené na knižnici React. Využívam moderné koncepty ako Hooks (`useState`, `useEffect`, `useMemo`) na správu stavu a vedľajších účinkov.

    - **Komponentový prístup:** Každý prvok rozhrania (tlačidlo, karta inzerátu, vyhľadávací panel) je samostatný znovupoužiteľný komponent. To uľahčuje údržbu kódu a zabezpečuje vizuálnu jednotnosť naprieč všetkými tromi aplikáciami v monorepe.

    *Príklad komponentu s využitím podmienkového renderovania a Tailwind CSS (ukážka z `CreateAdvertisementWizard`):*
    ```tsx
    function CategoryVisualTile({ cat, selected, onSelect, tileVariant = 'platform' }) {
    const isAdmin = tileVariant === 'admin';
    return (
        <button
        type="button"
        onClick={onSelect}
        className={
            isAdmin
            ? `group flex flex-col items-center rounded-xl border-2 bg-card px-2 py-5 text-center transition-all ${
                selected ? 'border-primary ring-2 ring-primary/25' : 'border-card hover:border-primary/40'
                }`
            : `group flex flex-col items-center rounded-2xl border-2 bg-white px-2 py-5 text-center transition-all ${
                selected ? 'border-[#1dbf73] ring-2 ring-[#1dbf73]/25' : 'border-white/80 hover:border-[#1dbf73]/40'
                }`
        }
        >
        <span className={isAdmin ? 'text-white' : 'text-gray-900'}>{cat.name}</span>
        </button>
    );
    }
    ```
    Táto ukážka demonštruje, ako jeden komponent dokáže dynamicky meniť svoj vzhľad na základe toho, či je vykresľovaný vo verejnej platforme alebo v administrátorskom rozhraní.

    - **Klientska interaktivita a Hydratácia:** Kým jadro stránky je serverové, interaktívne prvky (napr. chat, mapové filtre alebo formuláre) využívajú klientske komponenty (označené direktívou `'use client'`). Pri kombinácii týchto prístupov dochádza k procesu zvanému *hydratácia*. Next.js najprv pošle na klienta statické HTML pre rýchle zobrazenie obsahu a následne toto rozhranie „oživí“ pomocou JavaScriptu, čím sa dosiahne plná interaktivita a okamžitá odozva na akcie používateľa.

    ## 3. Styling pomocou Tailwind CSS

    Na definovanie vizuálnej identity platformy som zvolil Tailwind CSS, čo je utility-first CSS framework.

    - **Rýchlosť vývoja a Purging:** Namiesto písania tisícok riadkov v samostatných CSS súboroch definujem štýly priamo v HTML/JSX pomocou predpripravených tried. Tailwind počas zostavovania (build) aplikácie analyzuje zdrojové súbory a do výsledného CSS zahrnie iba tie triedy, ktoré sú skutočne použité. Tento proces (scanning/purging) eliminuje „mŕtvy kód“ (dead code) a výsledný štýl pre celú platformu má často veľkosť len niekoľko desiatok kilobajtov.
    - **Responzivita a Mobile-first:** Tailwind natívne podporuje responzívny dizajn. Vďaka tomu bolo možné jednoducho implementovať rozhranie, ktoré sa automaticky prispôsobuje od malých displejov smartfónov až po veľké desktopové monitory.
    - **Konzistencia:** Využitie konfiguračného súboru `tailwind.config.js` zabezpečuje, že farby, písma a rozostupy sú identické vo všetkých aplikáciách, čo buduje profesionálny dojem z platformy.

    ## 4. Integrácia s mapovými podkladmi (Leaflet)

    Pre inzertný portál je kľúčová vizualizácia polohy. Vo fronte aplikácie `platform` využívam knižnicu Leaflet v kombinácii s React komponentmi. Táto integrácia umožňuje návštevníkom dynamicky prehliadať inzeráty na interaktívnej mape, pričom dáta o polohe (latitúda a longitúda) sú v reálnom čase sťahované z NestJS API. 

Keďže knižnice ako Leaflet pracujú priamo s objektom `window`, ktorý na serveri neexistuje, bolo nutné vyriešiť kompatibilitu so Server-Side Renderingom (SSR). V Next.js sa takéto klientske knižnice načítavajú asynchrónne pomocou funkcie `dynamic(() => import(...), { ssr: false })`. Toto riešenie zabezpečí, že sa mapa inicializuje až priamo v prehliadači používateľa, čím sa predíde chybám pri renderovaní na serveri.
