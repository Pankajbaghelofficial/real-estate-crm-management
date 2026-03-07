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

    const updateAction = editProperty.bind(null, propertyId);

    // Map nulls from Prisma to undefined for the form client
    const clientProperty = {
        ...property,
        price: String(property.price),
        bedrooms: property.bedrooms ?? undefined,
        bathrooms: property.bathrooms ?? undefined,
        amenities: property.amenities ?? undefined,
        image_urls: property.images.map(img => img.image_url)
    };

    return (
        <PropertyFormClient
            property={clientProperty}
            action={updateAction}
            mode="edit"
        />
    );
}
