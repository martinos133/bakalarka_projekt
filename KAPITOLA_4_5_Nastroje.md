# 4.5 Nástroje pre správu kódu a kontajnerizáciu

Efektívny vývoj softvéru vyžaduje nielen kvalitný kód, ale aj spoľahlivé nástroje na jeho verzovanie a orchestráciu služieb. V mojom projekte hrajú kľúčovú úlohu systémy Git a Docker, ktoré umožňujú bezpečnú správu verzií a izoláciu behového prostredia.

## 1. Verzovanie kódu pomocou systému Git

Systém Git je základným nástrojom na sledovanie zmien v zdrojovom kóde. V kontexte monorepa je jeho dôležitosť ešte vyššia, nakoľko spravuje históriu viacerých aplikácií a zdieľaných balíkov súčasne.

- **Vetvenie (Branching strategy):** Pri vývoji využívam logické rozdelenie funkcií do samostatných vetiev (napr. `feature/auth`, `feature/map-logic`). To umožňuje experimentovať s novými funkciami bez rizika narušenia stability hlavnej vetvy (`main`).
- **História a audit:** Git uchováva detailný prehľad o tom, kedy a prečo bola konkrétna zmena vykonaná. To je kľúčové pri hľadaní chýb (debugging) alebo pri návrate k predchádzajúcej stabilnej verzii aplikácie.
- **Ignorovanie súborov (`.gitignore`):** Pomocou tohto súboru zabezpečujem, že sa do repozitára nedostanú zbytočné dáta (napríklad vygenerované priečinky `node_modules`) alebo citlivé údaje (ako sú konfiguračné súbory `.env`).

## 2. Kontajnerizácia pomocou technológie Docker

Pre zabezpečenie konzistentného správania aplikácie som sa rozhodol pre Docker. Táto technológia umožňuje „zabaliť“ aplikáciu spolu so všetkými jej závislosťami (Node.js, knižnice, konfiguračné súbory) do izolovaného kontajnera.

- **Docker Image:** Každá časť systému (API, frontendy) má definovaný svoj vlastný `Dockerfile`. Ten obsahuje inštrukcie na zostavenie obrazu, čím sa eliminuje problém typu „u mňa v počítači to funguje“, pretože kontajner beží v identickom prostredí bez ohľadu na operačný systém hostiteľa.
- **Izolácia databázy:** Docker využívam aj na spustenie databázy PostgreSQL. Vďaka tomu nemusím databázový server inštalovať priamo do operačného systému, čo udržuje vývojové prostredie čisté a ľahko prenosné.

## 3. Orchestrácia služieb cez Docker Compose

Vzhľadom na to, že môj projekt pozostáva z viacerých súbežne bežiacich služieb (API, tri frontendy a databáza), využívam nástroj Docker Compose.

- **Konfigurácia jedným súborom:** Súbor `docker-compose.yml` definuje celý ekosystém aplikácie. Obsahuje informácie o portoch, prepojeniach medzi kontajnermi a environmentálnych premenných.
- **Jednoduchosť spustenia:** Celé komplexné prostredie je možné uviesť do prevádzky jediným príkazom `docker-compose up`. Tento prístup dramaticky zrýchľuje proces nasadenia (deployment) a uľahčuje spoluprácu, ak by sa na projekte podieľalo viacero vývojárov.
- **Bezpečnosť a siete (Networking):** Vďaka Docker Compose sú služby ako API a databáza prepojené v spoločnej internej virtuálnej sieti. To zvyšuje bezpečnosť, pretože databázový port nemusí byť vystavený do verejného internetu, ale je prístupný výhradne pre backendovú aplikáciu.

## 4. Prepojenie s monorepom a optimalizácia obrazov

Nástroje na správu kódu sú plne integrované s npm workspaces. Pri vytváraní Docker obrazov využívam viacúrovňové zostavovanie (multi-stage builds). V prvej fáze (build stage) sa nainštalujú všetky vývojárske závislosti a TypeScript kód sa skompiluje. V druhej fáze (production stage) sa do výsledného obrazu prekopíruje už len hotový JavaScript a produkčné knižnice (vrátane nevyhnutných súborov zo zdieľaných balíkov `packages/`). 

Výsledný kontajner je tak o stovky megabajtov menší a neobsahuje pôvodný zdrojový kód, čo sťažuje prípadný útok. K bezpečnosti a optimalizácii veľkosti prispieva aj súbor `.dockerignore`, ktorý zabraňuje prekopírovaniu zbytočností (ako lokálne `node_modules`) či citlivých dát (`.env` súbory) do vnútra kontajnera pri jeho zostavovaní.
