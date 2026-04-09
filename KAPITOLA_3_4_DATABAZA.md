## 3.4 Databázový model a entitno-relačný diagram (ERD)

Pre potreby perzistencie dát využívam relačnú databázu PostgreSQL, ktorá je v rámci vývoja spravovaná pomocou nástroja Prisma ORM. Tento prístup mi umožňuje definovať dátový model v prehľadnom deklaratívnom formáte (`schema.prisma`) a následne automaticky generovať migračné skripty a typovo bezpečný klient pre backendovú aplikáciu.

### Hlavné entity systému a ich význam

Logický model databázy pozostáva z niekoľkých kľúčových entít, ktoré sú navzájom prepojené reláciami typu 1:N (one-to-many) alebo M:N (many-to-many).

- **User (Používateľ):** Predstavuje identitu v systéme. Okrem základných údajov ako e-mail a hashované heslo obsahuje informácie o roli (`ADMIN` / `USER`), firemné údaje pre predajcov (IČO, DIČ, `isCompany`), predajný plán (`SellerPlan`) a polia súvisiace s moderáciou, ako sú `banned`, `bannedUntil` a `banReason`.

- **Advertisement (Inzerát):** Centrálna entita obsahujúca detaily o ponúkanej službe alebo prenájme (`AdvertisementType`). Inzerát je viazaný na konkrétneho autora (používateľa) a kategóriu. Obsahuje stavy definované enumerátorom `AdvertisementStatus` (`PENDING`, `DRAFT`, `ACTIVE`, `INACTIVE`, `ARCHIVED`), lokalitu (GPS súradnice `latitude`, `longitude`), cenu a špecifikácie uložené vo formáte JSON (`specifications`) pre maximálnu flexibilitu parametrov bez nutnosti meniť databázovú schému pri každom novom parametri.

- **Category (Kategória):** Zabezpečuje hierarchické usporiadanie inzerátov. Podporuje vnorenie (parent-child relácie cez `parentId`), obsahuje SEO polia (`metaTitle`, `metaDescription`, `slug`) a definuje poradie zobrazenia v navigácii (`order`).

- **Filter (Dynamický filter):** Úzko spolupracuje s kategóriami. Definuje, aké dodatočné parametre (napr. typ `TEXT`, `NUMBER`, `SELECT`, `MULTISELECT`, definované v `FilterType`) môže používateľ pri inzeráte v danej kategórii zadať a podľa čoho môže návštevník vyhľadávať. Umožňuje tak dynamické rozširovanie vlastností inzerátov podľa ich zaradenia.

- **Message (Správa):** Realizuje komunikačný kanál medzi záujemcom a inzerentom, ale aj systémové notifikácie (`MessageType`). Správy sú logicky zoskupované do konverzácií (vlákien) pomocou odkazu na rodičovskú správu (`parentId`), čo umožňuje prehľadné zobrazenie chatu v používateľskom rozhraní.

- **Favorite (Obľúbené):** Spojovacia entita realizujúca reláciu M:N medzi používateľom a inzerátmi, ktoré si uložil na neskoršie prehliadnutie.

- **Report (Nahlásenie):** Slúži na moderáciu obsahu. Uchováva informáciu o sťažnosti na konkrétny inzerát, dôvod nahlásenia (`ReportReason` - napr. `SPAM`, `SCAM`, `FAKE`) a stav riešenia administrátorom (`ReportStatus`).

- **Payment (Platba):** Zaznamenáva finančné transakcie medzi záujemcom (`renter`) a vlastníkom inzerátu (`owner`), pričom sleduje stav platby (`PaymentStatus`) a obdobie prenájmu/poskytnutia služby.

- **StaticPage a BlogPost (CMS obsah):** Slúžia na správu obsahu priamo z admin panelu. Obsahujú HTML text, SEO metadáta a stav publikovania (`DRAFT` / `PUBLISHED`), čím umožňujú administrátorom upravovať informačné podstránky a blog bez zásahu do kódu.

- **ClickEvent (Analytika):** Špeciálna entita určená na zber údajov o správaní používateľov. Zaznamenáva typ interakcie (`eventType`), cieľový inzerát alebo kategóriu a segmentačné údaje (pohlavie, typ účtu), čo slúži ako podklad pre administratívne štatistiky a grafy.

### Entitno-relačný diagram (ERD)

ER diagram vizualizuje prepojenia medzi týmito entitami.

*   Relácia medzi `User` a `Advertisement` je typu **1:N**, keďže jeden používateľ môže vytvoriť viacero inzerátov, ale inzerát patrí vždy jednému autorovi.
*   Podobne `Category` a `Advertisement` tvoria vzťah **1:N**, kde každá kategória zastrešuje množinu prislúchajúcich ponúk.
*   Entita `Category` má definovanú **unárnu reláciu 1:N** sama na seba (cez `parentId`), čím sa vytvára stromová štruktúra (hlavné kategórie a podkategórie).
*   Entita `Favorite` predstavuje klasickú dekompozíciu vzťahu **M:N** medzi používateľom a inzerátom.
*   Entita `Payment` prepája inzerát s dvoma používateľmi (vlastníkom a platcom), čo vytvára komplexnejšiu sieť vzťahov nad tabuľkou používateľov.

*(Poznámka pre prácu: Na toto miesto v dokumente je vhodné vložiť vygenerovaný obrázok ER diagramu z Prisma schémy a označiť ho ako Obrázok X: Entitno-relačný diagram databázy).*
