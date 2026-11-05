import { PrismaClient } from '@prisma/client';

/**
 * Connection string for the running app.
 *
 * Prisma Postgres gives two URLs: DATABASE_URL (direct, few connections allowed) and
 * DATABASE_URL_POOLED (through a connection pooler). Serverless functions start many
 * instances, each with its own pool, so on the direct URL they quickly hit
 * "too many connections". The app therefore uses the pooled URL when it exists;
 * migrations keep using the direct one (scripts/db-migrate.mjs).
 */
function runtimeDatabaseUrl(): string | undefined {
    const pooled = process.env.DATABASE_URL_POOLED;
    if (!pooled) return undefined; // Neon / local: DATABASE_URL from schema.prisma is used as is
    try {
        const url = new URL(pooled);
        // Poolers (PgBouncer-style) don't support Prisma's prepared-statement cache.
        if (!url.searchParams.has('pgbouncer')) url.searchParams.set('pgbouncer', 'true');
        // Keep each serverless instance's share of connections small.
        if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', '3');
        return url.toString();
    } catch {
        return pooled;
    }
}

// Single shared PrismaClient. Creating one client per module opens a new
// connection pool for every file and exhausts DB connections in dev
// (hot reload) and production.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const datasourceUrl = runtimeDatabaseUrl();
export const prisma = globalForPrisma.prisma ?? new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
