'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Basic in-memory spam throttle per client IP (single-instance deployments).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function throttled(key: string): boolean {
    const now = Date.now();
    const list = (hits.get(key) || []).filter(t => now - t < WINDOW_MS);
    if (list.length >= MAX_PER_WINDOW) {
        hits.set(key, list);
        return true;
    }
    list.push(now);
    hits.set(key, list);
    if (hits.size > 10_000) hits.clear(); // bound memory
    return false;
}

export async function submitLead(formData: FormData) {
    try {
        const s = (k: string, max: number) => String(formData.get(k) ?? '').trim().slice(0, max);
        const name = s('name', 200);
        const phone = s('phone', 30);
        const email = s('email', 200);
        const message = s('message', 5000);
        const property_id_raw = s('property_id', 20);

        if (!name || !phone || !message) {
            return { success: false, error: 'Name, Phone, and Message are required fields.' };
        }
        if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
            return { success: false, error: 'Please enter a valid phone number.' };
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { success: false, error: 'Please enter a valid email address.' };
        }

        const h = await headers();
        const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
        if (throttled(ip)) {
            return { success: false, error: 'Too many submissions. Please try again later.' };
        }

        // Only link to a property that exists and is published.
        let property_id: number | null = null;
        const pid = parseInt(property_id_raw, 10);
        if (Number.isInteger(pid) && pid > 0) {
            const prop = await prisma.property.findFirst({ where: { id: pid, status: 'Published' }, select: { id: true } });
            property_id = prop?.id ?? null;
        }

        await prisma.lead.create({
            data: {
                name,
                phone,
                email,
                message,
                property_id,
                activities: {
                    create: { action_type: 'Created', note: 'Lead submitted via website form' },
                },
            },
        });

        revalidatePath('/admin/leads');
        return { success: true };
    } catch (error) {
        console.error('Error submitting lead:', error);
        return { success: false, error: 'Failed to submit form. Please try again later.' };
    }
}
