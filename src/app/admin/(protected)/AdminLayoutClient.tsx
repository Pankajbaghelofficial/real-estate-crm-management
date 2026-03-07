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
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Persist theme choice
    useEffect(() => {
        const savedTheme = localStorage.getItem('admin-theme');
        if (savedTheme) {
            setIsDarkMode(savedTheme === 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('admin-theme', newMode ? 'dark' : 'light');
    };

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
        <div className="admin-layout-wrapper" data-theme={isDarkMode ? 'dark' : 'light'} style={{ background: 'var(--bg-admin)', minHeight: '100vh', transition: 'background 0.3s ease' }}>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="admin-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 24, 0.7)', backdropFilter: 'blur(8px)', zIndex: 35 }}
                />
            )}

            {/* Premium Glass Sidebar */}
            <aside className={`admin-sidebar glass-panel ${isSidebarOpen ? 'open' : ''}`} style={{
                zIndex: 40,
                borderRight: '1px solid var(--border-admin)',
                background: 'var(--glass-bg)',
            }}>
                {/* Logo & Mobile Close */}
                <div style={{ padding: '24px 20px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textDecoration: 'none', marginBottom: '10px' }}>
                            <div style={{
                                width: '100%', maxWidth: '180px', height: '60px', borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, overflow: 'hidden',
                                padding: '5px'
                            }}>
                                {settings.logoUrl ? (
                                    <img
                                        src={settings.logoUrl}
                                        alt="Logo"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-admin)' }}>{settings.siteName}</span>
                                )}
                            </div>
                        </Link>

                        {/* Mobile close button */}
                        <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)} style={{
                            background: 'var(--bg-admin-input)', border: '1px solid var(--border-admin)', borderRadius: '8px',
                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--text-admin)', fontSize: '16px'
                        }}>
                            ✕
                        </button>
                    </div>

                    {/* Premium User Profile Card */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px', background: 'var(--bg-admin-card)',
                        borderRadius: '12px', border: '1px solid var(--border-admin)'
                    }}>
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=d4af37&color=0a0f2e&size=60`}
                            alt="Avatar"
                            style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }}
                        />
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-admin)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{userName}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-admin-dim)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div onClick={() => { if (window.innerWidth <= 768) setIsSidebarOpen(false); }} style={{ flex: 1, overflowY: 'auto' }}>
                    <SidebarNav userRole={userRole} />
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="admin-main-content">
                {/* Premium Top Bar */}
                <header className="admin-topbar glass-panel" style={{
                    borderBottom: '1px solid var(--border-admin)',
                    margin: '16px 20px', borderRadius: '15px',
                    padding: '12px 24px', position: 'sticky', top: '16px',
                    background: 'var(--glass-bg)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)} style={{
                            background: 'none', border: 'none', fontSize: '24px', color: 'var(--text-admin)', cursor: 'pointer',
                        }}>
                            ☰
                        </button>
                        <div className="topbar-search" style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: 'var(--bg-admin-input)', border: '1px solid var(--border-admin)',
                            borderRadius: '10px', padding: '8px 16px', width: '280px',
                            marginLeft: '15px'
                        }}>
                            <span style={{ color: 'var(--text-admin-dim)', fontSize: '14px' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Search everything..."
                                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: 'var(--text-admin)', width: '100%' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            style={{
                                background: 'var(--bg-admin-input)',
                                border: '1px solid var(--border-admin)',
                                borderRadius: '10px',
                                width: '40px', height: '40px',
                                cursor: 'pointer', fontSize: '18px',
                                color: isDarkMode ? '#f5d060' : '#475569',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.3s'
                            }}
                            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDarkMode ? '☀️' : '🌙'}
                        </button>

                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-admin-dim)' }}>🔔</button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-admin-dim)' }}>⚙️</button>
                        <div style={{ width: '1px', height: '24px', background: 'var(--border-admin)' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=d4af37&color=0a0f2e&size=60`}
                                alt="Avatar"
                                style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', cursor: 'pointer' }}
                            />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="admin-page-body" style={{ padding: '0 24px' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
