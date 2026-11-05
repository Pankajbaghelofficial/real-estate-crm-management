import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { deleteProperty } from './actions';
import RemoveDemoButton from './RemoveDemoButton';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';


export default async function ManageProperties() {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    const rawRole = user?.role || 'agent';
    const userRole = rawRole.toLowerCase();
    const userId = Number(user?.id);

    // Normalize roles
    const isAdmin = userRole === 'admin' || userRole === 'superadmin' || userRole === 'super_admin';

    let properties: any[] = [];
    if (!isAdmin) {
        if (!isNaN(userId)) {
            // Agent View: Only their own properties
            properties = await prisma.property.findMany({
                where: { agent_id: userId },
                include: { images: true },
                orderBy: { created_at: 'desc' },
            });
        }
    } else {
        // Admin View: All properties
        properties = await prisma.property.findMany({
            include: { images: true },
            orderBy: { created_at: 'desc' },
        });
    }

    const totalPublished = properties.filter(p => p.status === 'Published').length;
    const totalDraft = properties.filter(p => p.status === 'Draft').length;
    const demoCount = isAdmin ? properties.filter(p => p.is_demo).length : 0;

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-admin)', margin: 0 }}>Manage Properties</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-admin-dim)', margin: '4px 0 0' }}>Add, edit or remove property listings</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {demoCount > 0 && <RemoveDemoButton count={demoCount} />}
                <Link href="/admin/properties/add" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '9px 18px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: 600, background: 'var(--accent-premium-gold)', color: '#0a0f2e',
                    textDecoration: 'none',
                }}>+ Add New Property</Link>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { icon: '🏢', bg: 'rgba(63, 192, 231, 0.1)', color: 'var(--accent-premium-gold)', label: 'Total Properties', value: properties.length, sub: 'All listings' },
                    { icon: '✅', bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', label: 'Published', value: totalPublished, sub: 'Live on site' },
                    { icon: '📝', bg: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', label: 'Drafts', value: totalDraft, sub: 'Not yet live' },
                ].map(c => (
                    <div key={c.label} className="glass-panel" style={{
                        borderRadius: '12px', padding: '20px',
                        display: 'flex', alignItems: 'center', gap: '16px',
                        border: '1px solid var(--border-admin)',
                    }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: c.bg, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '22px', flexShrink: 0,
                            border: '1px solid var(--border-admin)'
                        }}>{c.icon}</div>
                        <div>
                            <p style={{ fontSize: '12px', color: 'var(--text-admin-dim)', margin: '0 0 2px', fontWeight: 500 }}>{c.label}</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-admin)', margin: '0 0 2px', lineHeight: 1.1 }}>{c.value}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-admin-dim)', margin: 0, opacity: 0.8 }}>{c.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Properties Table */}
            <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-admin)' }}>

                {/* Table Toolbar */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid var(--border-admin)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
                }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-admin)', margin: 0 }}>All Properties</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-admin-input)', border: '1px solid var(--border-admin)', borderRadius: '8px', padding: '6px 12px' }}>
                            <span style={{ color: 'var(--text-admin-dim)', fontSize: '13px' }}>🔍</span>
                            <input type="text" placeholder="Search properties..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: 'var(--text-admin)', width: '180px' }} />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-admin)' }}>
                            {['Title', 'Location', 'Price', 'Type', 'Status', 'Actions'].map((h, i) => (
                                <th key={h} style={{
                                    padding: '12px 16px', textAlign: i === 5 ? 'right' : 'left',
                                    fontWeight: 600, color: 'var(--text-admin-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px'
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {properties.length > 0 ? properties.map((prop) => (
                            <tr key={prop.id} style={{ borderBottom: '1px solid var(--border-admin)' }}>
                                <td style={{ padding: '14px 16px', color: 'var(--text-admin)', fontWeight: 500, maxWidth: '220px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '8px',
                                            background: 'rgba(63, 192, 231, 0.1)', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: '16px', flexShrink: 0,
                                            overflow: 'hidden', border: '1px solid var(--border-admin)'
                                        }}>
                                            {prop.images && prop.images[0] ? (
                                                <img src={prop.images[0].image_url} alt="prop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : '🏠'}
                                        </div>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px', display: 'block' }}>{prop.title}</span>
                                        {prop.is_demo && <span title="Sample data" style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#fef9c3', color: '#a16207', flexShrink: 0 }}>DEMO</span>}
                                        {prop.listing_type === 'Rent' && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(63,192,231,0.15)', color: 'var(--accent-premium-gold)', flexShrink: 0 }}>RENT</span>}
                                        {prop.is_verified && <span title="Verified" style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', flexShrink: 0 }}>✔</span>}
                                    </div>
                                </td>
                                <td style={{ padding: '14px 16px', color: 'var(--text-admin-dim)' }}>📍 {prop.location}</td>
                                <td style={{ padding: '14px 16px', color: 'var(--text-admin)', fontWeight: 600 }} suppressHydrationWarning>₹{Number(prop.price).toLocaleString('en-IN')}</td>
                                <td style={{ padding: '14px 16px', color: 'var(--text-admin-dim)' }}>{prop.property_type || '—'}</td>
                                <td style={{ padding: '14px 16px' }}>
                                    <span style={{
                                        padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                                        background: prop.status === 'Published' ? '#dcfce7' : '#fef9c3',
                                        color: prop.status === 'Published' ? '#16a34a' : '#a16207',
                                    }}>{prop.status}</span>
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        <Link href={`/admin/properties/edit/${prop.id}`} style={{
                                            padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                                            background: 'rgba(63, 192, 231, 0.1)', color: 'var(--accent-premium-gold)', textDecoration: 'none',
                                            border: '1px solid var(--accent-premium-gold)',
                                        }}>✏️ Edit</Link>
                                        <form action={deleteProperty.bind(null, prop.id)} style={{ display: 'inline' }}>
                                            <button type="submit" style={{
                                                padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                                                background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer',
                                            }}>🗑️ Delete</button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#b0b0c3', fontSize: '14px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '40px' }}>🏢</span>
                                        <p style={{ margin: 0, fontWeight: 500 }}>No properties yet</p>
                                        <Link href="/admin/properties/add" style={{
                                            padding: '8px 20px', borderRadius: '8px', background: '#2563eb',
                                            color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                                        }}>+ Add First Property</Link>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
