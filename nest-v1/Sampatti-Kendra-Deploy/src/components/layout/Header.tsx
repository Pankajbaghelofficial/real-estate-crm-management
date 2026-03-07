'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SiteSettings } from '@/lib/siteSettings';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
    { href: '/', label: 'Home', exact: true },
    { href: '/properties', label: 'Properties', exact: false },
    { href: '/blogs', label: 'Blog', exact: false },
    { href: '/contact', label: 'Contact', exact: false },
];

export default function Header({ settings }: { settings: SiteSettings }) {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Close menu on route change
    useEffect(() => { setMenuOpen(false); }, [pathname]);

    if (pathname?.startsWith('/admin') && pathname !== '/admin/login') return null;


    const isActive = (href: string, exact: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    return (
        <header style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
            background: 'rgba(10,15,46,0.98)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.3s ease',
            padding: '12px 0',
        }}>
            {/* Top bar */}
            <div style={{
                maxWidth: '1200px', margin: '0 auto', padding: '0 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                {/* Logo */}
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt={settings.siteName} style={{ height: '36px', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: 'linear-gradient(135deg, #d4af37, #c9a227)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '16px', color: '#0a0f2e', flexShrink: 0,
                            }}>
                                SK
                            </div>
                            <span style={{
                                fontWeight: 800, fontSize: '18px', color: '#fff',
                                fontFamily: 'Georgia, serif', letterSpacing: '-0.3px',
                            }}>
                                {settings.siteName}
                            </span>
                        </div>
                    )}
                </Link>

                {/* Desktop Nav (hidden on mobile) */}
                {!isMobile && (
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {NAV_LINKS.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                                    textDecoration: 'none', transition: 'all 0.2s',
                                    color: isActive(link.href, link.exact) ? '#d4af37' : 'rgba(255,255,255,0.8)',
                                    background: isActive(link.href, link.exact) ? 'rgba(212,175,55,0.1)' : 'transparent',
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                )}

                {/* Desktop action buttons (hidden on mobile) */}
                {!isMobile && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Link href="/admin/login" style={{
                            padding: '8px 16px', borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 600,
                            textDecoration: 'none', background: 'rgba(255,255,255,0.06)',
                        }}>
                            Admin
                        </Link>
                        <Link href="/properties" style={{
                            padding: '9px 20px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #d4af37, #c9a227)',
                            color: '#0a0f2e', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                        }}>
                            View Properties
                        </Link>
                    </div>
                )}

                {/* Hamburger (only on mobile) */}
                {isMobile && (
                    <button
                        onClick={() => setMenuOpen(o => !o)}
                        aria-label="Toggle menu"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '10px', padding: '8px 10px',
                            cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '5px',
                        }}
                    >
                        <span style={{
                            display: 'block', width: '22px', height: '2px', background: '#fff',
                            transition: 'all 0.2s',
                            transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none',
                        }} />
                        <span style={{
                            display: 'block', width: '22px', height: '2px', background: '#fff',
                            opacity: menuOpen ? 0 : 1, transition: 'all 0.2s',
                        }} />
                        <span style={{
                            display: 'block', width: '22px', height: '2px', background: '#fff',
                            transition: 'all 0.2s',
                            transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none',
                        }} />
                    </button>
                )}
            </div>

            {/* Mobile dropdown menu */}
            {isMobile && menuOpen && (
                <div style={{
                    background: 'rgba(10,15,46,0.98)', backdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: '6px',
                }}>
                    {NAV_LINKS.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                padding: '13px 16px', borderRadius: '12px', fontSize: '16px', fontWeight: 600,
                                textDecoration: 'none', display: 'block',
                                color: isActive(link.href, link.exact) ? '#d4af37' : 'rgba(255,255,255,0.85)',
                                background: isActive(link.href, link.exact) ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${isActive(link.href, link.exact) ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <Link href="/admin/login" style={{
                            flex: 1, padding: '12px 0', textAlign: 'center',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 600,
                            textDecoration: 'none', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.06)',
                        }}>
                            Admin
                        </Link>
                        <Link href="/properties" style={{
                            flex: 2, padding: '12px 0', textAlign: 'center',
                            background: 'linear-gradient(135deg, #d4af37, #c9a227)',
                            color: '#0a0f2e', fontSize: '14px', fontWeight: 700,
                            textDecoration: 'none', borderRadius: '10px',
                        }}>
                            View Properties
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
