import { prisma } from '@/lib/prisma';
import { sanitizeRichText } from '@/lib/sanitize';
import { notFound } from 'next/navigation';
import PropertyDetailsClient from './PropertyDetailsClient';


export default async function PropertyDetailsPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const propertyId = parseInt(id, 10);

    if (isNaN(propertyId)) {
        notFound();
    }

    const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: {
            images: true,
            agent: { select: { name: true, email: true } },
        },
    });

    if (!property || property.status !== 'Published') {
        notFound();
    }
    // Defence in depth: content stored before sanitisation was added.
    property.description = sanitizeRichText(property.description);

    return <PropertyDetailsClient property={property} />;
}
