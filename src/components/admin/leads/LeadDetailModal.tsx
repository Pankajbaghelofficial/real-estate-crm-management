'use client';

import React, { useState } from 'react';
import { updateLeadStatus, assignLead, addLeadNote, updateLeadDetail } from '@/app/admin/(protected)/leads/actions';

interface Lead {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
    source: string;
    message: string;
    created_at: string;
    follow_up_date?: string;
    assigned_to_id?: number;
    activities?: any[];
}

interface User {
    id: number;
    name: string;
}

export default function LeadDetailModal({
    lead,
    onClose,
    agents
}: {
    lead: Lead;
    onClose: () => void;
    agents: User[];
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ name: lead.name, email: lead.email, phone: lead.phone });
    const [status, setStatus] = useState(lead.status);
    const [assignedTo, setAssignedTo] = useState(lead.assigned_to_id || '');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === status) return;
        setLoading(true);
        const res = await updateLeadStatus(lead.id, newStatus);
        if (res.success) {
            setStatus(newStatus);
            window.location.reload();
        }
        setLoading(false);
    };

    const handleAssign = async (newAgentId: string) => {
        setLoading(true);
        const agent = agents.find(a => a.id === Number(newAgentId));
        const res = await assignLead(lead.id, newAgentId ? Number(newAgentId) : null, agent?.name);
        if (res.success) {
            setAssignedTo(newAgentId);
            window.location.reload();
        }
        setLoading(false);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await updateLeadDetail(lead.id, { ...editData, source: lead.source, follow_up_date: lead.follow_up_date });
        if (res.success) {
            setIsEditing(false);
            window.location.reload();
        }
        setLoading(false);
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;
        setLoading(true);
        const res = await addLeadNote(lead.id, note);
        if (res.success) {
            setNote('');
            window.location.reload();
        }
        setLoading(false);
    };

    const statusOptions = ['New', 'Contacted', 'Follow-up', 'Site Visit', 'Negotiation', 'Converted', 'Lost'];

    const getStatusStyle = (s: string) => {
        const isActive = status === s;
        switch (s) {
            case 'New': return { color: '#10b981', bg: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.03)', border: isActive ? '#10b981' : 'rgba(16, 185, 129, 0.2)' };
            case 'Converted': return { color: 'var(--accent-premium-gold)', bg: isActive ? 'rgba(63, 192, 231, 0.15)' : 'rgba(63, 192, 231, 0.03)', border: isActive ? 'var(--accent-premium-gold)' : 'rgba(63, 192, 231, 0.2)' };
            case 'Lost': return { color: '#ef4444', bg: isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.03)', border: isActive ? '#ef4444' : 'rgba(239, 68, 68, 0.2)' };
            default: return { color: 'var(--text-admin)', bg: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)', border: isActive ? 'var(--text-admin)' : 'var(--border-admin)' };
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '15px' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <style>{`
                .lead-modal-container {
                    display: grid;
                    grid-template-columns: 1fr 380px;
                    grid-template-rows: 1fr;
                    width: 100%;
                    max-width: 1100px;
                    height: 85vh;
                    background: var(--bg-admin);
                    border-radius: 32px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    border: 1px solid var(--border-admin);
                }
                .lead-modal-left, .lead-modal-right {
                    height: 100%;
                    min-height: 0;
                    display: flex;
                    flex-direction: column;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-admin); border-radius: 10px; }
                
                @media (max-width: 950px) {
                    .lead-modal-container {
                        grid-template-columns: 1fr;
                        grid-template-rows: auto;
                        height: auto;
                        max-height: 92vh;
                        overflow-y: auto !important;
                        border-radius: 24px;
                    }
                    .lead-modal-left, .lead-modal-right {
                        height: auto;
                    }
                    .lead-modal-left { border-right: none !important; border-bottom: 1px solid var(--border-admin); }
                }
            `}</style>

            <div className="lead-modal-container glass-panel">
                {/* Left Side: Profile & Timeline */}
                <div className="lead-modal-left custom-scrollbar" style={{ overflowY: 'auto', background: 'rgba(255,255,255,0.01)', borderRight: '1px solid var(--border-admin)' }}>
                    {/* Hero Header */}
                    <div style={{ padding: '40px', background: 'linear-gradient(180deg, rgba(63, 192, 231, 0.05) 0%, transparent 100%)', borderBottom: '1px solid var(--border-admin)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, var(--accent-premium-gold) 0%, #1e4d6a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 900, color: '#fff', boxShadow: '0 10px 20px rgba(63, 192, 231, 0.3)' }}>
                                    {lead.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 800, color: 'var(--text-admin)', fontFamily: 'var(--font-serif)', letterSpacing: '-0.5px' }}>{lead.name}</h2>
                                        <span style={{ padding: '4px 12px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-admin)', fontSize: '12px', fontWeight: 700, color: 'var(--text-admin-dim)' }}>ID: #{lead.id}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-admin-dim)' }}>
                                            <span style={{ color: 'var(--accent-premium-gold)' }}>●</span> {lead.source || 'Direct Entry'}
                                        </div>
                                        <button onClick={() => setIsEditing(!isEditing)} style={{ background: 'none', border: 'none', color: 'var(--accent-premium-gold)', cursor: 'pointer', fontSize: '13px', fontWeight: 700, textDecoration: 'underline', padding: 0 }}>
                                            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-admin)', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-admin)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>&times;</button>
                        </div>
                    </div>

                    <div style={{ padding: '0 40px 40px' }}>

                        {/* Primary Intel (Moved for visibility) */}
                        <div style={{ padding: '30px 0', borderBottom: '1px solid var(--border-admin)', marginBottom: '30px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-admin-dim)', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1px' }}>Primary Intel</label>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-admin)', borderRadius: '24px', padding: '24px' }}>
                                {isEditing ? (
                                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <span style={{ fontSize: '10px', color: 'var(--text-admin-dim)', fontWeight: 800 }}>NAME</span>
                                            <input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-admin-input)', color: 'var(--text-admin)', border: '1px solid var(--border-admin)', fontSize: '14px', fontWeight: 600 }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <span style={{ fontSize: '10px', color: 'var(--text-admin-dim)', fontWeight: 800 }}>PHONE</span>
                                            <input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-admin-input)', color: 'var(--text-admin)', border: '1px solid var(--border-admin)', fontSize: '14px', fontWeight: 600 }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <span style={{ fontSize: '10px', color: 'var(--text-admin-dim)', fontWeight: 800 }}>EMAIL</span>
                                            <input value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-admin-input)', color: 'var(--text-admin)', border: '1px solid var(--border-admin)', fontSize: '14px', fontWeight: 600 }} />
                                        </div>
                                        <button type="submit" style={{ marginTop: '10px', padding: '14px', background: 'var(--accent-premium-gold)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px rgba(63, 192, 231, 0.2)' }}>Save Intelligence</button>
                                    </form>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
                                            <div>
                                                <span style={{ fontSize: '10px', color: 'var(--text-admin-dim)', fontWeight: 800, display: 'block', marginBottom: '5px' }}>PHONE</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-admin)' }}>{lead.phone}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '10px', color: 'var(--text-admin-dim)', fontWeight: 800, display: 'block', marginBottom: '5px' }}>EMAIL</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-admin)' }}>{lead.email || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '10px', color: 'var(--text-admin-dim)', fontWeight: 800, display: 'block', marginBottom: '5px' }}>MESSAGE</span>
                                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-admin)', fontWeight: 500, lineHeight: 1.6, opacity: 0.85 }}>{lead.message || 'No specific requirement mentioned.'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Chipset (Moved for visibility) */}
                        <div style={{ marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid var(--border-admin)' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-admin-dim)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '1px' }}>Profile Lifecycle Status</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {statusOptions.map(opt => {
                                    const st = getStatusStyle(opt);
                                    const current = status === opt;
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => handleStatusChange(opt)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '12px',
                                                border: `1.5px solid ${st.border}`,
                                                background: st.bg,
                                                color: st.color,
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: current ? `0 4px 12px ${st.bg}` : 'none',
                                                transform: current ? 'scale(1.05)' : 'scale(1)'
                                            }}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-admin)', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Movement Timeline</h3>

                        {/* Note Input */}
                        <form onSubmit={handleAddNote} style={{ marginBottom: '45px' }}>
                            <div style={{ background: 'var(--bg-admin-input)', border: '1px solid var(--border-admin)', borderRadius: '20px', padding: '6px', position: 'relative', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Draft a new update for this lead..."
                                    style={{ width: '100%', padding: '15px', background: 'transparent', border: 'none', color: 'var(--text-admin)', fontSize: '15px', outline: 'none', resize: 'none', minHeight: '90px', fontWeight: 500 }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px' }}>
                                    <button disabled={loading || !note} style={{ padding: '10px 24px', background: 'var(--accent-premium-gold)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 12px rgba(63, 192, 231, 0.3)', transition: 'transform 0.2s' }}>
                                        {loading ? 'Processing...' : 'Add Milestone'}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Timeline List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '19px', top: '10px', bottom: '10px', width: '2px', background: 'linear-gradient(180deg, var(--accent-premium-gold) 0%, var(--border-admin) 100%)', opacity: 0.3 }} />
                            {lead.activities?.map((activity, i) => (
                                <div key={i} style={{ display: 'flex', gap: '25px', position: 'relative' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-admin)', border: '2px solid var(--accent-premium-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, boxShadow: '0 0 15px rgba(63, 192, 231, 0.15)' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-premium-gold)' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-admin)' }}>{activity.action_type}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-admin-dim)', fontWeight: 600 }}>{new Date(activity.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        </div>
                                        <div style={{ padding: '18px 22px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-admin)', fontSize: '14px', color: 'var(--text-admin)', lineHeight: 1.7, fontWeight: 500 }}>
                                            {activity.note}
                                        </div>
                                        <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-admin-dim)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--accent-premium-gold)', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>U</div>
                                            {activity.user?.name || 'System Auto'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!lead.activities?.length && (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-admin-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--border-admin)' }}>
                                    No logged movements found for this profile.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Controls & Attributes */}
                <div className="lead-modal-right lead-modal-content custom-scrollbar" style={{ padding: '32px', overflowY: 'auto', background: 'rgba(255,255,255,0.01)' }}>

                    {/* Sales Custody */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-admin-dim)', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1px' }}>Sales Ownership</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={assignedTo}
                                onChange={(e) => handleAssign(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    borderRadius: '18px',
                                    border: '1px solid var(--border-admin)',
                                    background: 'var(--bg-admin-input)',
                                    color: 'var(--text-admin)',
                                    fontWeight: 800,
                                    fontSize: '14px',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                <option value="" style={{ background: 'var(--bg-admin)', color: 'var(--text-admin)' }}>Select Official Custodian</option>
                                {agents.map(a => (
                                    <option key={a.id} value={a.id} style={{ background: 'var(--bg-admin)', color: 'var(--text-admin)' }}>👤 {a.name}</option>
                                ))}
                            </select>
                            <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-admin-dim)' }}>▼</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
