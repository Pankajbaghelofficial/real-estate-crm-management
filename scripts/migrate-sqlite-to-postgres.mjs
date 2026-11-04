#!/usr/bin/env node
/*
 * One-time copy of the old SQLite database into PostgreSQL (Neon).
 *
 * Usage (run on your computer, not on Vercel):
 *   1. Create the tables in the target first:      npm run db:migrate
 *   2. Check the data without writing anything:
 *        SQLITE_FILE=./prisma/prod.db npm run db:import-sqlite -- --dry-run
 *   3. Copy it:
 *        SQLITE_FILE=./prisma/prod.db npm run db:import-sqlite
 *
 * Reads DATABASE_URL_UNPOOLED (preferred, direct connection) or DATABASE_URL.
 * Also imports data/site-settings.json (or SETTINGS_FILE) into the SiteSettings table.
 *
 * Safety: never deletes or overwrites anything. It refuses to run if the target
 * database already contains rows. IDs are preserved, so existing links keep working.
 * Requires Node.js 22.13+ (built-in node:sqlite).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
try {
    require('dotenv/config');
} catch {
    /* dotenv is optional */
}

const DRY_RUN = process.argv.includes('--dry-run');
const SQLITE_FILE = process.env.SQLITE_FILE;
const SETTINGS_FILE = process.env.SETTINGS_FILE || path.join(process.cwd(), 'data', 'site-settings.json');
const TARGET_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

function fail(msg) {
    console.error(`\n✖ ${msg}\n`);
    process.exit(1);
}

if (!SQLITE_FILE) fail('Set SQLITE_FILE to the path of the old SQLite database, e.g. SQLITE_FILE=./prisma/prod.db');
if (!fs.existsSync(SQLITE_FILE)) fail(`SQLite file not found: ${SQLITE_FILE}`);
if (!TARGET_URL || !/^postgres(ql)?:\/\//.test(TARGET_URL)) {
    fail('Set DATABASE_URL_UNPOOLED (or DATABASE_URL) to the PostgreSQL connection string.');
}

let DatabaseSync;
try {
    ({ DatabaseSync } = await import('node:sqlite'));
} catch {
    fail(`This script needs Node.js 22.13 or newer (built-in node:sqlite). You have ${process.version}.`);
}
const { PrismaClient } = require('@prisma/client');

/* ── value converters ───────────────────────────────────────────── */

// Prisma stored DateTime as epoch milliseconds; the old raw SQL used
// CURRENT_TIMESTAMP ("YYYY-MM-DD HH:MM:SS", UTC). Accept both, plus ISO strings.
function toDate(v, { required = false, field = '' } = {}) {
    if (v === null || v === undefined || v === '') {
        if (required) return new Date();
        return null;
    }
    let d;
    if (typeof v === 'number' || typeof v === 'bigint' || /^\d+(\.\d+)?$/.test(String(v).trim())) {
        const n = Number(v);
        d = new Date(n < 1e11 ? n * 1000 : n); // seconds vs milliseconds
    } else {
        const s = String(v).trim();
        const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/.exec(s);
        d = new Date(m ? `${m[1]}T${m[2]}Z` : s);
    }
    if (isNaN(d.getTime())) throw new Error(`Cannot parse date in ${field}: ${JSON.stringify(v)}`);
    return d;
}
const toInt = v => (v === null || v === undefined || v === '' ? null : Number(v));
const toStr = v => (v === null || v === undefined ? null : String(v));
const toReqStr = v => (v === null || v === undefined ? '' : String(v));
const toBool = v => v === true || v === 1 || v === '1' || v === 'true' || v === 1n;

/* ── read SQLite ────────────────────────────────────────────────── */

const sqlite = new DatabaseSync(SQLITE_FILE, { readOnly: true });
const tables = new Set(sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(r => r.name));
const read = name => (tables.has(name) ? sqlite.prepare(`SELECT * FROM "${name}" ORDER BY "id"`).all() : []);

const src = {
    AdminUser: read('AdminUser'),
    BlogCategory: read('BlogCategory'),
    Property: read('Property'),
    PropertyImage: read('PropertyImage'),
    BlogPost: read('BlogPost'),
    Lead: read('Lead'),
    LeadActivity: read('LeadActivity'),
};
sqlite.close();

const warnings = [];
const ids = name => new Set(src[name].map(r => Number(r.id)));
const userIds = ids('AdminUser');
const propertyIds = ids('Property');
const categoryIds = ids('BlogCategory');
const leadIds = ids('Lead');

// Optional references to rows that no longer exist become NULL; rows whose
// required parent is missing are skipped (they could not be inserted anyway).
function optionalRef(value, set, label) {
    const n = toInt(value);
    if (n === null) return null;
    if (!set.has(n)) {
        warnings.push(`${label}: reference to missing id ${n} set to NULL`);
        return null;
    }
    return n;
}

const data = {
    AdminUser: src.AdminUser.map(r => ({
        id: toInt(r.id),
        name: toReqStr(r.name),
        email: toReqStr(r.email),
        password: toReqStr(r.password),
        role: toStr(r.role) || 'admin',
    })),
    BlogCategory: src.BlogCategory.map(r => ({ id: toInt(r.id), category_name: toReqStr(r.category_name) })),
    Property: src.Property.map(r => ({
        id: toInt(r.id),
        title: toReqStr(r.title),
        description: toReqStr(r.description),
        price: Number(r.price) || 0,
        location: toReqStr(r.location),
        area_size: toReqStr(r.area_size),
        property_type: toReqStr(r.property_type),
        bedrooms: toInt(r.bedrooms),
        bathrooms: toInt(r.bathrooms),
        amenities: toStr(r.amenities),
        is_featured: toBool(r.is_featured),
        status: toStr(r.status) || 'Draft',
        created_at: toDate(r.created_at, { required: true, field: `Property ${r.id}.created_at` }),
        agent_id: optionalRef(r.agent_id, userIds, `Property ${r.id}.agent_id`),
    })),
    PropertyImage: src.PropertyImage.filter(r => {
        if (propertyIds.has(Number(r.property_id))) return true;
        warnings.push(`PropertyImage ${r.id}: property ${r.property_id} missing, skipped`);
        return false;
    }).map(r => ({ id: toInt(r.id), property_id: toInt(r.property_id), image_url: toReqStr(r.image_url) })),
    BlogPost: src.BlogPost.filter(r => {
        if (categoryIds.has(Number(r.category_id))) return true;
        warnings.push(`BlogPost ${r.id}: category ${r.category_id} missing, skipped`);
        return false;
    }).map(r => ({
        id: toInt(r.id),
        title: toReqStr(r.title),
        slug: toReqStr(r.slug),
        featured_image: toStr(r.featured_image),
        content: toReqStr(r.content),
        category_id: toInt(r.category_id),
        meta_title: toStr(r.meta_title),
        meta_description: toStr(r.meta_description),
        status: toStr(r.status) || 'Draft',
        created_at: toDate(r.created_at, { required: true, field: `BlogPost ${r.id}.created_at` }),
    })),
    Lead: src.Lead.map(r => ({
        id: toInt(r.id),
        name: toReqStr(r.name),
        phone: toReqStr(r.phone),
        email: toReqStr(r.email),
        message: toStr(r.message),
        property_id: optionalRef(r.property_id, propertyIds, `Lead ${r.id}.property_id`),
        status: toStr(r.status) || 'New',
        source: toStr(r.source) || 'Website',
        assigned_to_id: optionalRef(r.assigned_to_id, userIds, `Lead ${r.id}.assigned_to_id`),
        follow_up_date: toDate(r.follow_up_date, { field: `Lead ${r.id}.follow_up_date` }),
        created_at: toDate(r.created_at, { required: true, field: `Lead ${r.id}.created_at` }),
        updated_at: toDate(r.updated_at ?? r.created_at, { required: true, field: `Lead ${r.id}.updated_at` }),
    })),
    LeadActivity: src.LeadActivity.filter(r => {
        if (leadIds.has(Number(r.lead_id))) return true;
        warnings.push(`LeadActivity ${r.id}: lead ${r.lead_id} missing, skipped`);
        return false;
    }).map(r => ({
        id: toInt(r.id),
        lead_id: toInt(r.lead_id),
        user_id: optionalRef(r.user_id, userIds, `LeadActivity ${r.id}.user_id`),
        action_type: toReqStr(r.action_type),
        note: toStr(r.note),
        timestamp: toDate(r.timestamp, { required: true, field: `LeadActivity ${r.id}.timestamp` }),
    })),
};

let settings = null;
if (fs.existsSync(SETTINGS_FILE)) {
    try {
        settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    } catch (e) {
        fail(`Could not parse ${SETTINGS_FILE}: ${e.message}`);
    }
}

console.log(`Source: ${SQLITE_FILE}`);
for (const [name, rows] of Object.entries(data)) console.log(`  ${name.padEnd(14)} ${rows.length} rows`);
console.log(`  SiteSettings   ${settings ? 'from ' + SETTINGS_FILE : 'none'}`);
if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    warnings.slice(0, 50).forEach(w => console.log('  - ' + w));
    if (warnings.length > 50) console.log(`  ... and ${warnings.length - 50} more`);
}

if (DRY_RUN) {
    console.log('\nDry run: nothing was written.');
    process.exit(0);
}

/* ── write PostgreSQL ───────────────────────────────────────────── */

const prisma = new PrismaClient({ datasourceUrl: TARGET_URL });
const ORDER = ['AdminUser', 'BlogCategory', 'Property', 'PropertyImage', 'BlogPost', 'Lead', 'LeadActivity'];
const delegate = (client, name) => client[name.charAt(0).toLowerCase() + name.slice(1)];

try {
    const counts = await Promise.all([...ORDER, 'SiteSettings'].map(n => delegate(prisma, n).count()));
    if (counts.some(c => c > 0)) {
        fail(
            'The target database is not empty. This script only imports into an empty database ' +
                '(run it before creating users with the seed script).'
        );
    }

    await prisma.$transaction(
        async tx => {
            for (const name of ORDER) {
                const rows = data[name];
                for (let i = 0; i < rows.length; i += 1000) {
                    await delegate(tx, name).createMany({ data: rows.slice(i, i + 1000) });
                }
                // Continue auto-increment after the highest imported id.
                await tx.$executeRawUnsafe(
                    `SELECT setval(pg_get_serial_sequence('"${name}"', 'id'), COALESCE((SELECT MAX("id") FROM "${name}"), 1), (SELECT COUNT(*) > 0 FROM "${name}"))`
                );
            }
            if (settings) await tx.siteSettings.create({ data: { id: 1, data: settings } });
        },
        { timeout: 10 * 60 * 1000, maxWait: 60 * 1000 }
    );

    console.log('\nImported. Row counts in PostgreSQL:');
    for (const name of [...ORDER, 'SiteSettings']) {
        console.log(`  ${name.padEnd(14)} ${await delegate(prisma, name).count()}`);
    }
} catch (e) {
    console.error('\n✖ Import failed, nothing was written (the transaction was rolled back):');
    console.error(e);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}
