import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

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
        <div className="glass-panel" style={{
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'default',
            flex: 1,
            minWidth: '240px',
        }}>
            <div style={{
                width: '60px', height: '60px', borderRadius: '15px',
                background: iconBg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '26px', flexShrink: 0,
                color: iconColor,
                boxShadow: `0 10px 20px ${iconColor}20`,
                border: '1px solid var(--border-admin)'
            }}>{icon}</div>
            <div>
                <p style={{ fontSize: '12px', color: 'var(--text-admin-dim)', margin: '0 0 6px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
                <p style={{ fontSize: '34px', fontWeight: 800, color: 'var(--text-admin)', margin: '0 0 4px 0', lineHeight: 1.1, fontFamily: 'var(--font-serif)' }}>{value}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-admin-dim)', margin: 0, fontWeight: 500, opacity: 0.7 }}>{sub}</p>
            </div>
        </div>
    );

    return (
        <div style={{ paddingBottom: '60px' }}>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 className="premium-gradient-text" style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 10px', fontFamily: 'var(--font-serif)' }}>
                        Dashboard Overview
                    </h1>
                    <p style={{ fontSize: '15px', color: 'var(--text-admin-dim)', margin: 0, fontWeight: 500 }}>
                        Welcome back, <span style={{ color: 'var(--accent-premium-gold)', fontWeight: 700 }}>{user?.name}</span>. Here's your real estate empire at a glance.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button className="glass-panel" style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px 24px', borderRadius: '12px', fontSize: '14px',
                        fontWeight: 700, color: 'var(--text-admin)', cursor: 'pointer',
                        transition: 'all 0.3s',
                    }}>
                        <span>📥</span> Export Analysis
                    </button>
                    <Link href="/admin/leads" style={{ textDecoration: 'none' }}>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '12px 24px', borderRadius: '12px', fontSize: '14px',
                            fontWeight: 700, background: 'linear-gradient(135deg, var(--accent-premium-gold) 0%, #2a8fb0 100%)',
                            border: 'none', color: '#0a0f2e', cursor: 'pointer',
                            boxShadow: '0 10px 20px rgba(63, 192, 231, 0.2)',
                            transition: 'all 0.3s',
                        }}>
                            <span>👥</span> Strategic Enquiries
                        </button>
                    </Link>
                </div>
            </div>

            {/* Premium Stat Cards */}
            <div className="admin-dash-stats" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '40px' }}>
                {card('🏘️', 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.05))', '#3b82f6', 'Portfolio Assets', totalProperties, 'Exclusive listings')}
                {card('🔥', 'linear-gradient(135deg, rgba(63, 192, 231, 0.1), rgba(63, 192, 231, 0.05))', 'var(--accent-premium-gold)', 'High Intent Leads', totalLeads, 'Awaiting response')}
                {userRole !== 'agent' && card('✍️', 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))', '#10b981', 'Market Insights', publishedBlogs, 'Live articles')}
                <div style={{ flex: userRole === 'agent' ? 1.5 : 1 }}>
                    {card('🛡️', 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))', '#8b5cf6', 'Security Tier', 'Elite', 'System fully encrypted')}
                </div>
            </div>

            {/* Dynamic Intelligence Grid */}
            <div className="admin-dash-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                {/* Analytics Donut */}
                <div className="glass-panel" style={{ borderRadius: '24px', padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-admin)' }}>Market Sentiment</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-admin-dim)' }}>Lead conversion probability</p>
                        </div>
                        <span className="glass-panel" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '20px', color: '#d4af37', fontWeight: 700 }}>Quarterly View</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '50px', padding: '10px 0' }}>
                        <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', filter: 'var(--dash-chart-filter)' }}>
                                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--dash-chart-bg)" strokeWidth="12" />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="url(#goldGrad)" strokeWidth="12" strokeLinecap="round"
                                    strokeDasharray={`${(totalLeads > 0 ? 68 : 50) * 2.51} 251`} />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--text-admin)" strokeWidth="12" strokeLinecap="round"
                                    strokeDasharray={`${18 * 2.51} 251`}
                                    strokeDashoffset={`-${(totalLeads > 0 ? 68 : 50) * 2.51}`} />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--text-admin-dim)" strokeWidth="12" strokeLinecap="round"
                                    strokeDasharray={`${14 * 2.51} 251`}
                                    strokeDashoffset={`-${((totalLeads > 0 ? 68 : 50) + 18) * 2.51}`} />
                                <defs>
                                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#d4af37" />
                                        <stop offset="100%" stopColor="#f5d060" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <p style={{ fontSize: '36px', fontWeight: 900, color: 'var(--text-admin)', margin: 0, fontFamily: 'var(--font-serif)' }}>{totalLeads}</p>
                                <p style={{ fontSize: '11px', color: 'var(--accent-premium-gold)', margin: 0, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Intelligence</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { label: 'Strategic Leads', value: '68%', color: '#d4af37' },
                                { label: 'Negotiations', value: '18%', color: 'var(--text-admin)' },
                                { label: 'Exploration', value: '14%', color: 'var(--text-admin-dim)' }
                            ].map((item) => (
                                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: item.color, boxShadow: `0 0 10px ${item.color}60` }}></div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-admin)' }}>{item.value}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-admin-dim)', fontWeight: 500 }}>{item.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Portfolio Distribution Chart */}
                <div className="glass-panel" style={{ borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                        <div>
                            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: 'var(--text-admin)' }}>Portfolio Matrix</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-admin-dim)', fontWeight: 500 }}>Listing distribution across asset classes</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', flex: 1, paddingBottom: '20px', paddingTop: '10px' }}>
                        {[
                            { label: 'Residential', val: totalProperties > 0 ? 70 : 35, color: 'var(--border-admin)' },
                            { label: 'Commercial', val: totalProperties > 0 ? 45 : 25, color: 'var(--dash-chart-bg)' },
                            { label: 'Strategic Plots', val: totalProperties > 0 ? 90 : 65, color: '#d4af37' },
                            { label: 'Ultra Villas', val: totalProperties > 0 ? 55 : 30, color: 'var(--text-admin-dim)' },
                        ].map(b => (
                            <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', height: '100%' }}>
                                <div style={{
                                    width: '100%', maxWidth: '56px', height: `${b.val}%`,
                                    background: b.color, borderRadius: '12px 12px 4px 4px',
                                    border: '1px solid var(--glass-border)',
                                    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                                    boxShadow: b.color.includes('var(--accent-premium-gold)') ? '0 10px 25px rgba(63, 192, 231, 0.2)' : '0 4px 12px rgba(0,0,0,0.1)'
                                }}></div>
                                <span style={{ fontSize: '12px', color: 'var(--text-admin-dim)', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{b.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Intelligence Ledger: Table + Insights */}
            <div className="admin-dash-bottom" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
                {/* Contemporary Table */}
                <div className="glass-panel" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    <div style={{ padding: '32px 32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-admin)', margin: '0 0 6px' }}>Enquiry Ledger</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-admin-dim)', margin: 0, fontWeight: 500 }}>High-priority leads requiring immediate action</p>
                        </div>
                        <div className="glass-panel" style={{ padding: '4px 4px 4px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '240px' }}>
                            <span style={{ fontSize: '14px', color: 'var(--text-admin-dim)' }}>🔍</span>
                            <input type="text" placeholder="Search the ledger..." style={{
                                background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-admin)', fontSize: '13px', padding: '8px 0', width: '100%', fontWeight: 500
                            }} />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '700px' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-admin-input)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '20px 32px', textAlign: 'left', fontWeight: 800, color: 'var(--text-admin-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Lead Asset</th>
                                    <th style={{ padding: '20px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--text-admin-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Objective</th>
                                    <th style={{ padding: '20px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--text-admin-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Priority</th>
                                    <th style={{ padding: '20px 32px', textAlign: 'right', fontWeight: 800, color: 'var(--text-admin-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Acquisition Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLeads.length > 0 ? recentLeads.map((lead) => (
                                    <tr key={lead.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="admin-table-row">
                                        <td style={{ padding: '20px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{
                                                    width: '44px', height: '44px', borderRadius: '12px',
                                                    background: 'linear-gradient(135deg, rgba(63, 192, 231, 0.1), rgba(63, 192, 231, 0.05))',
                                                    color: 'var(--accent-premium-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '16px', fontWeight: 900, flexShrink: 0,
                                                    border: '1px solid var(--border-admin)',
                                                }}>{lead.name.charAt(0).toUpperCase()}</div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: 'var(--text-admin)', fontWeight: 700, fontSize: '15px' }}>{lead.name}</span>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-admin-dim)', fontWeight: 500 }}>{lead.email || lead.phone || 'Classified'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 16px', color: 'var(--text-admin)', fontWeight: 600 }}>
                                            {lead.property?.title || <span style={{ color: 'var(--text-admin-dim)', fontStyle: 'italic' }}>General Strategy</span>}
                                        </td>
                                        <td style={{ padding: '20px 16px' }}>
                                            <span style={{
                                                background: 'rgba(220, 38, 38, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)',
                                                padding: '6px 14px', borderRadius: '8px',
                                                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px'
                                            }}>Immediate</span>
                                        </td>
                                        <td style={{ padding: '20px 32px', color: 'var(--text-admin-dim)', fontSize: '13px', textAlign: 'right', fontWeight: 600 }}>
                                            {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '80px', textAlign: 'center', color: '#4b5563', fontSize: '15px' }}>
                                            <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.5 }}>💎</div>
                                            The ledger is currently clear.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tactical Actions & Performance Analysis */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-panel" style={{ borderRadius: '24px', padding: '32px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-admin)', fontFamily: 'var(--font-serif)' }}>Strategic Actions</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-admin-dim)', margin: '0 0 24px', fontWeight: 500 }}>Expedite your business growth</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {[
                                { label: 'Register New Asset', icon: '🏢', href: '/admin/properties/new', bg: 'var(--dash-card-bg-subtle)' },
                                ...(userRole !== 'agent' ? [{ label: 'Publish Insight', icon: '📝', href: '/admin/blogs/new', bg: 'var(--dash-card-bg-subtle)' }] : []),
                                { label: 'Master Enquiry List', icon: '💎', href: '/admin/leads', bg: 'rgba(63, 192, 231, 0.12)', color: 'var(--accent-premium-gold)' },
                            ].map(a => (
                                <Link key={a.label} href={a.href} style={{
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    padding: '16px 20px', borderRadius: '15px',
                                    background: a.bg, border: '1px solid var(--border-admin)',
                                    textDecoration: 'none', color: a.color || 'var(--text-admin)', fontWeight: 700, fontSize: '14px',
                                    transition: 'all 0.3s ease',
                                }}>
                                    <span style={{ fontSize: '20px' }}>{a.icon}</span>
                                    {a.label}
                                    <span style={{ marginLeft: 'auto', color: 'var(--accent-premium-gold)', opacity: 0.8 }}>⚡</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel" style={{ borderRadius: '24px', padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: '8px', height: '18px', background: '#d4af37', borderRadius: '4px' }}></div>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-admin)', margin: 0 }}>KPI Intelligence</h3>
                        </div>
                        {[
                            ['Portfolio Velocity', totalProperties, '+14.2%'],
                            ['Market Penetration', publishedBlogs, '+8.5%'],
                            ['Strategic Capture', totalLeads, '+32.1%'],
                            ['Liquidity Ratio', 'Elite', 'Stable'],
                        ].map(([key, val, trend]) => (
                            <div key={String(key)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--glass-border)', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-admin-dim)', fontWeight: 600, letterSpacing: '0.2px' }}>{key}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{
                                        color: String(trend).includes('+') ? '#10b981' : '#d4af37',
                                        fontSize: '11px', fontWeight: 800,
                                        background: String(trend).includes('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                                        padding: '4px 8px', borderRadius: '6px'
                                    }}>{trend}</span>
                                    <span style={{ color: 'var(--text-admin)', fontWeight: 900, fontSize: '15px' }}>{val}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
