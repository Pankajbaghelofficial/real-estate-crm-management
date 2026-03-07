'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarNav({ userRole = 'admin' }: { userRole?: string }) {
    const pathname = usePathname();

    const normalizedRole = userRole?.toLowerCase();
    const isSuperAdmin = normalizedRole === 'superadmin';
    const isAdmin = normalizedRole === 'admin' || isSuperAdmin;
    const isAgent = normalizedRole === 'agent';

    return (
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#b0b0c3', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 8px 8px', margin: 0 }}>Main Menu</p>

            <NavItem href="/admin/dashboard" icon="🏠" label="Dashboard" active={pathname === '/admin/dashboard'} />
            <NavItem href="/admin/properties" icon="🏢" label="Properties" active={pathname ? pathname.startsWith('/admin/properties') : false} />

            {isAdmin && (
                <NavItem href="/admin/blogs" icon="📝" label="Blogs" active={pathname ? pathname.startsWith('/admin/blogs') : false} />
            )}

            <NavItem href="/admin/leads" icon="👥" label="Enquiries" active={pathname ? pathname.startsWith('/admin/leads') : false} />

            {isAdmin && (
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#b0b0c3', textTransform: 'uppercase', letterSpacing: '1px', padding: '16px 8px 8px', margin: 0 }}>Settings</p>
            )}

            {isAdmin && (
                <NavItem href="/admin/gallery" icon="🖼️" label="Gallery" active={pathname ? pathname.startsWith('/admin/gallery') : false} />
            )}

            {isSuperAdmin && (
                <NavItem href="/admin/users" icon="🧑‍💼" label="Users" active={pathname ? pathname.startsWith('/admin/users') : false} />
            )}

            {isSuperAdmin && (
                <NavItem href="/admin/notifications" icon="🔔" label="Notifications" active={pathname ? pathname.startsWith('/admin/notifications') : false} />
            )}

            {isSuperAdmin && (
                <NavItem href="/admin/settings" icon="⚙️" label="Settings" active={pathname ? pathname.startsWith('/admin/settings') : false} />
            )}

            <NavItem href="/api/auth/signout" icon="🚪" label="Sign Out" active={pathname ? pathname.startsWith('/api/auth/signout') : false} />
        </nav>
    );
}

function NavItem({ href, icon, label, active }: { href: string; icon: string; label: string; active?: boolean }) {
    return (
        <Link href={href} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '8px',
            marginBottom: '2px',
            fontSize: '13px',
            fontWeight: active ? 600 : 500,
            color: active ? '#2563eb' : '#555570',
            background: active ? '#eff6ff' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
        }}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>
            <span>{label}</span>
            {active && <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }}></span>}
        </Link>
    );
}
