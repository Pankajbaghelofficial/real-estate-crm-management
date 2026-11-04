/* eslint-disable @typescript-eslint/no-require-imports -- plain Node.js (CommonJS) script */
// Creates the first super admin.
//
// Manually (from a shell, never over HTTP):
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' node prisma/seed.js
//   -> creates that user if the email does not exist yet. Existing users are never modified.
//
// During deployment (`node prisma/seed.js --bootstrap`, run by `npm run vercel-build`):
//   -> does nothing unless ADMIN_EMAIL and ADMIN_PASSWORD are set AND the database has no
//      users at all. So once the first admin exists, these variables have no effect.
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const BOOTSTRAP = process.argv.includes('--bootstrap');
const prisma = new PrismaClient();

async function main() {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || '';
    const name = process.env.ADMIN_NAME || 'Super Admin';

    if (BOOTSTRAP && !email && !password) {
        console.log('Admin bootstrap: skipped (ADMIN_EMAIL / ADMIN_PASSWORD not set).');
        return;
    }
    if (!email || password.length < 10) {
        throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 10 characters) environment variables.');
    }

    if (BOOTSTRAP) {
        const users = await prisma.adminUser.count();
        if (users > 0) {
            console.log('Admin bootstrap: skipped (users already exist).');
            return;
        }
    }

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
        console.log('Admin user already exists, not modified:', email);
        return;
    }

    const admin = await prisma.adminUser.create({
        data: { email, name, password: await bcrypt.hash(password, 12), role: 'superadmin' },
    });
    console.log('Super admin created:', admin.email);
}

main()
    .catch((e) => {
        console.error(e.message || e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
