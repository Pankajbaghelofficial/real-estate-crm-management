import 'server-only';
import { cache } from 'react';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
// Bundled at build time: used as defaults until settings are saved from the admin panel.
import bundledSettings from '../../data/site-settings.json';

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
    ...(bundledSettings as Partial<SiteSettings>),
};

const SETTINGS_ID = 1;

/**
 * Site settings, stored in the database (single row). Deduplicated per request
 * with React cache(), so layout + metadata + page share one query.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
    try {
        const row = await prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID } });
        const stored = (row?.data ?? {}) as Partial<SiteSettings>;
        return { ...defaults, ...stored };
    } catch (err) {
        // Fail the build loudly if the DB is misconfigured; at runtime keep the site up.
        if (process.env.NEXT_PHASE === 'phase-production-build') throw err;
        console.error('getSiteSettings: falling back to defaults:', err);
        return { ...defaults };
    }
});

export async function saveSiteSettings(settings: SiteSettings): Promise<boolean> {
    try {
        const data = settings as unknown as Prisma.InputJsonValue;
        await prisma.siteSettings.upsert({
            where: { id: SETTINGS_ID },
            update: { data },
            create: { id: SETTINGS_ID, data },
        });
        return true;
    } catch (err) {
        console.error('Save settings error:', err);
        return false;
    }
}
