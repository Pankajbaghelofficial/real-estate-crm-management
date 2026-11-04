import { prisma } from '@/lib/prisma';
import { hasRole, requirePageRole } from '@/lib/authz';
import LeadsClient from './LeadsClient';

export default async function ViewLeads() {
    const user = await requirePageRole('agent');
    const isAdmin = hasRole(user.role, 'admin');

    const agents = await prisma.adminUser.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    });

    // Agents: leads assigned to them OR enquiries on their own properties.
    const where = isAdmin
        ? {}
        : { OR: [{ assigned_to_id: user.id }, { property: { agent_id: user.id } }] };

    // Single query with relations (previously 2 extra queries per lead).
    const leads = await prisma.lead.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
            property: true,
            activities: {
                orderBy: { timestamp: 'desc' },
                include: { user: { select: { name: true } } },
            },
        },
    });

    return (
        <LeadsClient
            initialLeads={JSON.parse(JSON.stringify(leads))}
            agents={JSON.parse(JSON.stringify(agents))}
            userRole={isAdmin ? 'admin' : 'agent'}
        />
    );
}
