import { PrismaClient } from '@prisma/client';

// Single shared PrismaClient. Creating one client per module opens a new
// connection pool for every file and exhausts SQLite/DB connections in dev
// (hot reload) and production.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
