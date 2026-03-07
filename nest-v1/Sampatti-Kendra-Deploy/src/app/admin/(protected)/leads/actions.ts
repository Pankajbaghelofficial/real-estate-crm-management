'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

async function logActivity(leadId: number, actionType: string, note?: string) {
    const session = await getServerSession(authOptions);
    const userId = Number((session?.user as any)?.id);

    // Using raw query to avoid prisma client generation issues with new models/columns
    await prisma.$executeRaw`
        INSERT INTO LeadActivity (lead_id, user_id, action_type, note, timestamp)
        VALUES (${leadId}, ${isNaN(userId) ? null : userId}, ${actionType}, ${note || null}, CURRENT_TIMESTAMP)
    `;
}

export async function updateLeadStatus(leadId: number, status: string, note?: string) {
    await prisma.$executeRaw`
        UPDATE Lead SET status = ${status}, updated_at = CURRENT_TIMESTAMP WHERE id = ${leadId}
    `;
    await logActivity(leadId, 'Status Change', `Changed status to ${status}${note ? ': ' + note : ''}`);
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function assignLead(leadId: number, agentId: number | null, agentName?: string) {
    await prisma.$executeRaw`
        UPDATE Lead SET assigned_to_id = ${agentId}, updated_at = CURRENT_TIMESTAMP WHERE id = ${leadId}
    `;
    await logActivity(leadId, 'Assigned', agentId ? `Assigned to ${agentName || 'Agent'}` : 'Unassigned lead');
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function updateLeadDetail(leadId: number, data: any) {
    const { name, email, phone, source, follow_up_date } = data;
    await prisma.$executeRaw`
        UPDATE Lead 
        SET name = ${name}, 
            email = ${email}, 
            phone = ${phone}, 
            source = ${source}, 
            follow_up_date = ${follow_up_date},
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${leadId}
    `;
    await logActivity(leadId, 'Profile Update', 'Updated lead contact details');
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function addLeadNote(leadId: number, note: string) {
    await logActivity(leadId, 'Note', note);
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function deleteLead(leadId: number) {
    // Delete lead activities first due to constraints if not CASCADE
    await prisma.$executeRaw`DELETE FROM LeadActivity WHERE lead_id = ${leadId}`;
    await prisma.$executeRaw`DELETE FROM Lead WHERE id = ${leadId}`;
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function bulkDeleteLeads(leadIds: number[]) {
    if (!leadIds || leadIds.length === 0) return { success: true };
    const ids = leadIds.join(',');
    await prisma.$executeRawUnsafe(`DELETE FROM LeadActivity WHERE lead_id IN (${ids})`);
    await prisma.$executeRawUnsafe(`DELETE FROM Lead WHERE id IN (${ids})`);
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function bulkUpdateStatus(leadIds: number[], status: string) {
    if (!leadIds || leadIds.length === 0) return { success: true };
    const ids = leadIds.join(',');
    await prisma.$executeRawUnsafe(`
        UPDATE Lead SET status = '${status}', updated_at = CURRENT_TIMESTAMP WHERE id IN (${ids})
    `);

    // Log individual activities for bulk update
    for (const id of leadIds) {
        await logActivity(id, 'Bulk Status Change', `Status updated to ${status} via bulk action`);
    }
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function importLeads(leadsData: any[]) {
    try {
        const session = await getServerSession(authOptions);
        const userId = Number((session?.user as any)?.id);
        const userName = (session?.user as any)?.name || 'User';
        const userValue = isNaN(userId) ? null : userId;

        let imported = 0;
        let skipped = 0;

        for (const data of leadsData) {
            // Raw check for existing phone
            const existing: any[] = await prisma.$queryRaw`SELECT id FROM Lead WHERE phone = ${String(data.phone)} LIMIT 1`;

            if (existing.length > 0) {
                skipped++;
                continue;
            }

            // Raw insert for Lead with auto-assignment
            await prisma.$executeRaw`
                INSERT INTO Lead (name, phone, email, source, message, status, assigned_to_id, created_at, updated_at)
                VALUES (${String(data.name)}, ${String(data.phone)}, ${String(data.email || '')}, ${String(data.source || 'Import')}, ${String(data.message || '')}, 'New', ${userValue}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `;

            // Get the last inserted ID (SQLite specific)
            const lastIdResult: any[] = await prisma.$queryRaw`SELECT last_insert_rowid() as id`;
            const newId = lastIdResult[0]?.id;

            if (newId) {
                await prisma.$executeRaw`
                    INSERT INTO LeadActivity (lead_id, user_id, action_type, note, timestamp)
                    VALUES (${newId}, ${userValue}, 'Imported', ${`Lead imported via ${userName}`}, CURRENT_TIMESTAMP)
                `;
            }
            imported++;
        }

        revalidatePath('/admin/leads');
        return { success: true, imported, skipped };
    } catch (err: any) {
        console.error('importLeads error:', err);
        return { success: false, error: err.message };
    }
}

export async function createManualLead(data: any) {
    const session = await getServerSession(authOptions);
    const userId = Number((session?.user as any)?.id);
    const userName = (session?.user as any)?.name || 'User';

    await prisma.$executeRaw`
        INSERT INTO Lead (name, phone, email, source, message, status, assigned_to_id, created_at, updated_at)
        VALUES (${String(data.name)}, ${String(data.phone)}, ${String(data.email || '')}, ${String(data.source || 'Walk-in')}, ${String(data.message || '')}, 'New', ${isNaN(userId) ? null : userId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const lastIdResult: any[] = await prisma.$queryRaw`SELECT last_insert_rowid() as id`;
    const newId = lastIdResult[0].id;

    await prisma.$executeRaw`
        INSERT INTO LeadActivity (lead_id, user_id, action_type, note, timestamp)
        VALUES (${newId}, ${isNaN(userId) ? null : userId}, 'Created', ${`Lead created manually via ${userName}`}, CURRENT_TIMESTAMP)
    `;

    revalidatePath('/admin/leads');
    return { success: true };
}
