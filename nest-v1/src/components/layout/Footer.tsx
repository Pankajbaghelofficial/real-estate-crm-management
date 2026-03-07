'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SiteSettings } from '@/lib/siteSettings';

export default function Footer({ settings }: { settings: SiteSettings }) {
    const pathname = usePathname();
    if (pathname?.startsWith('/admin')) return null;

    return (
        <footer className="footer">
            <div className="container footer-content">
                <div className="footer-brand">
                    <h3>{settings.siteName}</h3>
                    <p>{settings.tagline}</p>
                </div>
                <div className="footer-links">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><Link href="/">Home</Link></li>
                        <li><Link href="/properties">Properties</Link></li>
                        <li><Link href="/blogs">Blogs</Link></li>
                        <li><Link href="/contact">Contact</Link></li>
                    </ul>
                </div>
                <div className="footer-contact">
                    <h4>Contact Us</h4>
                    <p>📍 {settings.address}</p>
                    <p>📞 {settings.phone}</p>
                    <p>✉️ {settings.email}</p>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
            </div>
        </footer>
    );
}
