import fs from 'fs';
import path from 'path';

export interface HeroSlide {
    id: string;
    image_url: string;
    title?: string;
    subtitle?: string;
    order: number;
}

export interface SiteSettings {
    siteName: string;
    tagline: string;
    logoUrl: string;
    faviconUrl: string;
    whatsapp: string;
    phone: string;
    email: string;
    address: string;
    heroSlides?: HeroSlide[];
}

const defaults: SiteSettings = {
    siteName: 'Sampatti Kendra',
    tagline: 'Premium Properties in Agra',
    logoUrl: '',
    faviconUrl: '',
    whatsapp: '917983804875',
    phone: '+91 98765 43210',
    email: 'info@sampattikendra.com',
    address: 'Agra, Uttar Pradesh, India',
};

export function getSiteSettings(): SiteSettings {
    try {
        const settingsPath = path.join(process.cwd(), 'data', 'site-settings.json');
        const raw = fs.readFileSync(settingsPath, 'utf-8');
        return { ...defaults, ...JSON.parse(raw) };
    } catch {
        return defaults;
    }
}
export function saveSiteSettings(settings: SiteSettings): boolean {
    try {
        const settingsPath = path.join(process.cwd(), 'data', 'site-settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('Save settings error:', err);
        return false;
    }
}
