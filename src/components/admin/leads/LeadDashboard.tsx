import React from 'react';

export default function LeadDashboard({ stats }: { stats: any }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
                { label: 'Total Leads', value: stats.total, color: 'var(--accent-premium-gold)', icon: '📬' },
                { label: 'New', value: stats.newLeads, color: '#10b981', icon: '✨' },
                { label: 'Follow-up', value: stats.followUps, color: '#f59e0b', icon: '📞' },
                { label: 'Converted', value: stats.converted, color: 'var(--accent-premium-gold)', icon: '🏆' },
                { label: 'Lost', value: stats.lost, color: '#ef4444', icon: '❌' },
            ].map((s) => (
                <div key={s.label} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-admin)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-admin-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{s.icon}</div>
                        <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-admin)', fontFamily: 'var(--font-serif)' }}>{s.value}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-admin-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
                </div>
            ))}
        </div>
    );
}
