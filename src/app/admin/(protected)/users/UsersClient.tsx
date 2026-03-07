'use client';

import { useState } from 'react';
import { addAdminUser, deleteAdminUser, updateAdminUser } from './actions';

type AdminUser = { id: number; name: string; email: string; role: string };

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border-admin)',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    background: 'var(--bg-admin-input)', color: 'var(--text-admin)',
};
const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 700, color: 'var(--text-admin-dim)', display: 'block', marginBottom: '6px',
};

function StatusBanner({ message, type }: { message: string; type: 'success' | 'error' }) {
    return (
        <div style={{
            padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, marginTop: '12px',
            background: type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: type === 'success' ? '#16a34a' : '#dc2626',
            border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
        }}>
            {type === 'success' ? '✅' : '❌'} {message}
        </div>
    );
}

function EditUserModal({
    user,
    onClose,
    onUpdate
}: {
    user: AdminUser;
    onClose: () => void;
    onUpdate: (id: number, fd: FormData) => Promise<any>
}) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const fd = new FormData(e.currentTarget);
        const res = await onUpdate(user.id, fd);
        if (res.success) {
            window.location.reload();
        } else {
            setError(res.message);
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div className="glass-panel" style={{ borderRadius: '16px', width: '100%', maxWidth: '450px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', border: '1px solid var(--border-admin)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-admin)', margin: 0 }}>Edit User Profile</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-admin-dim)' }}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={labelStyle}>Full Name</label>
                        <input name="name" defaultValue={user.name} style={inputStyle} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Email Address</label>
                        <input name="email" type="email" defaultValue={user.email} style={inputStyle} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Role Access</label>
                        <select name="role" defaultValue={user.role.toLowerCase()} style={{ ...inputStyle, background: 'var(--bg-admin-input)' }}>
                            <option value="agent">Field Agent</option>
                            <option value="admin">System Admin</option>
                            <option value="superadmin">Super Admin</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>New Password (Optional)</label>
                        <input name="password" type="password" style={inputStyle} placeholder="Leave blank to keep current" />
                    </div>

                    {error && <p style={{ color: '#dc2626', fontSize: '12px', margin: 0 }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border-admin)', background: 'var(--bg-admin-input)', color: 'var(--text-admin)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--accent-premium-gold)', color: '#0a0f2e', fontWeight: 600, cursor: 'pointer' }}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function UsersClient({ users: initialUsers }: { users: AdminUser[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('agent');
    const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        const fd = new FormData(e.currentTarget);
        const result = await addAdminUser(fd);
        setMsg({ text: result.message, type: result.success ? 'success' : 'error' });
        if (result.success) {
            setName(''); setEmail(''); setPassword(''); setRole('agent');
            window.location.reload();
        }
        setSaving(false);
    };

    const handleDelete = async (id: number, userName: string) => {
        if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return;
        setDeletingId(id);
        const result = await deleteAdminUser(id);
        if (result.success) {
            setUsers(u => u.filter(u => u.id !== id));
        }
        setMsg({ text: result.message, type: result.success ? 'success' : 'error' });
        setDeletingId(null);
    };

    const roleLabel = (r: string) => {
        const nr = r.toLowerCase();
        if (nr === 'superadmin' || nr === 'super_admin') return 'Super Admin';
        if (nr === 'admin') return 'Admin';
        return 'Field Agent';
    };

    const roleColor = (r: string) => {
        const nr = r.toLowerCase();
        if (nr === 'superadmin' || nr === 'super_admin') return { background: '#0a0f2e', color: '#fff' };
        if (nr === 'admin') return { background: '#eff6ff', color: '#2563eb' };
        return { background: '#f0fdf4', color: '#16a34a' };
    };

    const permissions = [
        { role: 'Super Admin', access: 'Global Control', features: 'Dashboard, Blogs, Gallery, Properties, Enquiries, Site Settings, User Management' },
        { role: 'Admin', access: 'Total Management', features: 'Dashboard, Blogs, Gallery, Properties, Enquiries' },
        { role: 'Agent', access: 'Field Operations', features: 'Enquiry Management & Property View (Assigned only)' },
    ];

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-admin)', margin: 0 }}>👤 User Roles & Management</h1>
                <p style={{ color: 'var(--text-admin-dim)', fontSize: '14px', margin: '4px 0 0' }}>Configure access levels and manage team accounts</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px', alignItems: 'start' }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* User Table */}
                    <div className="glass-panel" style={{ borderRadius: '16px', border: '1px solid var(--border-admin)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-admin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-admin)', margin: 0 }}>👥 Active Team Members ({users.length})</h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-admin)' }}>
                                        {['Name & Profile', 'Email', 'Access Role', 'Actions'].map(col => (
                                            <th key={col} style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-admin-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, i) => (
                                        <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--bg-admin-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-premium-gold)', fontWeight: 700, fontSize: '14px', flexShrink: 0, border: '1px solid var(--border-admin)' }}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-admin)' }}>{user.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-admin-dim)' }}>{user.email}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, ...roleColor(user.role) }}>{roleLabel(user.role)}</span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => setEditingUser(user)}
                                                        style={{ padding: '6px 14px', background: 'rgba(63, 192, 231, 0.1)', color: 'var(--accent-premium-gold)', border: '1px solid var(--accent-premium-gold)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id, user.name)}
                                                        disabled={deletingId === user.id}
                                                        style={{ padding: '6px 14px', background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                                                    >
                                                        {deletingId === user.id ? '...' : 'Remove'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Permissions Guide */}
                    <div className="glass-panel" style={{ borderRadius: '16px', border: '1px solid var(--border-admin)', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-admin)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🛡️ Role Permissions Guide
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {permissions.map((p, i) => (
                                <div key={i} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-admin)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-admin)' }}>{p.role}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-premium-gold)', background: 'rgba(63, 192, 231, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{p.access}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-admin-dim)', lineHeight: '1.5' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-admin)' }}>Access:</span> {p.features}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Add User Form */}
                <div className="glass-panel" style={{ position: 'sticky', top: '24px', borderRadius: '16px', border: '1px solid var(--border-admin)', padding: '28px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-admin)', margin: '0 0 24px' }}>➕ Create Account</h2>
                    <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>Staff Name</label>
                            <input name="name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Full Name" required />
                        </div>
                        <div>
                            <label style={labelStyle}>Login Email</label>
                            <input name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="email@sampattikendra.com" required />
                        </div>
                        <div>
                            <label style={labelStyle}>Secure Password</label>
                            <input name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="Min 6 characters" required />
                        </div>
                        <div>
                            <label style={labelStyle}>Designated Role</label>
                            <select name="role" value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                                <option value="agent">Field Agent</option>
                                <option value="admin">System Admin</option>
                                <option value="superadmin">Super Admin</option>
                            </select>
                        </div>

                        <button type="submit" disabled={saving} style={{ marginTop: '10px', padding: '12px', background: 'var(--accent-premium-gold)', color: '#0a0f2e', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(63, 192, 231, 0.2)' }}>
                            {saving ? 'Creating Account...' : '🚀 Create Account'}
                        </button>

                        {msg && <StatusBanner message={msg.text} type={msg.type} />}
                    </form>
                </div>

            </div>

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onUpdate={updateAdminUser}
                />
            )}
        </div>
    );
}
