#!/usr/bin/env node
/*
 * Runs `prisma migrate deploy` over a DIRECT (unpooled) database connection.
 *
 * Providers name their connection strings differently:
 *   Neon:            DATABASE_URL = pooled,  DATABASE_URL_UNPOOLED = direct
 *   Prisma Postgres: DATABASE_URL = direct,  DATABASE_URL_POOLED   = pooled
 * So the direct URL is DATABASE_URL_UNPOOLED when it exists, otherwise DATABASE_URL.
 * The schema's `directUrl` reads DATABASE_URL_UNPOOLED, so it is filled in for the
 * Prisma CLI here. Only the host is printed, never credentials.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
try {
    require('dotenv/config');
} catch {
    /* dotenv is optional */
}

function fail(msg) {
    console.error(`\n✖ ${msg}\n`);
    process.exit(1);
}

const source = process.env.DATABASE_URL_UNPOOLED ? 'DATABASE_URL_UNPOOLED' : 'DATABASE_URL';
const direct = process.env[source];
if (!process.env.DATABASE_URL) {
    fail('DATABASE_URL is not set. Connect a Postgres database to the project (Vercel → Storage) or set it in .env.');
}

let url;
try {
    url = new URL(direct);
} catch {
    fail(`${source} is not a valid connection string.`);
}
if (!/^postgres(ql)?:$/.test(url.protocol)) {
    fail(`${source} must be a direct postgres:// connection string for migrations (got "${url.protocol}//").`);
}

// Emergency switch: lets a deploy go out when the direct connection is unavailable
// (e.g. its connection limit is exhausted). Only use it when no migration is pending.
if (process.env.SKIP_DB_MIGRATE === '1') {
    console.warn('⚠ SKIP_DB_MIGRATE=1: database migrations were NOT applied in this build.');
    process.exit(0);
}

console.log(`Applying database migrations on ${url.hostname} (via ${source})`);
// The direct connection allows only a few clients; retry briefly if they are all taken.
const ATTEMPTS = 4;
for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
        stdio: ['inherit', 'inherit', 'pipe'],
        env: { ...process.env, DATABASE_URL_UNPOOLED: direct },
        encoding: 'utf8',
    });
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.status === 0) process.exit(0);
    const busy = /too many (database )?connections/i.test(result.stderr || '');
    if (!busy || attempt === ATTEMPTS) process.exit(result.status ?? 1);
    const waitS = 15 * attempt;
    console.log(`Database connections are busy; retrying in ${waitS}s (attempt ${attempt + 1}/${ATTEMPTS})...`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitS * 1000);
}
