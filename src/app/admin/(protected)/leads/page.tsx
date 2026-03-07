import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LeadsClient from './LeadsClient';

const prisma = new PrismaClient();

export default async function ViewLeads() {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    const rawRole = user?.role || 'agent';
    const userRole = rawRole.toLowerCase();
    const userId = Number(user?.id);

    // Normalize admin roles for internal logic
    const isAdmin = userRole === 'admin' || userRole === 'superadmin' || userRole === 'super_admin';

    let leads: any[] = [];
    const agents = await prisma.$queryRaw`SELECT id, name FROM AdminUser ORDER BY name ASC` as any[];

    if (!isAdmin) {
        if (isNaN(userId)) {
            leads = [];
        } else {
            // Agent View: Assigned leads OR leads on their properties
            leads = await prisma.$queryRaw`
                SELECT l.* FROM Lead l
                LEFT JOIN Property p ON l.property_id = p.id
                WHERE p.agent_id = ${userId} OR l.assigned_to_id = ${userId}
                ORDER BY l.created_at DESC
            ` as any[];
        }
    } else {
        // Admin View: All leads
        leads = await prisma.$queryRaw`
            SELECT * FROM Lead 
            ORDER BY created_at DESC
        ` as any[];
    }

    // Attach relations manually to bypass Prisma client validation errors
    for (let l of leads) {
        if (l.property_id) {
            // Raw query for property
            const props: any[] = await prisma.$queryRaw`SELECT * FROM Property WHERE id = ${l.property_id} LIMIT 1`;
            l.property = props[0] || null;
        }

        // Fetch activities using raw query
        l.activities = await prisma.$queryRaw`
            SELECT la.*, au.name as user_name 
            FROM LeadActivity la 
            LEFT JOIN AdminUser au ON la.user_id = au.id 
            WHERE la.lead_id = ${l.id} 
            ORDER BY la.timestamp DESC
        ` as any[];

        // Map user_name to user.name for component compatibility
        for (let a of l.activities) {
            a.user = { name: a.user_name };
        }
    }

    return (
        <LeadsClient
            initialLeads={JSON.parse(JSON.stringify(leads))}
            agents={JSON.parse(JSON.stringify(agents))}
            userRole={isAdmin ? 'admin' : 'agent'}
        />
    );
}
