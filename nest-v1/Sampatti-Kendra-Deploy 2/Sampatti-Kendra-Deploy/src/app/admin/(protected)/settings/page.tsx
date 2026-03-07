import { getSiteSettings } from './actions';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import SettingsPageClient from './SettingsClient';

const prisma = new PrismaClient();

export default async function SettingsPage() {
    const settings = await getSiteSettings();
    const session = await getServerSession(authOptions);

    let adminUser = null;
    if (session?.user?.email) {
        adminUser = await prisma.adminUser.findUnique({
            where: { email: session.user.email },
            select: { id: true, name: true, email: true, role: true },
        });
    }

    return <SettingsPageClient initialSettings={settings} adminUser={adminUser} />;
}
