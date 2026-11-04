'use server';

import { getSiteSettings, saveSiteSettings, HeroSlide } from '@/lib/siteSettings';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/authz';
import { isSafeImageUrl } from '@/lib/uploads';

function cleanSlide(s: Partial<HeroSlide>): Omit<HeroSlide, 'id' | 'order'> | null {
    if (!isSafeImageUrl(s?.image_url)) return null;
    return {
        image_url: s.image_url as string,
        title: s.title ? String(s.title).slice(0, 200) : undefined,
        subtitle: s.subtitle ? String(s.subtitle).slice(0, 500) : undefined,
    };
}

// Public read (the homepage slider shows these anyway).
export async function getHeroSlides() {
    const settings = getSiteSettings();
    return settings.heroSlides || [];
}

export async function updateHeroSlides(slides: HeroSlide[]) {
    await requireUser('superadmin');
    if (!Array.isArray(slides)) return { success: false };
    const settings = getSiteSettings();
    const cleaned: HeroSlide[] = [];
    for (const s of slides.slice(0, 50)) {
        const c = cleanSlide(s);
        if (!c) continue;
        cleaned.push({ ...c, id: String(s.id ?? '').replace(/[^a-z0-9]/gi, '').slice(0, 20) || Math.random().toString(36).slice(2, 11), order: cleaned.length });
    }
    settings.heroSlides = cleaned;
    const success = saveSiteSettings(settings);
    if (success) revalidatePath('/');
    return { success };
}

export async function addHeroSlide(slide: Omit<HeroSlide, 'id' | 'order'>) {
    await requireUser('superadmin');
    const c = cleanSlide(slide);
    if (!c) return { success: false };
    const settings = getSiteSettings();
    if (!settings.heroSlides) settings.heroSlides = [];

    const newSlide: HeroSlide = {
        ...c,
        id: Math.random().toString(36).slice(2, 11),
        order: settings.heroSlides.length,
    };

    settings.heroSlides.push(newSlide);
    const success = saveSiteSettings(settings);
    if (success) revalidatePath('/');
    return { success, slide: newSlide };
}

export async function deleteHeroSlide(id: string) {
    await requireUser('superadmin');
    const settings = getSiteSettings();
    if (!settings.heroSlides) return { success: false };

    settings.heroSlides = settings.heroSlides.filter(s => s.id !== id);
    settings.heroSlides.forEach((s, i) => (s.order = i));

    const success = saveSiteSettings(settings);
    if (success) revalidatePath('/');
    return { success };
}
