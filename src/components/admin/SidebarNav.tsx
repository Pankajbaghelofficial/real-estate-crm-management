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
        <nav style={{ flex: 1, padding: '20px 12px', overflowY: 'auto' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-admin-dim)', textTransform: 'uppercase', letterSpacing: '2px', padding: '0 12px 12px', margin: 0 }}>Main Menu</p>

            <NavItem href="/admin/dashboard" icon="🏠" label="Dashboard" active={pathname === '/admin/dashboard'} />
            <NavItem href="/admin/properties" icon="🏢" label="Properties" active={pathname ? pathname.startsWith('/admin/properties') : false} />

            {isAdmin && (
                <NavItem href="/admin/blogs" icon="📝" label="Blogs" active={pathname ? pathname.startsWith('/admin/blogs') : false} />
            )}

            <NavItem href="/admin/leads" icon="👥" label="Enquiries" active={pathname ? pathname.startsWith('/admin/leads') : false} />

            {isAdmin && (
                <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-admin-dim)', textTransform: 'uppercase', letterSpacing: '2px', padding: '24px 12px 12px', margin: 0 }}>Settings</p>
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

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                <NavItem href="/api/auth/signout" icon="🚪" label="Sign Out" active={pathname ? pathname.startsWith('/api/auth/signout') : false} />
            </div>
        </nav>
    );
}

function NavItem({ href, icon, label, active }: { href: string; icon: string; label: string; active?: boolean }) {
    return (
        <Link href={href} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '6px',
            fontSize: '14px',
            fontWeight: active ? 700 : 500,
            color: active ? 'var(--text-admin)' : 'var(--text-admin-dim)',
            background: active ? 'linear-gradient(135deg, rgba(63, 192, 231, 0.15), rgba(63, 192, 231, 0.03))' : 'transparent',
            border: active ? '1px solid var(--accent-premium-gold)' : '1px solid transparent',
            textDecoration: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: active ? '0 4px 12px rgba(63, 192, 231, 0.1)' : 'none',
        }}>
            <span style={{
                fontSize: '18px',
                lineHeight: 1,
                filter: active ? 'drop-shadow(0 0 4px rgba(63, 192, 231, 0.3))' : 'none'
            }}>{icon}</span>
            <span>{label}</span>
            {active && (
                <div style={{
                    marginLeft: 'auto',
                    width: '4px', height: '14px',
                    borderRadius: '2px',
                    background: 'var(--accent-premium-gold)',
                    boxShadow: '0 0 8px var(--accent-premium-gold)'
                }}></div>
            )}
        </Link>
    );
}
