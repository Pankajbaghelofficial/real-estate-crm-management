import { PrismaClient } from '@prisma/client';
import UsersClient from './UsersClient';

const prisma = new PrismaClient();

export default async function UsersPage() {
    const users = await prisma.adminUser.findMany({
        orderBy: { id: 'asc' },
        select: { id: true, name: true, email: true, role: true },
    });

    return <UsersClient users={users} />;
}
