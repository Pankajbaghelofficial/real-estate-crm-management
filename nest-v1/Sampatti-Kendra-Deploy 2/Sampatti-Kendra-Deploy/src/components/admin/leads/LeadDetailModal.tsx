'use client';

import React, { useState, useEffect } from 'react';
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
    const [status, setStatus] = useState(lead.status);
    const [assignedTo, setAssignedTo] = useState(lead.assigned_to_id || '');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        setLoading(true);
        await updateLeadStatus(lead.id, newStatus);
        setStatus(newStatus);
        setLoading(false);
    };

    const handleAssign = async (newAgentId: string) => {
        setLoading(true);
        const agent = agents.find(a => a.id === Number(newAgentId));
        await assignLead(lead.id, newAgentId ? Number(newAgentId) : null, agent?.name);
        setAssignedTo(newAgentId);
        setLoading(false);
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;
        setLoading(true);
        await addLeadNote(lead.id, note);
        setNote('');
        setLoading(false);
        // In a real app, you'd probably re-fetch the lead activities here
    };

    const overlayStyle: React.CSSProperties = {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px'
    };

    const modalStyle: React.CSSProperties = {
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '900px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
    };

    const statusOptions = ['New', 'Contacted', 'Follow-up', 'Site Visit', 'Negotiation', 'Converted', 'Lost'];

    return (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={modalStyle}>
                {/* Header */}
                <div style={{ padding: '24px', borderBottom: '1px solid #f0f0f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', color: '#0a0f2e' }}>{lead.name}</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>Lead ID: #{lead.id} • Source: {lead.source || 'Website'}</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', flex: 1, overflow: 'hidden' }}>
                    {/* Left side: Activity & Notes */}
                    <div style={{ padding: '24px', overflowY: 'auto', borderRight: '1px solid #f0f0f8' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px' }}>Activity & Timeline</h3>

                        {/* Add Note Form */}
                        <form onSubmit={handleAddNote} style={{ marginBottom: '32px' }}>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add a note or update about this lead..."
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button disabled={loading || !note} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', opacity: (loading || !note) ? 0.6 : 1 }}>
                                    {loading ? 'Saving...' : 'Post Note'}
                                </button>
                            </div>
                        </form>

                        {/* Activity Feed */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {lead.activities?.map((activity, i) => (
                                <div key={i} style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1', marginTop: '6px', flexShrink: 0 }} />
                                    <div>
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                                            {activity.action_type}
                                            {activity.user?.name && <span style={{ fontWeight: 400, color: '#64748b', fontSize: '13px' }}> by {activity.user.name}</span>}
                                        </p>
                                        <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>{activity.note}</p>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }} suppressHydrationWarning>{new Date(activity.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                            {!lead.activities?.length && (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                    No activity recorded yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side: Lead Info & Controls */}
                    <div style={{ padding: '24px', background: '#f8fafc', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Status</label>
                            <select
                                value={status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                            >
                                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Assigned Agent</label>
                            <select
                                value={assignedTo}
                                onChange={(e) => handleAssign(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                            >
                                <option value="">Select Agent</option>
                                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>

                        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0a0f2e' }}>Contact Details</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>PHONE</p>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>{lead.phone}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>EMAIL</p>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>{lead.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>INQUIRY MESSAGE</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{lead.message}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
