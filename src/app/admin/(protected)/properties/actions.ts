'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { hasRole, parseId, requireUser } from '@/lib/authz';
import { isSafeImageUrl } from '@/lib/uploads';
import { sanitizeRichText } from '@/lib/sanitize';
import {
    FACING_OPTIONS, FURNISHING_OPTIONS, LISTING_TYPES, OWNERSHIP_OPTIONS,
    POSSESSION_OPTIONS, PROPERTY_AGE_OPTIONS, splitAmenities,
} from '@/lib/propertySearch';

const STATUSES = ['Draft', 'Published'];

function readPropertyForm(formData: FormData) {
    const s = (k: string, max = 500) => String(formData.get(k) ?? '').trim().slice(0, max);
    const pick = <T extends string>(list: readonly T[], k: string): T | null => list.find(x => x === s(k, 50)) ?? null;
    const optInt = (k: string, min: number, max: number): number | null => {
        const raw = s(k, 10);
        if (raw === '') return null;
        const n = parseInt(raw, 10);
        return Number.isInteger(n) ? Math.max(min, Math.min(max, n)) : null;
    };
    const title = s('title', 300);
    const description = sanitizeRichText(String(formData.get('description') ?? '').slice(0, 100_000));
    const price = parseFloat(s('price').replace(/[^0-9.]/g, '')) || 0;
    const location = s('location', 300);
    const area_size = s('area_size', 100);
    const property_type = s('property_type', 50);
    const statusRaw = s('status', 20);
    const status = STATUSES.includes(statusRaw) ? statusRaw : 'Draft';
    const is_featured = formData.get('is_featured') === 'on';
    const bedrooms = Math.max(0, Math.min(100, parseInt(s('bedrooms')) || 0));
    const bathrooms = Math.max(0, Math.min(100, parseInt(s('bathrooms')) || 0));

    // Checklist amenities + free-text extras, stored comma-separated (existing format).
    const checked = formData.getAll('amenity_opts').map(v => String(v).trim().slice(0, 60)).filter(Boolean);
    const extra = splitAmenities(s('amenities', 5000)).map(a => a.slice(0, 60));
    const amenities = Array.from(new Set([...checked, ...extra])).slice(0, 60).join(', ');

    const areaRaw = parseFloat(s('area_sqft', 20).replace(/[^0-9.]/g, ''));
    const area_sqft = isFinite(areaRaw) && areaRaw > 0 ? Math.min(areaRaw, 100_000_000) : null;
    const floor_no = optInt('floor_no', -5, 200);
    const total_floors = optInt('total_floors', 0, 200);

    const details = {
        listing_type: pick(LISTING_TYPES, 'listing_type') ?? 'Sale',
        city: s('city', 100) || null,
        locality: s('locality', 150) || null,
        area_sqft,
        furnishing: pick(FURNISHING_OPTIONS, 'furnishing'),
        possession_status: pick(POSSESSION_OPTIONS, 'possession_status'),
        property_age: pick(PROPERTY_AGE_OPTIONS, 'property_age'),
        floor_no,
        total_floors,
        facing: pick(FACING_OPTIONS, 'facing'),
        balconies: optInt('balconies', 0, 50),
        ownership: pick(OWNERSHIP_OPTIONS, 'ownership'),
        rera_number: s('rera_number', 100) || null,
    };
    const image_urls = (formData.getAll('image_urls') as string[]).filter(isSafeImageUrl).slice(0, 50);

    if (!title || !location || !property_type) throw new Error('Title, location and property type are required');
    if (price < 0 || !isFinite(price)) throw new Error('Invalid price');
    if (floor_no !== null && total_floors !== null && total_floors > 0 && floor_no > total_floors) {
        throw new Error('Floor number cannot be higher than total floors');
    }

    return {
        title, description, price, location, area_size, property_type, status, is_featured, bedrooms, bathrooms, amenities,
        ...details,
        is_verified: formData.get('is_verified') === 'on',
        image_urls,
    };
}

async function assertCanModify(id: number) {
    const user = await requireUser('agent');
    if (!hasRole(user.role, 'admin')) {
        const prop = await prisma.property.findUnique({ where: { id }, select: { agent_id: true } });
        if (!prop || prop.agent_id !== user.id) {
            throw new Error('You can only modify your own properties');
        }
    }
    return user;
}


export async function addProperty(formData: FormData) {
    const user = await requireUser('agent');
    const { image_urls, is_verified, ...fields } = readPropertyForm(formData);

    await prisma.property.create({
        data: {
            ...fields,
            // Only admins can mark a listing as verified.
            is_verified: hasRole(user.role, 'admin') ? is_verified : false,
            agent_id: user.id,
            images: {
                create: image_urls.map(url => ({ image_url: url }))
            }
        },
    });

    revalidatePath('/admin/properties');
    revalidatePath('/properties');
    revalidatePath('/');
    redirect('/admin/properties');
}

export async function deleteProperty(idRaw: number) {
    const id = parseId(idRaw);
    if (!id) throw new Error('Invalid property');
    await assertCanModify(id);

    await prisma.property.delete({
        where: { id },
    });
    revalidatePath('/admin/properties');
    revalidatePath('/properties');
    revalidatePath('/');
}

export async function editProperty(idRaw: number, formData: FormData) {
    const id = parseId(idRaw);
    if (!id) throw new Error('Invalid property');
    const user = await assertCanModify(id);
    const { image_urls, is_verified, ...fields } = readPropertyForm(formData);

    await prisma.$transaction([
        // Delete all old images
        prisma.propertyImage.deleteMany({
            where: { property_id: id }
        }),
        // Update property and create new images
        prisma.property.update({
            where: { id },
            data: {
                ...fields,
                // Agents can't change the verified flag; it is left as it was.
                ...(hasRole(user.role, 'admin') ? { is_verified } : {}),
                images: {
                    create: image_urls.map(url => ({ image_url: url }))
                }
            },
        })
    ]);

    revalidatePath('/admin/properties');
    revalidatePath('/properties');
    revalidatePath(`/properties/${id}`);
    revalidatePath('/');
    redirect('/admin/properties');
}

/** Deletes every demo listing (is_demo = true). Real listings are never touched. */
export async function removeDemoListings() {
    await requireUser('admin');
    await prisma.property.deleteMany({ where: { is_demo: true } });
    revalidatePath('/admin/properties');
    revalidatePath('/properties');
    revalidatePath('/');
}
