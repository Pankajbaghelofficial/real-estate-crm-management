'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CurrentUser, hasRole, parseId, parseIds, requireUser } from '@/lib/authz';

const LEAD_STATUSES = ['New', 'Contacted', 'Follow-up', 'Site Visit', 'Negotiation', 'Converted', 'Lost'];
const MAX_IMPORT = 5000;

function str(v: unknown, max = 500): string {
    return String(v ?? '').trim().slice(0, max);
}

function assertStatus(status: unknown): string {
    const s = String(status ?? '');
    if (!LEAD_STATUSES.includes(s)) throw new Error('Invalid status');
    return s;
}

/**
 * Admins can act on any lead. Agents only on leads assigned to them or on
 * their own properties (same rule as the leads page).
 */
async function filterAccessibleLeadIds(user: CurrentUser, ids: number[]): Promise<number[]> {
    if (ids.length === 0) return [];
    if (hasRole(user.role, 'admin')) {
        const rows = await prisma.lead.findMany({ where: { id: { in: ids } }, select: { id: true } });
        return rows.map(r => r.id);
    }
    const rows = await prisma.lead.findMany({
        where: {
            id: { in: ids },
            OR: [{ assigned_to_id: user.id }, { property: { agent_id: user.id } }],
        },
        select: { id: true },
    });
    return rows.map(r => r.id);
}

async function requireLeadAccess(leadIdRaw: unknown): Promise<{ user: CurrentUser; leadId: number }> {
    const user = await requireUser('agent');
    const leadId = parseId(leadIdRaw);
    if (!leadId) throw new Error('Invalid lead');
    const allowed = await filterAccessibleLeadIds(user, [leadId]);
    if (allowed.length === 0) throw new Error('You do not have access to this lead');
    return { user, leadId };
}

async function logActivity(user: CurrentUser | null, leadId: number, actionType: string, note?: string) {
    await prisma.leadActivity.create({
        data: { lead_id: leadId, user_id: user?.id ?? null, action_type: actionType, note: note ?? null },
    });
}

/** Agents may only assign to themselves (or unassign); admins may assign to anyone existing. */
async function resolveAssignee(user: CurrentUser, agentIdRaw: unknown): Promise<number | null> {
    if (agentIdRaw === null || agentIdRaw === undefined || agentIdRaw === '') return null;
    const agentId = parseId(agentIdRaw);
    if (!agentId) throw new Error('Invalid user');
    if (!hasRole(user.role, 'admin') && agentId !== user.id) {
        throw new Error('Agents can only assign leads to themselves');
    }
    const exists = await prisma.adminUser.findUnique({ where: { id: agentId }, select: { id: true } });
    if (!exists) throw new Error('User not found');
    return agentId;
}

export async function updateLeadStatus(leadId: number, status: string, note?: string) {
    const { user, leadId: id } = await requireLeadAccess(leadId);
    const s = assertStatus(status);
    const n = note ? str(note, 2000) : '';
    await prisma.lead.update({ where: { id }, data: { status: s } });
    await logActivity(user, id, 'Status Change', `Changed status to ${s}${n ? ': ' + n : ''}`);
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function assignLead(leadId: number, agentId: number | null, agentName?: string) {
    const { user, leadId: id } = await requireLeadAccess(leadId);
    const assignee = await resolveAssignee(user, agentId);
    await prisma.lead.update({ where: { id }, data: { assigned_to_id: assignee } });
    await logActivity(user, id, 'Assigned', assignee ? `Assigned to ${str(agentName, 100) || 'Agent'}` : 'Unassigned lead');
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function updateLeadDetail(leadId: number, data: unknown) {
    const { user, leadId: id } = await requireLeadAccess(leadId);
    const d = (data ?? {}) as Record<string, unknown>;
    const name = str(d.name, 200);
    const phone = str(d.phone, 30);
    if (!name || !phone) throw new Error('Name and phone are required');

    let follow_up_date: Date | null = null;
    if (d.follow_up_date) {
        const dt = new Date(String(d.follow_up_date));
        if (isNaN(dt.getTime())) throw new Error('Invalid follow-up date');
        follow_up_date = dt;
    }

    await prisma.lead.update({
        where: { id },
        data: {
            name,
            phone,
            email: str(d.email, 200),
            source: str(d.source, 50) || 'Website',
            follow_up_date,
        },
    });
    await logActivity(user, id, 'Profile Update', 'Updated lead contact details');
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function addLeadNote(leadId: number, note: string) {
    const { user, leadId: id } = await requireLeadAccess(leadId);
    const n = str(note, 5000);
    if (!n) throw new Error('Note is empty');
    await logActivity(user, id, 'Note', n);
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function deleteLead(leadId: number) {
    const user = await requireUser('admin');
    const id = parseId(leadId);
    if (!id) throw new Error('Invalid lead');
    void user;
    await prisma.$transaction([
        prisma.leadActivity.deleteMany({ where: { lead_id: id } }),
        prisma.lead.deleteMany({ where: { id } }),
    ]);
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function bulkDeleteLeads(leadIds: number[]) {
    await requireUser('admin');
    const ids = parseIds(leadIds);
    if (ids.length === 0) return { success: true };
    await prisma.$transaction([
        prisma.leadActivity.deleteMany({ where: { lead_id: { in: ids } } }),
        prisma.lead.deleteMany({ where: { id: { in: ids } } }),
    ]);
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function bulkUpdateStatus(leadIds: number[], status: string) {
    const user = await requireUser('agent');
    const s = assertStatus(status);
    const ids = await filterAccessibleLeadIds(user, parseIds(leadIds));
    if (ids.length === 0) return { success: true };

    await prisma.$transaction([
        prisma.lead.updateMany({ where: { id: { in: ids } }, data: { status: s } }),
        prisma.leadActivity.createMany({
            data: ids.map(id => ({
                lead_id: id,
                user_id: user.id,
                action_type: 'Bulk Status Change',
                note: `Status updated to ${s} via bulk action`,
            })),
        }),
    ]);
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function bulkAssignLeads(leadIds: number[], agentId: number | null, agentName?: string) {
    const user = await requireUser('agent');
    const assignee = await resolveAssignee(user, agentId);
    const ids = await filterAccessibleLeadIds(user, parseIds(leadIds));
    if (ids.length === 0) return { success: true };

    const note = assignee
        ? `Assigned to ${str(agentName, 100) || 'User'} via bulk action`
        : 'Unassigned via bulk action';
    await prisma.$transaction([
        prisma.lead.updateMany({ where: { id: { in: ids } }, data: { assigned_to_id: assignee } }),
        prisma.leadActivity.createMany({
            data: ids.map(id => ({ lead_id: id, user_id: user.id, action_type: 'Bulk Assignment', note })),
        }),
    ]);
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function importLeads(leadsData: unknown[]) {
    try {
        const user = await requireUser('agent');
        if (!Array.isArray(leadsData)) return { success: false, error: 'Invalid data' };
        if (leadsData.length > MAX_IMPORT) {
            return { success: false, error: `You can import at most ${MAX_IMPORT} leads at a time.` };
        }

        let imported = 0;
        let skipped = 0;

        for (const raw of leadsData) {
            const data = (raw ?? {}) as Record<string, unknown>;
            const name = str(data.name, 200);
            const phone = str(data.phone, 30);
            if (!name || !phone) {
                skipped++;
                continue;
            }

            const existing = await prisma.lead.findFirst({ where: { phone }, select: { id: true } });
            if (existing) {
                skipped++;
                continue;
            }

            await prisma.lead.create({
                data: {
                    name,
                    phone,
                    email: str(data.email, 200),
                    source: str(data.source, 50) || 'Import',
                    message: str(data.message, 5000),
                    status: 'New',
                    assigned_to_id: user.id,
                    activities: {
                        create: { user_id: user.id, action_type: 'Imported', note: `Lead imported via ${user.name || 'User'}` },
                    },
                },
            });
            imported++;
        }

        revalidatePath('/admin/leads');
        return { success: true, imported, skipped };
    } catch (err) {
        console.error('importLeads error:', err);
        const message = err instanceof Prisma.PrismaClientKnownRequestError ? 'Database error' : (err as Error).message;
        return { success: false, error: message };
    }
}

export async function createManualLead(data: unknown) {
    const user = await requireUser('agent');
    const d = (data ?? {}) as Record<string, unknown>;
    const name = str(d.name, 200);
    const phone = str(d.phone, 30);
    if (!name || !phone) throw new Error('Name and phone are required');

    await prisma.lead.create({
        data: {
            name,
            phone,
            email: str(d.email, 200),
            source: str(d.source, 50) || 'Walk-in',
            message: str(d.message, 5000),
            status: 'New',
            assigned_to_id: user.id,
            activities: {
                create: { user_id: user.id, action_type: 'Created', note: `Lead created manually via ${user.name || 'User'}` },
            },
        },
    });

    revalidatePath('/admin/leads');
    return { success: true };
}
