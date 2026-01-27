// NAČÍTANIE .env PRED VŠETKÝMI IMPORTMI!
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';

// Načítanie .env PRED importom PrismaClient
// Najprv zistíme root projektu (hľadáme package.json s workspaces)
function findRootDir(startPath: string): string {
  let current = startPath;
  let lastValid = current;
  while (current !== '/' && current !== dirname(current)) {
    const packageJsonPath = resolve(current, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = require(packageJsonPath);
        if (pkg.workspaces) {
          return current;
        }
        lastValid = current;
      } catch (e) {
        // Pokračuj
      }
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return lastValid;
}

// Zistíme root projektu z __dirname
const rootDir = findRootDir(__dirname);

const envPaths = [
  resolve(rootDir, '.env'), // root/.env (priorita)
  resolve(process.cwd(), '.env'), // apps/api/.env
  resolve(process.cwd(), '.env.local'), // apps/api/.env.local
  resolve(__dirname, '../../../.env'), // fallback
  resolve(__dirname, '../../../../.env'), // fallback 2
  resolve(process.cwd(), '../../.env'), // alternatíva
];

let loaded = false;
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    try {
      const result = config({ path: envPath, override: true });
      if (!result.error && process.env.DATABASE_URL) {
        loaded = true;
        console.log(`✅ [database] Loaded DATABASE_URL from: ${envPath}`);
        break;
      }
    } catch (e) {
      // Ticho pokračuj
    }
  }
}

// Debug: vypíš všetky skúšané cesty ak sa nenačítalo
if (!loaded && !process.env.DATABASE_URL) {
  console.error('❌ [database] Failed to load DATABASE_URL from any path');
  console.error('Tried paths:', envPaths.map(p => ({ path: p, exists: existsSync(p) })));
  console.error('Current __dirname:', __dirname);
  console.error('Current process.cwd():', process.cwd());
  console.error('Root dir found:', rootDir);
}

// Teraz môžeme importovať PrismaClient
import { PrismaClient } from '@prisma/client';


const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Získaj DATABASE_URL z env
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables!');
  console.error('Current working directory:', process.cwd());
  console.error('__dirname:', __dirname);
  console.error('Tried paths:', [
    resolve(process.cwd(), '.env'),
    resolve(__dirname, '../../../.env'),
    resolve(__dirname, '../../../../.env'),
  ]);
  throw new Error('DATABASE_URL environment variable is required');
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl ? {
      db: {
        url: databaseUrl,
      },
    } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';
