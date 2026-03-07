'use server';

import { getSiteSettings, saveSiteSettings, HeroSlide } from '@/lib/siteSettings';
import { revalidatePath } from 'next/cache';

export async function getHeroSlides() {
    const settings = getSiteSettings();
    return settings.heroSlides || [];
}

export async function updateHeroSlides(slides: HeroSlide[]) {
    const settings = getSiteSettings();
    settings.heroSlides = slides;
    const success = saveSiteSettings(settings);
    if (success) {
        revalidatePath('/');
    }
    return { success };
}

export async function addHeroSlide(slide: Omit<HeroSlide, 'id' | 'order'>) {
    const settings = getSiteSettings();
    if (!settings.heroSlides) settings.heroSlides = [];

    const newSlide: HeroSlide = {
        ...slide,
        id: Math.random().toString(36).slice(2, 11),
        order: settings.heroSlides.length
    };

    settings.heroSlides.push(newSlide);
    const success = saveSiteSettings(settings);
    if (success) {
        revalidatePath('/');
    }
    return { success, slide: newSlide };
}

export async function deleteHeroSlide(id: string) {
    const settings = getSiteSettings();
    if (!settings.heroSlides) return { success: false };

    settings.heroSlides = settings.heroSlides.filter(s => s.id !== id);
    // Re-order
    settings.heroSlides.forEach((s, i) => s.order = i);

    const success = saveSiteSettings(settings);
    if (success) {
        revalidatePath('/');
    }
    return { success };
}
