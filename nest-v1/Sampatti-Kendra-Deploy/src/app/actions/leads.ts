'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function submitLead(formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const email = formData.get('email') as string;
        const message = formData.get('message') as string;
        const property_id_raw = formData.get('property_id') as string;

        let property_id = null;
        if (property_id_raw) {
            property_id = parseInt(property_id_raw, 10);
            if (isNaN(property_id)) {
                property_id = null;
            }
        }

        if (!name || !phone || !message) {
            return { success: false, error: 'Name, Phone, and Message are required fields.' };
        }

        const newLead = await prisma.lead.create({
            data: {
                name,
                phone,
                email: email || '',
                message,
                property_id,
            }
        });

        // Log initial activity using raw query
        await prisma.$executeRaw`
            INSERT INTO LeadActivity (lead_id, user_id, action_type, note, timestamp)
            VALUES (${newLead.id}, NULL, 'Created', 'Lead submitted via website form', CURRENT_TIMESTAMP)
        `;

        // Revalidate admin leads page so it shows immediately
        revalidatePath('/admin/leads');

        return { success: true };
    } catch (error) {
        console.error('Error submitting lead:', error);
        return { success: false, error: 'Failed to submit form. Please try again later.' };
    }
}
