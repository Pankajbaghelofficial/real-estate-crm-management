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
        }
    });

    if (!property || property.status !== 'Published') {
        notFound();
    }
    // Defence in depth: content stored before sanitisation was added.
    property.description = sanitizeRichText(property.description);

    // Fetch the raw hidden columns bypassed from DMMF due to MacOS EPERM bug
    const rawData = await prisma.$queryRaw<any[]>`SELECT bedrooms, bathrooms, amenities, agent_id FROM Property WHERE id = ${propertyId}`;
    if (rawData && rawData.length > 0) {
        const raw = rawData[0];
        if (typeof raw.bedrooms === 'bigint') raw.bedrooms = Number(raw.bedrooms);
        if (typeof raw.bathrooms === 'bigint') raw.bathrooms = Number(raw.bathrooms);
        if (typeof raw.agent_id === 'bigint') raw.agent_id = Number(raw.agent_id);
        Object.assign(property, raw);
    }

    // Attempt to join the agent details
    let agent = null;
    if ((property as any).agent_id) {
        agent = await prisma.adminUser.findUnique({
            where: { id: (property as any).agent_id },
            select: { name: true, email: true }
        });
    }
    (property as any).agent = agent;

    return <PropertyDetailsClient property={property} />;
}
