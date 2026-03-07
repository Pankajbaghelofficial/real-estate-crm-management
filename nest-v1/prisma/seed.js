const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.adminUser.upsert({
        where: { email: 'admin@sampattikendra.com' },
        update: {},
        create: {
            email: 'admin@sampattikendra.com',
            name: 'Super Admin',
            password: password,
            role: 'superadmin',
        },
    });

    console.log('Admin user ready:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
