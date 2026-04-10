"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const fs_1 = require("fs");
function findRootDir(startPath) {
    let current = startPath;
    let lastValid = current;
    while (current !== '/' && current !== (0, path_1.dirname)(current)) {
        const packageJsonPath = (0, path_1.resolve)(current, 'package.json');
        if ((0, fs_1.existsSync)(packageJsonPath)) {
            try {
                const pkg = require(packageJsonPath);
                if (pkg.workspaces) {
                    return current;
                }
                lastValid = current;
            }
            catch (e) {
            }
        }
        const parent = (0, path_1.dirname)(current);
        if (parent === current)
            break;
        current = parent;
    }
    return lastValid;
}
const rootDir = findRootDir(__dirname);
const envPaths = [
    (0, path_1.resolve)(rootDir, '.env'),
    (0, path_1.resolve)(process.cwd(), '.env'),
    (0, path_1.resolve)(process.cwd(), '.env.local'),
    (0, path_1.resolve)(__dirname, '../../../.env'),
    (0, path_1.resolve)(__dirname, '../../../../.env'),
    (0, path_1.resolve)(process.cwd(), '../../.env'),
];
let loaded = false;
for (const envPath of envPaths) {
    if ((0, fs_1.existsSync)(envPath)) {
        try {
            const result = (0, dotenv_1.config)({ path: envPath, override: true });
            if (!result.error && process.env.DATABASE_URL) {
                loaded = true;
                console.log(`✅ [database] Loaded DATABASE_URL from: ${envPath}`);
                break;
            }
        }
        catch (e) {
        }
    }
}
if (!loaded && !process.env.DATABASE_URL) {
    console.error('❌ [database] Failed to load DATABASE_URL from any path');
    console.error('Tried paths:', envPaths.map(p => ({ path: p, exists: (0, fs_1.existsSync)(p) })));
    console.error('Current __dirname:', __dirname);
    console.error('Current process.cwd():', process.cwd());
    console.error('Root dir found:', rootDir);
}
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables!');
    console.error('Current working directory:', process.cwd());
    console.error('__dirname:', __dirname);
    console.error('Tried paths:', [
        (0, path_1.resolve)(process.cwd(), '.env'),
        (0, path_1.resolve)(__dirname, '../../../.env'),
        (0, path_1.resolve)(__dirname, '../../../../.env'),
    ]);
    throw new Error('DATABASE_URL environment variable is required');
}
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        datasources: databaseUrl ? {
            db: {
                url: databaseUrl,
            },
        } : undefined,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
__exportStar(require("@prisma/client"), exports);
//# sourceMappingURL=index.js.map