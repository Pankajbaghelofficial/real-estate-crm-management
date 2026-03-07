import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import { editProperty } from '../../actions';
import PropertyFormClient from '../../PropertyFormClient';

const prisma = new PrismaClient();

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const propertyId = parseInt(id, 10);

    if (isNaN(propertyId)) {
        notFound();
    }

    const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: { images: true }
    });

    if (!property) {
        notFound();
    }

    const rawData = await prisma.$queryRaw<any[]>`SELECT bedrooms, bathrooms, amenities FROM Property WHERE id = ${propertyId}`;
    if (rawData && rawData.length > 0) {
        const raw = rawData[0];
        if (typeof raw.bedrooms === 'bigint') raw.bedrooms = Number(raw.bedrooms);
        if (typeof raw.bathrooms === 'bigint') raw.bathrooms = Number(raw.bathrooms);
        Object.assign(property, raw);
    }

    const updateAction = editProperty.bind(null, propertyId);

    return (
        <PropertyFormClient
            property={{
                ...property,
                price: String(property.price),
                image_urls: property.images.map(img => img.image_url)
            }}
            action={updateAction}
            mode="edit"
        />
    );
}
