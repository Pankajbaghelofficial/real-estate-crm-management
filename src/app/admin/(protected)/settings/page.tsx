import { getSiteSettings } from '@/lib/siteSettings';
import { prisma } from '@/lib/prisma';
import { requirePageRole } from '@/lib/authz';
import SettingsPageClient from './SettingsClient';

export default async function SettingsPage() {
    const user = await requirePageRole('superadmin');
    const settings = await getSiteSettings();

    const adminUser = await prisma.adminUser.findUnique({
        where: { id: user.id },
        select: { id: true, name: true, email: true, role: true },
    });

    return <SettingsPageClient initialSettings={settings} adminUser={adminUser} />;
}
