'use client';

import React, { useState } from 'react';

export default function AddLeadModal({
    onClose,
    onAdd
}: {
    onClose: () => void;
    onAdd: (data: any) => void;
}) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        source: 'Walk-in',
        message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(formData);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
            <div className="glass-panel" style={{ background: 'var(--bg-admin)', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px', boxShadow: 'var(--glass-shadow)', border: '1px solid var(--border-admin)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-admin)', fontFamily: 'var(--font-serif)' }}>➕ Add New Lead</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-admin-dim)' }}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-admin-dim)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Name *</label>
                        <input
                            required
                            type="text"
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-admin)', background: 'var(--bg-admin-input)', color: 'var(--text-admin)', outline: 'none', fontWeight: 600 }}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-admin-dim)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Phone *</label>
                        <input
                            required
                            type="tel"
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-admin)', background: 'var(--bg-admin-input)', color: 'var(--text-admin)', outline: 'none', fontWeight: 600 }}
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-admin-dim)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Email</label>
                        <input
                            type="email"
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-admin)', background: 'var(--bg-admin-input)', color: 'var(--text-admin)', outline: 'none', fontWeight: 600 }}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-admin-dim)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Source</label>
                        <select
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-admin)', outline: 'none', background: 'var(--bg-admin-input)', color: 'var(--text-admin)', fontWeight: 600 }}
                            value={formData.source}
                            onChange={e => setFormData({ ...formData, source: e.target.value })}
                        >
                            {['Website', 'Facebook', 'Instagram', 'WhatsApp', 'Referral', 'Walk-in', 'Other'].map(s => <option key={s} value={s} style={{ background: 'var(--bg-admin)', color: 'var(--text-admin)' }}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-admin-dim)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Note / Message</label>
                        <textarea
                            rows={3}
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-admin)', background: 'var(--bg-admin-input)', color: 'var(--text-admin)', outline: 'none', resize: 'none', fontWeight: 500 }}
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button type="button" onClick={onClose} className="glass-panel" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border-admin)', color: 'var(--text-admin)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--accent-premium-gold)', color: '#0a0f2e', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(63, 192, 231, 0.2)' }}>Save Lead</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
