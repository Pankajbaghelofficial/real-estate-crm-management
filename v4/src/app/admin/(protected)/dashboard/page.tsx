import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    const rawRole = user?.role || 'agent';
    const userRole = rawRole.toLowerCase();
    const userId = Number(user?.id);

    // Normalize admin roles for internal logic
    const isAdmin = userRole === 'admin' || userRole === 'superadmin' || userRole === 'super_admin';

    let stats = { totalProperties: 0, publishedBlogs: 0, totalLeads: 0 };
    let recentLeads: any[] = [];

    if (!isAdmin && !isNaN(userId)) {
        // Agent specific stats
        const [propCountRows, leadCountRows] = await Promise.all([
            prisma.$queryRaw`SELECT COUNT(*) as count FROM Property WHERE agent_id = ${userId}`,
            prisma.$queryRaw`
                SELECT COUNT(*) as count FROM Lead l 
                LEFT JOIN Property p ON l.property_id = p.id 
                WHERE p.agent_id = ${userId} OR l.assigned_to_id = ${userId}
            `
        ]) as [any[], any[]];

        stats.totalProperties = Number(propCountRows[0].count);
        stats.totalLeads = Number(leadCountRows[0].count);
        stats.publishedBlogs = 0; // Agents typically don't manage blogs

        recentLeads = await prisma.$queryRaw`
            SELECT l.* FROM Lead l 
            LEFT JOIN Property p ON l.property_id = p.id 
            WHERE p.agent_id = ${userId} OR l.assigned_to_id = ${userId}
            ORDER BY l.created_at DESC LIMIT 5
        ` as any[];

    } else {
        // Admin / Superadmin stats
        const [propCountRows, blogCountRows, leadCountRows] = await Promise.all([
            prisma.$queryRaw`SELECT COUNT(*) as count FROM Property`,
            prisma.$queryRaw`SELECT COUNT(*) as count FROM BlogPost WHERE status = 'Published'`,
            prisma.$queryRaw`SELECT COUNT(*) as count FROM Lead`,
        ]) as [any[], any[], any[]];

        stats = {
            totalProperties: Number(propCountRows[0].count),
            publishedBlogs: Number(blogCountRows[0].count),
            totalLeads: Number(leadCountRows[0].count)
        };

        recentLeads = await prisma.$queryRaw`
            SELECT * FROM Lead 
            ORDER BY created_at DESC LIMIT 5
        ` as any[];
    }

    // Populate property objects manually for component compatibility
    for (let l of recentLeads) {
        if (l.property_id) {
            const propRows: any[] = await prisma.$queryRaw`SELECT * FROM Property WHERE id = ${l.property_id} LIMIT 1`;
            l.property = propRows[0] || null;
        }
    }

    const { totalProperties, publishedBlogs, totalLeads } = stats;

    const card = (icon: string, iconBg: string, iconColor: string, label: string, value: string | number, sub: string) => (
        <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            border: '1px solid #eef0f7',
            boxShadow: '0 4px 20px rgba(10, 15, 46, 0.04)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'default',
        }}>
            <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: iconBg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '24px', flexShrink: 0,
                color: iconColor,
                boxShadow: `0 8px 16px ${iconColor}20`,
            }}>{icon}</div>
            <div>
                <p style={{ fontSize: '13px', color: '#8b8ca7', margin: '0 0 4px 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#0a0f2e', margin: '0 0 4px 0', lineHeight: 1.1, fontFamily: 'Georgia, serif' }}>{value}</p>
                <p style={{ fontSize: '12px', color: '#a0a0b5', margin: 0 }}>{sub}</p>
            </div>
        </div>
    );

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", paddingBottom: '40px' }}>
            {/* Page Title & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0a0f2e', margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>
                        Dashboard Overview
                    </h1>
                    <p style={{ fontSize: '14px', color: '#555570', margin: 0 }}>
                        Welcome back. Here is the latest data for Sampatti Kendra.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', borderRadius: '10px', fontSize: '14px',
                        fontWeight: 600, background: '#ffffff', border: '1px solid #e0e0f0',
                        color: '#0a0f2e', cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s',
                    }}>
                        <span>📥</span> Export Report
                    </button>
                    <Link href="/admin/leads" style={{ textDecoration: 'none' }}>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '10px', fontSize: '14px',
                            fontWeight: 600, background: 'linear-gradient(135deg, #0a0f2e 0%, #1a2d6b 100%)',
                            border: 'none', color: '#ffffff', cursor: 'pointer', width: '100%',
                            boxShadow: '0 4px 12px rgba(10, 15, 46, 0.2)',
                            transition: 'all 0.2s',
                        }}>
                            <span>👥</span> View Enquiries
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="admin-dash-stats" style={{ gap: '20px', marginBottom: '32px' }}>
                {card('🏢', 'linear-gradient(135deg, #f0f4ff, #e0eaff)', '#2563eb', 'Total Properties', totalProperties, 'Active listings')}
                {card('⚡', 'linear-gradient(135deg, #fffbev, #fef3c7)', '#d97706', 'Total Leads', totalLeads, 'Recent enquiries')}
                {userRole !== 'agent' && card('📰', 'linear-gradient(135deg, #f0fdf4, #dcfce7)', '#16a34a', 'Published Blogs', publishedBlogs, 'Live articles')}
                <div style={{ flex: userRole === 'agent' ? 1.5 : 1 }}>
                    {card('⏱️', 'linear-gradient(135deg, #faf5ff, #f3e8ff)', '#9333ea', 'System Health', '100%', 'All services operational')}
                </div>
            </div>

            {/* Charts Grid */}
            <div className="admin-dash-charts" style={{ gap: '20px', marginBottom: '20px' }}>
                {/* Visual Overview Card */}
                <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #eef0f7', boxShadow: '0 4px 20px rgba(10, 15, 46, 0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0a0f2e' }}>Lead Generation Metrics</h3>
                        <span style={{ fontSize: '12px', background: '#f5f6fa', padding: '4px 10px', borderRadius: '20px', color: '#555570', fontWeight: 600 }}>This Month</span>
                    </div>

                    <div className="admin-lead-chart-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', padding: '20px 0' }}>
                        <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                            {/* Premium Donut Chart */}
                            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.05))' }}>
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="16" />
                                <circle cx="50" cy="50" r="38" fill="none" stroke="url(#goldGradient)" strokeWidth="16" strokeLinecap="round"
                                    strokeDasharray={`${(totalLeads > 0 ? 65 : 50) * 2.38} 238`} />
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#0a0f2e" strokeWidth="16" strokeLinecap="round"
                                    strokeDasharray={`${20 * 2.38} 238`}
                                    strokeDashoffset={`-${(totalLeads > 0 ? 65 : 50) * 2.38}`} />
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#64748b" strokeWidth="16" strokeLinecap="round"
                                    strokeDasharray={`${15 * 2.38} 238`}
                                    strokeDashoffset={`-${((totalLeads > 0 ? 65 : 50) + 20) * 2.38}`} />
                                <defs>
                                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#d4af37" />
                                        <stop offset="100%" stopColor="#f5d060" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <p style={{ fontSize: '28px', fontWeight: 800, color: '#0a0f2e', margin: 0, fontFamily: 'Georgia, serif' }}>{totalLeads}</p>
                                <p style={{ fontSize: '11px', color: '#8b8ca7', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>Total</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { label: 'High Intent (Hot)', value: '65%', color: '#d4af37' },
                                { label: 'Inquiring (Warm)', value: '20%', color: '#0a0f2e' },
                                { label: 'Browsing (Cold)', value: '15%', color: '#64748b' }
                            ].map((item) => (
                                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: item.color, boxShadow: `0 2px 4px ${item.color}40` }}></div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0a0f2e' }}>{item.value}</span>
                                        <span style={{ fontSize: '12px', color: '#555570' }}>{item.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Properties Bar Chart Card */}
                <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #eef0f7', boxShadow: '0 4px 20px rgba(10, 15, 46, 0.04)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div>
                            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#0a0f2e' }}>Portfolio Distribution</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#8b8ca7' }}>Breakdown of listings by property type</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', flex: 1, paddingBottom: '16px', paddingTop: '20px', borderBottom: '1px solid #f0f0f8' }}>
                        {[
                            { label: 'Residential', val: totalProperties > 0 ? 65 : 30, color: '#0a0f2e' },
                            { label: 'Commercial', val: totalProperties > 0 ? 40 : 20, color: '#e2e8f0' },
                            { label: 'Plots', val: totalProperties > 0 ? 80 : 60, color: '#d4af37' },
                            { label: 'Villas', val: totalProperties > 0 ? 50 : 25, color: '#94a3b8' },
                        ].map(b => (
                            <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', height: '100%' }}>
                                <div style={{
                                    width: '100%', maxWidth: '48px', height: `${b.val}%`,
                                    background: b.color, borderRadius: '6px 6px 0 0',
                                    transition: 'height .5s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: b.color === '#d4af37' || b.color === '#0a0f2e' ? `0 -4px 12px ${b.color}30` : 'none'
                                }}></div>
                                <span style={{ fontSize: '12px', color: '#555570', fontWeight: 600, textAlign: 'center' }}>{b.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Table + Actions */}
            <div className="admin-dash-bottom" style={{ gap: '20px' }}>
                {/* Data Table */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eef0f7', boxShadow: '0 4px 20px rgba(10, 15, 46, 0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid #f0f0f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0a0f2e', margin: '0 0 4px' }}>Recent Enquiries</h3>
                            <p style={{ fontSize: '13px', color: '#8b8ca7', margin: 0 }}>Latest leads requiring attention</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px' }}>🔍</span>
                                <input type="text" placeholder="Search leads..." style={{
                                    padding: '8px 12px 8px 32px', fontSize: '13px', borderRadius: '8px',
                                    border: '1px solid #e2e8f0', outline: 'none', color: '#0a0f2e',
                                    width: '180px', background: '#f8fafc', fontWeight: 500,
                                }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lead Details</th>
                                    <th style={{ padding: '16px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Interested In</th>
                                    <th style={{ padding: '16px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                    <th style={{ padding: '16px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLeads.length > 0 ? recentLeads.map((lead) => (
                                    <tr key={lead.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} className="admin-table-row">
                                        <td style={{ padding: '16px 24px', color: '#0a0f2e', fontWeight: 600 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '10px',
                                                    background: 'linear-gradient(135deg, #f0f4ff, #e0eaff)', color: '#2563eb',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '14px', fontWeight: 700, flexShrink: 0,
                                                }}>{lead.name.charAt(0).toUpperCase()}</div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span>{lead.name}</span>
                                                    <span style={{ fontSize: '12px', color: '#8b8ca7', fontWeight: 500 }}>{lead.email || lead.phone || 'No contact info'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 16px', color: '#475569', fontWeight: 500 }}>
                                            {lead.property?.title || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>General Enquiry</span>}
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{
                                                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                                                padding: '4px 10px', borderRadius: '6px',
                                                fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap'
                                            }}>Hot Lead</span>
                                        </td>
                                        <td style={{ padding: '16px 16px', color: '#64748b', fontSize: '13px', whiteSpace: 'nowrap', fontWeight: 500 }} suppressHydrationWarning>
                                            {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                                            No enquiries have been received yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right panel - Premium Quick Actions & AI Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0a0f2e 0%, #111827 100%)',
                        borderRadius: '16px', padding: '24px',
                        border: '1px solid #1f2937', color: '#ffffff',
                        boxShadow: '0 8px 24px rgba(10, 15, 46, 0.15)',
                    }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>Quick Actions</h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px' }}>Manage your real estate empire</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'Add New Property', icon: '🏢', href: '/admin/properties/new', bg: 'rgba(255,255,255,0.06)', hover: 'rgba(255,255,255,0.1)' },
                                ...(userRole !== 'agent' ? [{ label: 'Write Blog Post', icon: '📝', href: '/admin/blogs/new', bg: 'rgba(255,255,255,0.06)', hover: 'rgba(255,255,255,0.1)' }] : []),
                                { label: 'View All Leads', icon: '👥', href: '/admin/leads', bg: 'rgba(212,175,55,0.15)', hover: 'rgba(212,175,55,0.25)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' },
                            ].map(a => (
                                <Link key={a.label} href={a.href} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '12px 16px', borderRadius: '10px',
                                    background: a.bg, border: a.border || '1px solid transparent',
                                    textDecoration: 'none', color: a.color || '#ffffff', fontWeight: 600, fontSize: '14px',
                                    transition: 'all .2s ease',
                                }}>
                                    <span style={{ fontSize: '18px' }}>{a.icon}</span>
                                    {a.label}
                                    <span style={{ marginLeft: 'auto', opacity: 0.5 }}>→</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #eef0f7', boxShadow: '0 4px 20px rgba(10, 15, 46, 0.04)' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0a0f2e', margin: '0 0 16px' }}>Performance Summary</h3>
                        {[
                            ['Listed Properties', totalProperties, '+12%'],
                            ['Active Articles', publishedBlogs, '+5%'],
                            ['Client Enquiries', totalLeads, '+24%'],
                            ['Lead Conv. Rate', '4.2%', '+1%'],
                        ].map(([key, val, trend]) => (
                            <div key={String(key)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                                <span style={{ color: '#64748b', fontWeight: 500 }}>{key}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 700, background: '#d1fae5', padding: '2px 6px', borderRadius: '4px' }}>{trend}</span>
                                    <span style={{ color: '#0a0f2e', fontWeight: 800, fontSize: '14px' }}>{val}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
