import { requirePageRole } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import UsersClient from './UsersClient';


export default async function UsersPage() {
    await requirePageRole('superadmin');
    const users = await prisma.adminUser.findMany({
        orderBy: { id: 'asc' },
        select: { id: true, name: true, email: true, role: true },
    });

    return <UsersClient users={users} />;
}
