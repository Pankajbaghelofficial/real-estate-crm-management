import AdminLayoutClient from '@/app/admin/(protected)/AdminLayoutClient';
import { getSiteSettings } from '@/lib/siteSettings';
import { requirePageRole } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Validates the session against the DB (deleted users are rejected).
    const user = await requirePageRole('agent');
    const settings = getSiteSettings();

    return (
        <AdminLayoutClient userName={user.name || 'Admin'} userEmail={user.email} userRole={user.role} settings={settings}>
            {children}
        </AdminLayoutClient>
    );
}
