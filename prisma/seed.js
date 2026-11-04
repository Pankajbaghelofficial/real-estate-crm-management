/* eslint-disable @typescript-eslint/no-require-imports -- plain Node.js (CommonJS) script */
// Creates the first super admin. Run from a shell on the server (never over HTTP):
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' node prisma/seed.js
// Existing users are never modified.
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || '';
    const name = process.env.ADMIN_NAME || 'Super Admin';

    if (!email || password.length < 10) {
        throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 10 characters) environment variables.');
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
