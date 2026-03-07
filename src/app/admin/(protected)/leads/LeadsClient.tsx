'use client';

import React, { useState } from 'react';
import LeadDashboard from '@/components/admin/leads/LeadDashboard';
import LeadDetailModal from '@/components/admin/leads/LeadDetailModal';
import AddLeadModal from '@/components/admin/leads/AddLeadModal';
import { bulkUpdateStatus, bulkDeleteLeads, importLeads, createManualLead, bulkAssignLeads } from '@/app/admin/(protected)/leads/actions';

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
    property?: any;
}

interface User {
    id: number;
    name: string;
}

export default function LeadsClient({
    initialLeads,
    agents,
    userRole
}: {
    initialLeads: Lead[];
    agents: User[];
    userRole: string;
}) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [leads, setLeads] = useState(initialLeads);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [userFilter, setUserFilter] = useState('All');
    const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const rows = text.split('\n').filter(r => r.trim()).map(row => row.split(','));
            if (rows.length < 2) return;
            const headers = rows[0].map(h => h.trim().toLowerCase());
            const dataRows = rows.slice(1);

            const leadsToImport = dataRows.map(row => {
                const lead: any = {};
                headers.forEach((header, index) => {
                    const value = row[index]?.trim();
                    if (!value) return;

                    // Flexible mapping for common header variations
                    if (header.includes('name')) lead.name = value;
                    else if (header.includes('phone') || header.includes('mobile') || header.includes('contact')) lead.phone = value;
                    else if (header.includes('email')) lead.email = value;
                    else if (header.includes('source')) lead.source = value;
                    else if (header.includes('message') || header.includes('note')) lead.message = value;
                    else lead[header] = value;
                });
                return lead;
            }).filter(l => l.name && l.phone);

            if (leadsToImport.length === 0) {
                alert('No valid leads found in CSV. Expected headers: name, phone, email, source');
                return;
            }

            setLoading(true);
            try {
                const res = await importLeads(leadsToImport);
                if (res.success) {
                    alert(`Import complete! ${res.imported} leads added, ${res.skipped} duplicates skipped.`);
                    window.location.reload();
                } else {
                    alert(`Import failed: ${res.error || 'Unknown error'}`);
                }
            } catch (err: any) {
                console.error('Import error:', err);
                alert(`Import failed: ${err.message || 'Check console for details'}`);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleAddLead = async (data: any) => {
        setLoading(true);
        try {
            await createManualLead(data);
            setIsAddModalOpen(false);
            window.location.reload();
        } catch (err) {
            alert('Failed to add lead');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedLeads.length === filteredLeads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(filteredLeads.map(l => l.id));
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(lid => lid !== id));
        } else {
            setSelectedLeads([...selectedLeads, id]);
        }
    };

    const handleBulkStatus = async (status: string) => {
        if (!status || selectedLeads.length === 0) return;
        if (!confirm(`Update ${selectedLeads.length} leads to ${status}?`)) return;
        setLoading(true);
        await bulkUpdateStatus(selectedLeads, status);
        window.location.reload();
    };

    const handleBulkDelete = async () => {
        if (selectedLeads.length === 0) return;
        if (!confirm(`Delete ${selectedLeads.length} leads?`)) return;
        setLoading(true);
        await bulkDeleteLeads(selectedLeads);
        window.location.reload();
    };

    const handleBulkAssign = async (agentIdStr: string) => {
        if (!agentIdStr || selectedLeads.length === 0) return;
        const agentId = agentIdStr === 'unassign' ? null : Number(agentIdStr);
        const agentName = agents.find(a => a.id === agentId)?.name || 'User';

        if (!confirm(`Assign ${selectedLeads.length} leads to ${agentId ? agentName : 'unassign'}?`)) return;

        setLoading(true);
        await bulkAssignLeads(selectedLeads, agentId, agentName);
        window.location.reload();
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Phone', 'Email', 'Status', 'Source', 'Date'];
        const rows = filteredLeads.map(l => [
            l.name, l.phone, l.email, l.status, l.source || 'Website', new Date(l.created_at).toLocaleDateString()
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads.csv';
        a.click();
    };

    const filteredLeads = leads.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.phone.includes(searchTerm) ||
            l.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
        const matchesUser = userFilter === 'All' ||
            (userFilter === 'unassigned' ? !l.assigned_to_id : l.assigned_to_id === Number(userFilter));
        return matchesSearch && matchesStatus && matchesUser;
    });

    const getAgentLeadCount = (agentId: number) => {
        return leads.filter(l => l.assigned_to_id === agentId).length;
    };

    const unassignedCount = leads.filter(l => !l.assigned_to_id).length;

    const stats = {
        total: leads.length,
        newLeads: leads.filter(l => l.status === 'New').length,
        followUps: leads.filter(l => l.status === 'Follow-up').length,
        converted: leads.filter(l => l.status === 'Converted').length,
        lost: leads.filter(l => l.status === 'Lost').length,
    };

    const BADGE = (color: string, bg: string): React.CSSProperties => ({
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
        fontWeight: 600, color, background: bg, whiteSpace: 'nowrap',
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'New': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
            case 'Converted': return { color: 'var(--accent-premium-gold)', bg: 'rgba(63, 192, 231, 0.15)' };
            case 'Lost': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
            case 'Follow-up': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
            default: return { color: 'var(--text-admin-dim)', bg: 'var(--bg-admin-input)' };
        }
    };

    return (
        <div style={{ background: 'var(--bg-admin)', minHeight: '100vh', padding: '28px 32px', fontFamily: "var(--font-sans)" }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-admin)', margin: 0 }}>📬 Advanced Lead Management</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-admin-dim)', margin: '4px 0 0' }}>{userRole === 'agent' ? 'Your assigned leads' : 'Full CRM control'}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".csv"
                        style={{ display: 'none' }}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="glass-panel"
                        style={{ padding: '8px 16px', color: 'var(--text-admin)', border: '1px solid var(--border-admin)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        📥 Import
                    </button>
                    <button onClick={exportToCSV} className="glass-panel" style={{ padding: '8px 16px', background: 'var(--bg-admin-card)', border: '1px solid var(--border-admin)', color: 'var(--text-admin)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>📤 Export</button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        style={{ padding: '8px 16px', background: 'var(--accent-premium-gold)', color: '#0a0f2e', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        ➕ Add Lead
                    </button>
                </div>
            </div>

            {/* Stats Dashboard */}
            <LeadDashboard stats={stats} />

            {/* Bulk Actions Bar (Conditional) */}
            {selectedLeads.length > 0 && (
                <div className="glass-panel pulse-subtle" style={{
                    background: 'var(--accent-premium-gold)',
                    color: '#0a0f2e',
                    padding: '12px 24px',
                    borderRadius: '16px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    boxShadow: '0 10px 30px rgba(63, 192, 231, 0.3)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <span style={{ fontSize: '14px', fontWeight: 800 }}>{selectedLeads.length} leads selected</span>
                    <div style={{ height: '24px', width: '1px', background: 'rgba(0,0,0,0.1)' }} />
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <select
                            disabled={loading}
                            onChange={(e) => handleBulkStatus(e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.9)', color: '#0a0f2e', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', outline: 'none', fontWeight: 600 }}
                        >
                            <option value="">Update Status...</option>
                            {['New', 'Contacted', 'Follow-up', 'Site Visit', 'Negotiation', 'Converted', 'Lost'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        {userRole === 'admin' && (
                            <select
                                disabled={loading}
                                onChange={(e) => handleBulkAssign(e.target.value)}
                                style={{ background: 'rgba(255,255,255,0.9)', color: '#0a0f2e', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', outline: 'none', fontWeight: 600 }}
                            >
                                <option value="">Assign To...</option>
                                <option value="unassign">❌ Unassign All</option>
                                {agents.map(a => (
                                    <option key={a.id} value={a.id}>👤 {a.name}</option>
                                ))}
                            </select>
                        )}

                        <button
                            disabled={loading}
                            onClick={handleBulkDelete}
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#991b1b', border: '1px solid rgba(153,27,27,0.2)', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            {loading ? 'Processing...' : 'Delete Leads'}
                        </button>
                    </div>
                    <button onClick={() => setSelectedLeads([])} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#0a0f2e', cursor: 'pointer', fontSize: '13px', fontWeight: 700, textDecoration: 'underline' }}>Deselect All</button>
                </div>
            )}

            {/* List Control Panel */}
            <div className="glass-panel" style={{ borderRadius: '16px', padding: '20px', border: '1px solid var(--border-admin)', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search leads by name, phone or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-admin)', background: 'var(--bg-admin-input)', color: 'var(--text-admin)', outline: 'none', fontSize: '14px' }}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border-admin)', outline: 'none', fontSize: '14px', background: 'var(--bg-admin-input)', color: 'var(--text-admin)', cursor: 'pointer' }}
                >
                    <option value="All" style={{ background: 'var(--bg-admin)', color: 'var(--text-admin)' }}>All Statuses</option>
                    {['New', 'Contacted', 'Follow-up', 'Site Visit', 'Negotiation', 'Converted', 'Lost'].map(s => (
                        <option key={s} value={s} style={{ background: 'var(--bg-admin)', color: 'var(--text-admin)' }}>{s}</option>
                    ))}
                </select>

                {userRole === 'admin' && (
                    <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border-admin)', outline: 'none', fontSize: '14px', background: 'var(--bg-admin-input)', color: 'var(--text-admin)', cursor: 'pointer' }}
                    >
                        <option value="All" style={{ background: 'var(--bg-admin)', color: 'var(--text-admin)' }}>All Users ({leads.length})</option>
                        <option value="unassigned" style={{ background: 'var(--bg-admin)', color: 'var(--text-admin)' }}>Unassigned ({unassignedCount})</option>
                        {agents.map(a => (
                            <option key={a.id} value={a.id} style={{ background: 'var(--bg-admin)', color: 'var(--text-admin)' }}>
                                {a.name} ({getAgentLeadCount(a.id)})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Leads Table */}
            <div className="glass-panel" style={{ borderRadius: '16px', border: '1px solid var(--border-admin)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-admin)' }}>
                            <th style={{ padding: '14px 20px', textAlign: 'left', width: '40px' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                                    onChange={toggleSelectAll}
                                    style={{ accentColor: 'var(--accent-premium-gold)' }}
                                />
                            </th>
                            <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 700, color: 'var(--text-admin-dim)', fontSize: '11px', textTransform: 'uppercase' }}>Client</th>
                            <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 700, color: 'var(--text-admin-dim)', fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 700, color: 'var(--text-admin-dim)', fontSize: '11px', textTransform: 'uppercase' }}>Source</th>
                            <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 700, color: 'var(--text-admin-dim)', fontSize: '11px', textTransform: 'uppercase' }}>Interest</th>
                            <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 700, color: 'var(--text-admin-dim)', fontSize: '11px', textTransform: 'uppercase' }}>Date</th>
                            <th style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, color: 'var(--text-admin-dim)', fontSize: '11px', textTransform: 'uppercase' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.map(lead => {
                            const sc = getStatusColor(lead.status);
                            const isSelected = selectedLeads.includes(lead.id);
                            return (
                                <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-admin)', background: isSelected ? 'rgba(63, 192, 231, 0.08)' : 'transparent' }} className="leads-table-row">
                                    <td style={{ padding: '16px 20px' }}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(lead.id)}
                                        />
                                    </td>
                                    <td style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => setSelectedLead(lead)}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-admin)' }}>{lead.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-admin-dim)' }}>{lead.phone}</div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={BADGE(sc.color, sc.bg)}>{lead.status}</span>
                                    </td>
                                    <td style={{ padding: '16px 20px', color: 'var(--text-admin-dim)', fontSize: '13px' }}>
                                        {lead.source || 'Website'}
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        {lead.property
                                            ? <span style={{ color: 'var(--accent-premium-gold)', fontSize: '13px', fontWeight: 500 }}>🏠 {lead.property.title}</span>
                                            : <span style={{ color: 'var(--text-admin-dim)', fontSize: '13px' }}>General</span>
                                        }
                                    </td>
                                    <td style={{ padding: '16px 20px', color: 'var(--text-admin-dim)', fontSize: '12px' }} suppressHydrationWarning>
                                        {new Date(lead.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => setSelectedLead(lead)}
                                            style={{ padding: '6px 14px', background: 'rgba(63, 192, 231, 0.1)', border: '1px solid var(--accent-premium-gold)', color: 'var(--accent-premium-gold)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    agents={agents}
                />
            )}

            {/* Add Lead Modal */}
            {isAddModalOpen && (
                <AddLeadModal
                    onClose={() => setIsAddModalOpen(false)}
                    onAdd={handleAddLead}
                />
            )}
        </div>
    );
}
