'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { hasRole, parseId, requireUser } from '@/lib/authz';
import { isSafeImageUrl } from '@/lib/uploads';
import { sanitizeRichText } from '@/lib/sanitize';

const STATUSES = ['Draft', 'Published'];

function readPropertyForm(formData: FormData) {
    const s = (k: string, max = 500) => String(formData.get(k) ?? '').trim().slice(0, max);
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
    const amenities = s('amenities', 5000);
    const image_urls = (formData.getAll('image_urls') as string[]).filter(isSafeImageUrl).slice(0, 50);

    if (!title || !location || !property_type) throw new Error('Title, location and property type are required');
    if (price < 0 || !isFinite(price)) throw new Error('Invalid price');

    return { title, description, price, location, area_size, property_type, status, is_featured, bedrooms, bathrooms, amenities, image_urls };
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
    const { image_urls, ...fields } = readPropertyForm(formData);

    await prisma.property.create({
        data: {
            ...fields,
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
    await assertCanModify(id);
    const { image_urls, title, description, price, location, area_size, property_type, status, is_featured, bedrooms, bathrooms, amenities } = readPropertyForm(formData);

    await prisma.$transaction([
        // Delete all old images
        prisma.propertyImage.deleteMany({
            where: { property_id: id }
        }),
        // Update property and create new images
        prisma.property.update({
            where: { id },
            data: {
                title,
                description,
                price,
                location,
                area_size,
                property_type,
                status,
                is_featured,
                bedrooms,
                bathrooms,
                amenities,
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
