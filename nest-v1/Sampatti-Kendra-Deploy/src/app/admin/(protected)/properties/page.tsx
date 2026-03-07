import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { deleteProperty } from './actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

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
        if (isNaN(userId)) {
            properties = [];
        } else {
            // Agent View: Only their own properties using raw SQL
            properties = await prisma.$queryRaw`
                SELECT * FROM Property 
                WHERE agent_id = ${userId}
                ORDER BY created_at DESC
            ` as any[];
        }
    } else {
        // Admin View: All properties using raw SQL
        properties = await prisma.$queryRaw`
            SELECT * FROM Property 
            ORDER BY created_at DESC
        ` as any[];
    }

    // Attach images manually using raw SQL to bypass Prisma client validation errors
    for (let p of properties) {
        p.images = await prisma.$queryRaw`SELECT * FROM PropertyImage WHERE property_id = ${p.id}` as any[];
    }

    const totalPublished = properties.filter(p => p.status === 'Published').length;
    const totalDraft = properties.filter(p => p.status === 'Draft').length;

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Manage Properties</h1>
                    <p style={{ fontSize: '13px', color: '#8b8ca7', margin: '4px 0 0' }}>Add, edit or remove property listings</p>
                </div>
                <Link href="/admin/properties/add" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '9px 18px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: 600, background: '#2563eb', color: '#fff',
                    textDecoration: 'none',
                }}>+ Add New Property</Link>
            </div>

            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { icon: '🏢', bg: '#eff6ff', color: '#2563eb', label: 'Total Properties', value: properties.length, sub: 'All listings' },
                    { icon: '✅', bg: '#f0fdf4', color: '#16a34a', label: 'Published', value: totalPublished, sub: 'Live on site' },
                    { icon: '📝', bg: '#fff7ed', color: '#ea580c', label: 'Drafts', value: totalDraft, sub: 'Not yet live' },
                ].map(c => (
                    <div key={c.label} style={{
                        background: '#fff', borderRadius: '12px', padding: '20px',
                        display: 'flex', alignItems: 'center', gap: '16px',
                        border: '1px solid #eef0f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: c.bg, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '22px', flexShrink: 0,
                        }}>{c.icon}</div>
                        <div>
                            <p style={{ fontSize: '12px', color: '#8b8ca7', margin: '0 0 2px', fontWeight: 500 }}>{c.label}</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 2px', lineHeight: 1.1 }}>{c.value}</p>
                            <p style={{ fontSize: '11px', color: '#a0a0b5', margin: 0 }}>{c.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Properties Table */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eef0f7', overflow: 'hidden' }}>

                {/* Table Toolbar */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #f0f0f8',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
                }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>All Properties</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8f9ff', border: '1px solid #e8e8f0', borderRadius: '8px', padding: '6px 12px' }}>
                            <span style={{ color: '#a0a0b5', fontSize: '13px' }}>🔍</span>
                            <input type="text" placeholder="Search properties..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#444', width: '180px' }} />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f8' }}>
                            {['Title', 'Location', 'Price', 'Type', 'Status', 'Actions'].map((h, i) => (
                                <th key={h} style={{
                                    padding: '12px 16px', textAlign: i === 5 ? 'right' : 'left',
                                    fontWeight: 600, color: '#555570', fontSize: '12px',
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {properties.length > 0 ? properties.map((prop) => (
                            <tr key={prop.id} style={{ borderBottom: '1px solid #f8f8fc' }}>
                                <td style={{ padding: '14px 16px', color: '#1a1a2e', fontWeight: 500, maxWidth: '220px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '8px',
                                            background: '#eff6ff', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: '16px', flexShrink: 0,
                                            overflow: 'hidden', border: '1px solid #eef0f7'
                                        }}>
                                            {prop.images && prop.images[0] ? (
                                                <img src={prop.images[0].image_url} alt="prop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : '🏠'}
                                        </div>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px', display: 'block' }}>{prop.title}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '14px 16px', color: '#8b8ca7' }}>📍 {prop.location}</td>
                                <td style={{ padding: '14px 16px', color: '#1a1a2e', fontWeight: 600 }} suppressHydrationWarning>₹{Number(prop.price).toLocaleString('en-IN')}</td>
                                <td style={{ padding: '14px 16px', color: '#555570' }}>{prop.property_type || '—'}</td>
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
                                            background: '#eff6ff', color: '#2563eb', textDecoration: 'none',
                                            border: '1px solid #bfdbfe',
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
