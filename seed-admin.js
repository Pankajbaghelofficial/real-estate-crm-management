const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.adminUser.upsert({
        where: { email: 'admin@sampattikendra.com' },
        update: {},
        create: {
            email: 'admin@sampattikendra.com',
            name: 'Admin',
            password: hashedPassword,
            role: 'admin',
        },
    });
    console.log('Admin user created:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
