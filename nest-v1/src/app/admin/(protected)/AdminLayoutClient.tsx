'use client';
// Force re-bundle to resolve Turbopack module factory error

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import SidebarNav from '@/components/admin/SidebarNav';
import { SiteSettings } from '@/lib/siteSettings';

export default function AdminLayoutClient({
    children,
    userName,
    userEmail,
    userRole,
    settings
}: {
    children: ReactNode;
    userName: string;
    userEmail: string;
    userRole: string;
    settings: SiteSettings;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isSidebarOpen]);

    return (
        <div className="admin-layout-wrapper">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="admin-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(10, 15, 46, 0.4)', backdropFilter: 'blur(4px)', zIndex: 35 }}
                />
            )}

            {/* White Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ zIndex: 40 }}>
                {/* Logo & Mobile Close */}
                <div style={{ padding: '20px 16px 10px', borderBottom: '1px solid #f0f0f8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                            {settings.logoUrl ? (
                                <img src={settings.logoUrl} alt={settings.siteName} style={{ height: '32px', objectFit: 'contain' }} />
                            ) : (
                                <>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #d4af37, #c9a227)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0f2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 21h18"></path>
                                            <path d="M9 8h1"></path>
                                            <path d="M9 12h1"></path>
                                            <path d="M9 16h1"></path>
                                            <path d="M14 8h1"></path>
                                            <path d="M14 12h1"></path>
                                            <path d="M14 16h1"></path>
                                            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
                                        </svg>
                                    </div>
                                    <span className="admin-logo-text" style={{
                                        fontWeight: 800, fontSize: '16px', color: '#1a1a2e',
                                        fontFamily: 'Georgia, serif', whiteSpace: 'nowrap'
                                    }}>{settings.siteName}</span>
                                </>
                            )}
                        </Link>

                        {/* Mobile close button */}
                        <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)} style={{
                            background: '#f8f9ff', border: '1px solid #e0e0f0', borderRadius: '6px',
                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#1a1a2e', fontSize: '18px'
                        }}>
                            ✕
                        </button>
                    </div>

                    {/* User Profile */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px', background: '#f8f9ff', borderRadius: '10px'
                    }}>
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4F46E5&color=fff&size=60`}
                            alt="Avatar"
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{userName}</p>
                            <p style={{ fontSize: '11px', color: '#8b8ca7', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation (Client Component) */}
                <div onClick={() => { if (window.innerWidth <= 768) setIsSidebarOpen(false); }} style={{ flex: 1, overflowY: 'auto' }}>
                    <SidebarNav userRole={userRole} />
                </div>
            </aside>

            {/* Main Content */}
            <div className="admin-main-content">
                {/* Top Bar */}
                <header className="admin-topbar">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)} style={{
                            background: 'none', border: 'none', fontSize: '24px', color: '#0a0f2e', cursor: 'pointer',
                        }}>
                            ☰
                        </button>
                        <div className="topbar-search" style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#f5f6fa', border: '1px solid #e8e8f0',
                            borderRadius: '8px', padding: '6px 12px', width: '240px'
                        }}>
                            <span style={{ color: '#a0a0b5', fontSize: '14px' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Search..."
                                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#444', width: '100%' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#8b8ca7' }}>🔔</button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#8b8ca7' }}>⚙️</button>
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4F46E5&color=fff&size=60`}
                            alt="Avatar"
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                        />
                    </div>
                </header>

                {/* Page Content */}
                <main className="admin-page-body">
                    {children}
                </main>
            </div>
        </div>
    );
}
