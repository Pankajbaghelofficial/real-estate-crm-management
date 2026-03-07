import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

function timeAgo(date: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
}

export default async function NotificationsPage() {
    // Fetch leads (form submissions) from the database
    const leads = await prisma.lead.findMany({
        orderBy: { created_at: 'desc' },
        take: 50,
        include: { property: { select: { title: true } } },
    });

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Notifications</h1>
                    <p style={{ color: '#8b8ca7', fontSize: '14px', margin: '4px 0 0' }}>
                        Real-time alerts from form submissions and enquiries
                    </p>
                </div>
                <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
                    {leads.filter(l => l.status === 'New').length} New
                </span>
            </div>

            {leads.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8e8f0', padding: '60px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔔</div>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a2e', margin: '0 0 8px' }}>No notifications yet</h2>
                    <p style={{ color: '#8b8ca7', fontSize: '14px', margin: 0 }}>
                        When someone submits an enquiry form, it will appear here.
                    </p>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8e8f0', overflow: 'hidden' }}>
                    {leads.map((lead, i) => {
                        const isNew = lead.status === 'New';
                        return (
                            <Link
                                key={lead.id}
                                href="/admin/leads"
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '18px 20px',
                                    borderBottom: i < leads.length - 1 ? '1px solid #f0f0f8' : 'none',
                                    background: isNew ? '#f8f9ff' : '#fff',
                                    textDecoration: 'none', color: 'inherit',
                                    transition: 'background 0.15s',
                                }}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '12px', minWidth: '44px',
                                    background: isNew ? '#eff6ff' : '#f5f6fa',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                                }}>
                                    📩
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                        <p style={{ fontSize: '14px', fontWeight: isNew ? 700 : 500, color: '#1a1a2e', margin: 0 }}>
                                            New Enquiry from {lead.name}
                                        </p>
                                        <span style={{ fontSize: '12px', color: '#b0b0c3', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                            {timeAgo(lead.created_at)}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#555570', margin: '4px 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {lead.message && lead.message.length > 80 ? lead.message.slice(0, 80) + '…' : (lead.message || 'No message')}
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '12px', color: '#8b8ca7' }}>📞 {lead.phone}</span>
                                        {lead.property && (
                                            <span style={{ fontSize: '12px', color: '#8b8ca7' }}>🏢 {lead.property.title}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Unread indicator */}
                                {isNew && (
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', minWidth: '8px', marginTop: '8px', flexShrink: 0 }}></div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}

            <p style={{ marginTop: '16px', fontSize: '12px', color: '#b0b0c3', textAlign: 'center' }}>
                Showing last 50 enquiries · <Link href="/admin/leads" style={{ color: '#2563eb', textDecoration: 'none' }}>Manage all leads →</Link>
            </p>
        </div>
    );
}
