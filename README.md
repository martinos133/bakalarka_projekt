# Inzertná Platforma

Monorepo pre inzertnú platformu s Next.js frontend aplikáciami a Nest.js backend API.

## Štruktúra projektu

```
├── apps/
│   ├── admin/          # CEO admin panel (Next.js)
│   ├── user/           # Konto používateľa (Next.js)
│   ├── platform/       # Frontend platformy (Next.js)
│   └── api/            # Backend API (Nest.js)
├── packages/
│   ├── shared/         # Zdieľané typy, utilities
│   └── database/       # Prisma schema a migrácie
└── docker/             # Docker konfigurácie
```

## Technológie

- **Monorepo**: npm workspaces
- **Frontend**: Next.js 14+ (App Router), TypeScript
- **Backend**: Nest.js, TypeScript
- **Databáza**: PostgreSQL
- **ORM**: Prisma
- **Autentifikácia**: JWT
- **Containerizácia**: Docker, Docker Compose

## Požiadavky

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose

## Inštalácia

```bash
# Inštalácia dependencies
npm install

# Generovanie Prisma client
npm run db:generate
```

## Spustenie s Docker

```bash
# Spustenie všetkých služieb
docker-compose -f docker/docker-compose.yml up -d

# Zobrazenie logov
docker-compose -f docker/docker-compose.yml logs -f
```

## Vývoj

```bash
# Spustenie všetkých aplikácií v dev móde
npm run dev

# Spustenie konkrétnej aplikácie
cd apps/admin && npm run dev
cd apps/user && npm run dev
cd apps/platform && npm run dev
cd apps/api && npm run start:dev
```

## Databáza

```bash
# Vytvorenie migrácií
npm run db:migrate

# Otvorenie Prisma Studio
npm run db:studio
```

## Build

```bash
# Build všetkých aplikácií
npm run build
```
