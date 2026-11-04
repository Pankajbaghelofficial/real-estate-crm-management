'use client';

import type { SiteSettings } from '@/lib/siteSettings';
import { useState } from 'react';
import Link from 'next/link';
import { saveSiteSettings, updateAdminProfile, changePassword } from './actions';
import GalleryPicker from '@/components/admin/GalleryPicker';

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border-admin)',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    background: 'var(--bg-admin-input)', color: 'var(--text-admin)'
};

const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, color: 'var(--text-admin-dim)', display: 'block', marginBottom: '6px',
};

const cardStyle: React.CSSProperties = {
    background: 'var(--bg-admin-card)', borderRadius: '12px', border: '1px solid var(--border-admin)', padding: '24px',
};

const sectTitle: React.CSSProperties = {
    fontSize: '15px', fontWeight: 700, color: 'var(--text-admin)', margin: '0 0 20px',
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

export default function SettingsPageClient({
    initialSettings,
    adminUser,
}: {
    initialSettings: Record<string, string> | SiteSettings;
    adminUser: { id: number; name: string; email: string; role: string } | null;
}) {

    // Site Settings state
    const [siteSettings, setSiteSettings] = useState(initialSettings);
    const [logoPreview, setLogoPreview] = useState<string>(initialSettings.logoUrl || '');
    const [iconPreview, setIconPreview] = useState<string>(initialSettings.faviconUrl || '');
    const [siteMsg, setSiteMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [savingSite, setSavingSite] = useState(false);

    // Gallery State
    const [showGalleryFor, setShowGalleryFor] = useState<'logo' | 'icon' | null>(null);

    // Profile state
    const [profileName, setProfileName] = useState(adminUser?.name || '');
    const [profileEmail, setProfileEmail] = useState(adminUser?.email || '');
    const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);

    // Password state
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwMsg, setPwMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [savingPw, setSavingPw] = useState(false);

    const handleSiteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSavingSite(true);
        setSiteMsg(null);
        const form = e.currentTarget;
        const fd = new FormData(form);
        const result = await saveSiteSettings(fd);
        setSiteMsg({ text: result.message, type: result.success ? 'success' : 'error' });
        setSavingSite(false);
    };

    const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!adminUser) return;
        setSavingProfile(true);
        setProfileMsg(null);
        const fd = new FormData(e.currentTarget);
        fd.append('userId', adminUser.id.toString());
        const result = await updateAdminProfile(fd);
        setProfileMsg({ text: result.message, type: result.success ? 'success' : 'error' });
        setSavingProfile(false);
    };

    const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!adminUser) return;
        setSavingPw(true);
        setPwMsg(null);
        const fd = new FormData(e.currentTarget);
        fd.append('userId', adminUser.id.toString());
        const result = await changePassword(fd);
        setPwMsg({ text: result.message, type: result.success ? 'success' : 'error' });
        if (result.success) { setCurrentPw(''); setNewPw(''); setConfirmPw(''); }
        setSavingPw(false);
    };

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-admin)', margin: 0 }}>Settings</h1>
                <p style={{ color: 'var(--text-admin-dim)', fontSize: '14px', margin: '4px 0 0' }}>Manage your account and website preferences</p>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>

                {adminUser?.role?.toLowerCase() === 'superadmin' && (
                    <>
                        {/* ── Quick Links / Navigation ─────────────────── */}
                        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, var(--bg-admin-card) 0%, rgba(63, 192, 231, 0.05) 100%)', borderColor: 'var(--accent-premium-gold)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ ...sectTitle, marginBottom: '4px' }}>🖼️ Home Hero Slider</h2>
                                    <p style={{ color: 'var(--text-admin-dim)', fontSize: '13px', margin: 0 }}>Manage auto-sliding images and text on your home page</p>
                                </div>
                                <Link href="/admin/settings/hero" style={{
                                    padding: '10px 20px', background: 'var(--accent-premium-gold)', color: '#0a0f2e', borderRadius: '8px',
                                    fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s'
                                }}>
                                    Open Slider Manager →
                                </Link>
                            </div>
                        </div>

                        {/* ── Website Settings ─────────────────── */}
                        <div style={cardStyle}>
                            <h2 style={sectTitle}>🌐 Website Settings</h2>
                            <form onSubmit={handleSiteSubmit}>
                                <input type="hidden" name="siteName" value={siteSettings.siteName} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>Site Name</label>
                                        <input
                                            name="siteName"
                                            value={siteSettings.siteName}
                                            onChange={e => setSiteSettings(s => ({ ...s, siteName: e.target.value }))}
                                            style={inputStyle}
                                            placeholder="Sampatti Kendra"
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Tagline</label>
                                        <input
                                            name="tagline"
                                            value={siteSettings.tagline}
                                            onChange={e => setSiteSettings(s => ({ ...s, tagline: e.target.value }))}
                                            style={inputStyle}
                                            placeholder="Premium Properties in Agra"
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>WhatsApp Number</label>
                                        <input name="whatsapp" value={siteSettings.whatsapp} onChange={e => setSiteSettings(s => ({ ...s, whatsapp: e.target.value }))} style={inputStyle} placeholder="+919876543210" />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Contact Phone</label>
                                        <input name="phone" value={siteSettings.phone} onChange={e => setSiteSettings(s => ({ ...s, phone: e.target.value }))} style={inputStyle} placeholder="+91 98765 43210" />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Business Email</label>
                                        <input name="email" value={siteSettings.email} onChange={e => setSiteSettings(s => ({ ...s, email: e.target.value }))} style={inputStyle} placeholder="info@sampattikendra.com" />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Business Address</label>
                                        <input name="address" value={siteSettings.address} onChange={e => setSiteSettings(s => ({ ...s, address: e.target.value }))} style={inputStyle} placeholder="Agra, Uttar Pradesh, India" />
                                    </div>

                                    {/* Logo Upload */}
                                    <div>
                                        <label style={labelStyle}>Site Logo</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {logoPreview ? (
                                                    <div style={{ position: 'relative' }}>
                                                        <img src={logoPreview} alt="Logo" style={{ height: '40px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e8e8f0', padding: '4px' }} />
                                                        <button type="button" onClick={() => { setLogoPreview(''); }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
                                                    </div>
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px' }}>S</div>
                                                )}
                                                <button type="button" onClick={() => setShowGalleryFor('logo')} style={{ padding: '8px 14px', border: '1px dashed #2563eb', background: '#eff6ff', color: '#2563eb', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                                                    🖼️ Gallery
                                                </button>
                                            </div>
                                            <input
                                                type="file"
                                                name="logoFile"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = URL.createObjectURL(file);
                                                        setLogoPreview(url);
                                                    }
                                                }}
                                                style={{ fontSize: '12px', color: '#8b8ca7' }}
                                            />
                                            <input type="hidden" name="logoUrl" value={logoPreview.startsWith('blob:') ? '' : logoPreview} />
                                        </div>
                                    </div>

                                    {/* Favicon/Icon Upload */}
                                    <div>
                                        <label style={labelStyle}>Site Icon / Favicon</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {iconPreview ? (
                                                    <div style={{ position: 'relative' }}>
                                                        <img src={iconPreview} alt="Icon" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e8e8f0', padding: '2px' }} />
                                                        <button type="button" onClick={() => { setIconPreview(''); }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
                                                    </div>
                                                ) : (
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏠</div>
                                                )}
                                                <button type="button" onClick={() => setShowGalleryFor('icon')} style={{ padding: '8px 14px', border: '1px dashed #2563eb', background: '#eff6ff', color: '#2563eb', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                                                    🖼️ Gallery
                                                </button>
                                            </div>
                                            <input
                                                type="file"
                                                name="iconFile"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = URL.createObjectURL(file);
                                                        setIconPreview(url);
                                                    }
                                                }}
                                                style={{ fontSize: '12px', color: '#8b8ca7' }}
                                            />
                                            <input type="hidden" name="faviconUrl" value={iconPreview.startsWith('blob:') ? '' : iconPreview} />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={savingSite} style={{ marginTop: '20px', padding: '10px 22px', background: 'var(--accent-premium-gold)', color: '#0a0f2e', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                                    {savingSite ? '💾 Saving…' : '💾 Save Website Settings'}
                                </button>
                                {siteMsg && <StatusBanner message={siteMsg.text} type={siteMsg.type} />}
                            </form>
                        </div>
                    </>
                )}

                {/* ── Profile Section ─────────────────── */}
                <div style={cardStyle}>
                    <h2 style={sectTitle}>👤 Profile Information</h2>
                    <form onSubmit={handleProfileSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Full Name</label>
                                <input name="name" value={profileName} onChange={e => setProfileName(e.target.value)} style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Email Address</label>
                                <input name="email" type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Role</label>
                                <input type="text" value={adminUser?.role || 'admin'} readOnly style={{ ...inputStyle, background: '#f8f9ff', color: '#8b8ca7', cursor: 'not-allowed' }} />
                            </div>
                        </div>
                        <button type="submit" disabled={savingProfile} style={{ marginTop: '20px', padding: '10px 22px', background: 'var(--accent-premium-gold)', color: '#0a0f2e', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                            {savingProfile ? 'Saving…' : '✅ Save Profile'}
                        </button>
                        {profileMsg && <StatusBanner message={profileMsg.text} type={profileMsg.type} />}
                    </form>
                </div>

                {/* ── Change Password ──────────────────── */}
                <div style={cardStyle}>
                    <h2 style={sectTitle}>🔒 Change Password</h2>
                    <form onSubmit={handlePasswordSubmit}>
                        <div style={{ display: 'grid', gap: '14px', maxWidth: '480px' }}>
                            <div>
                                <label style={labelStyle}>Current Password</label>
                                <input name="currentPassword" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={inputStyle} placeholder="Enter current password" required />
                            </div>
                            <div>
                                <label style={labelStyle}>New Password</label>
                                <input name="newPassword" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={inputStyle} placeholder="Minimum 8 characters" minLength={8} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Confirm New Password</label>
                                <input name="confirmPassword" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={inputStyle} placeholder="Re-enter new password" required />
                            </div>
                        </div>
                        <button type="submit" disabled={savingPw} style={{ marginTop: '20px', padding: '10px 22px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                            {savingPw ? 'Updating…' : '🔑 Update Password'}
                        </button>
                        {pwMsg && <StatusBanner message={pwMsg.text} type={pwMsg.type} />}
                    </form>
                </div>
            </div>

            <GalleryPicker
                isOpen={showGalleryFor !== null}
                onClose={() => setShowGalleryFor(null)}
                title={showGalleryFor === 'logo' ? "Select Site Logo" : "Select Favicon"}
                onSelect={(urls) => {
                    const url = Array.isArray(urls) ? urls[0] : urls;
                    if (showGalleryFor === 'logo') {
                        setLogoPreview(url);
                        setSiteSettings(s => ({ ...s, logoUrl: url }));
                    } else if (showGalleryFor === 'icon') {
                        setIconPreview(url);
                        setSiteSettings(s => ({ ...s, faviconUrl: url }));
                    }
                    setShowGalleryFor(null);
                }}
            />
        </div>
    );
}
