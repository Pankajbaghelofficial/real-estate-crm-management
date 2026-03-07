'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function addProperty(formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priceRaw = formData.get('price') as string;
    const price = parseFloat(priceRaw.replace(/[^0-9.]/g, '')) || 0;
    const location = formData.get('location') as string;
    const area_size = formData.get('area_size') as string;
    const property_type = formData.get('property_type') as string;
    const status = formData.get('status') as string;
    const is_featured = formData.get('is_featured') === 'on';

    // Extra fields
    const bedrooms = parseInt(formData.get('bedrooms') as string) || 0;
    const bathrooms = parseInt(formData.get('bathrooms') as string) || 0;
    const amenities = formData.get('amenities') as string;

    // Multiple images
    const image_urls = formData.getAll('image_urls') as string[];

    // Get current user for agent_id
    const session = await getServerSession(authOptions);
    const agent_email = session?.user?.email;
    let agent_id: number | undefined;

    if (agent_email) {
        const user = await prisma.adminUser.findUnique({ where: { email: agent_email } });
        if (user) agent_id = user.id;
    }

    const newProp = await prisma.property.create({
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
            agent_id,
            images: {
                create: image_urls.map(url => ({ image_url: url }))
            }
        },
    });

    revalidatePath('/admin/properties');
    redirect('/admin/properties');
}

export async function deleteProperty(id: number) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');

    const user = session.user as any;
    const userRole = user?.role || 'agent';
    const userId = Number(user?.id);

    if (userRole === 'agent') {
        const prop = await prisma.property.findUnique({ where: { id } }) as any;
        if (!prop || prop.agent_id !== userId) {
            throw new Error('You can only delete your own properties');
        }
    }

    await prisma.property.delete({
        where: { id },
    });
    revalidatePath('/admin/properties');
}

export async function editProperty(id: number, formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priceRaw = formData.get('price') as string;
    const price = parseFloat(priceRaw.replace(/[^0-9.]/g, '')) || 0;
    const location = formData.get('location') as string;
    const area_size = formData.get('area_size') as string;
    const property_type = formData.get('property_type') as string;
    const status = formData.get('status') as string;
    const is_featured = formData.get('is_featured') === 'on';

    // Extra fields
    const bedrooms = parseInt(formData.get('bedrooms') as string) || 0;
    const bathrooms = parseInt(formData.get('bathrooms') as string) || 0;
    const amenities = formData.get('amenities') as string;

    const image_urls = formData.getAll('image_urls') as string[];

    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');

    const user = session.user as any;
    const userRole = user?.role || 'agent';
    const userId = Number(user?.id);

    if (userRole === 'agent') {
        const prop = await prisma.property.findUnique({ where: { id } }) as any;
        if (!prop || prop.agent_id !== userId) {
            throw new Error('You can only edit your own properties');
        }
    }

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
    redirect('/admin/properties');
}
