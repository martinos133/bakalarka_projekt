# 3.5 Návrh REST API rozhrania a autentifikačného mechanizmu (JWT)

Komunikácia v systéme prebieha prostredníctvom REST API (Representational State Transfer), ktoré využíva protokol HTTP a formát JSON na výmenu údajov. API je navrhnuté ako bezstavové, čo znamená, že každá požiadavka od klienta musí obsahovať všetky informácie potrebné na jej spracovanie, vrátane overenia identity.

## 1. Návrh endpointov a smerovania

API je logicky rozdelené do modulov, ktoré zodpovedajú doménam v databáze. Každý modul definuje sadu koncových bodov (endpointov) pre operácie CRUD (Create, Read, Update, Delete) a špecifickú biznis logiku.

| Modul | Základná cesta | Významné operácie |
| :--- | :--- | :--- |
| **Auth** | `/auth` | Registrácia, prihlásenie, získanie profilu prihláseného používateľa. |
| **Advertisements** | `/advertisements` | Vyhľadávanie, tvorba inzerátov, schvaľovanie (admin), mapa. |
| **Messages** | `/messages` | Odosielanie dopytov, správa konverzácií a chat. |
| **Analytics** | `/analytics` | Zaznamenávanie kliknutí (`/click`) a generovanie reportov. |

Všetky endpointy sú zdokumentované pomocou nástroja Swagger, ktorý je prístupný na adrese `GET /api/docs`. Táto dokumentácia slúži ako kontrakt medzi backendom a frontendovými tímami (v tomto prípade aplikáciami platform, user a admin).

## 2. Autentifikačný mechanizmus (JWT)

Na zabezpečenie prístupu k chráneným zdrojom využíva platforma JSON Web Token (JWT). Tento mechanizmus umožňuje overiť identitu používateľa bez nutnosti ukladať informácie o relácii (session) na serveri.

**Proces autentifikácie a autorizácie:**

1. **Prihlásenie:** Používateľ odošle prihlasovacie údaje na `/auth/login`. Server overí heslo (pomocou bcrypt s 10 salt rounds) a ak je správne, vygeneruje podpísaný JWT token.
2. **Payload tokenu:** Token obsahuje zakódované informácie ako `userId`, `email` a `role` (`ADMIN` alebo `USER`).
3. **Autorizované požiadavky:** Klient ukladá token a posiela ho v hlavičke každého ďalšieho volania: `Authorization: Bearer <token>`.
4. **Validácia na serveri:** API využíva `JwtAuthGuard` na overenie podpisu tokenu a `RolesGuard` na kontrolu, či má používateľ dostatočné oprávnenia (napr. prístup do admin panelu).

## 3. Validácia a transformácia údajov

Pre zabezpečenie integrity systému je každá prichádzajúca požiadavka validovaná pomocou DTO (Data Transfer Objects). Využitie globálneho `ValidationPipe` v NestJS zabezpečuje:

- **Whitelist:** Odstránenie polí, ktoré nie sú definované v DTO, čím sa bráni neoprávneným zmenám v databáze.
- **Transformácia:** Automatický prevod reťazcov z URL parametrov na číselné typy alebo objekty, čo zjednodušuje prácu v službách (services).

## 4. Spracovanie chýb (Error Handling)

API využíva štandardizované HTTP status kódy (napr. `400 Bad Request` pre chyby validácie, `401 Unauthorized` pre neautorizovaný prístup, `403 Forbidden` pre nedostatočné práva a `404 Not Found` pre nenájdené zdroje). Systém vracia jednotný formát chybových hlásení vo formáte JSON, čo umožňuje ich ľahšie a konzistentné spracovanie na strane klientskych aplikácií (frontendu).

Tento návrh API a bezpečnosti zaručuje, že platforma je robustná, odolná voči bežným útokom a pripravená na komunikáciu s rôznymi typmi klientskych zariadení.
