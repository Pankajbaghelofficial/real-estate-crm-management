import React from 'react';

export default function LeadDashboard({ stats }: { stats: any }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
                { label: 'Total Leads', value: stats.total, color: '#2563eb', bg: '#eff6ff', icon: '📬' },
                { label: 'New', value: stats.newLeads, color: '#10b981', bg: '#f0fdf4', icon: '✨' },
                { label: 'Follow-up', value: stats.followUps, color: '#f59e0b', bg: '#fff7ed', icon: '📞' },
                { label: 'Converted', value: stats.converted, color: '#8b5cf6', bg: '#f5f3ff', icon: '🏆' },
                { label: 'Lost', value: stats.lost, color: '#ef4444', bg: '#fef2f2', icon: '❌' },
            ].map((s) => (
                <div key={s.label} style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #eef0f7', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{s.icon}</span>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>{s.value}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#8b8ca7' }}>{s.label}</span>
                </div>
            ))}
        </div>
    );
}
