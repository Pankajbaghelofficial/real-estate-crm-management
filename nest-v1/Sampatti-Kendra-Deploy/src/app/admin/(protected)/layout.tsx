import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AdminLayoutClient from '@/app/admin/(protected)/AdminLayoutClient';
import { getSiteSettings } from '@/lib/siteSettings';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/admin/login');
    }

    const userName = session.user?.name || 'Admin';
    const userEmail = session.user?.email || 'admin@sampattikendra.com';
    const userRole = (session.user as any).role || 'admin';
    const settings = getSiteSettings();

    return (
        <AdminLayoutClient userName={userName} userEmail={userEmail} userRole={userRole} settings={settings}>
            {children}
        </AdminLayoutClient>
    );
}
