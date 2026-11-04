import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export type Role = 'superadmin' | 'admin' | 'agent';

const RANK: Record<Role, number> = { agent: 1, admin: 2, superadmin: 3 };

/** Normalise the different spellings stored in the DB (ADMIN, super_admin, ...). */
export function normalizeRole(raw: unknown): Role {
    const r = String(raw ?? '').toLowerCase().replace(/[\s_-]/g, '');
    if (r === 'superadmin') return 'superadmin';
    if (r === 'admin') return 'admin';
    return 'agent'; // least privilege for anything unknown
}

export function isValidRoleInput(raw: unknown): boolean {
    const r = String(raw ?? '').toLowerCase().replace(/[\s_-]/g, '');
    return r === 'superadmin' || r === 'admin' || r === 'agent';
}

export function hasRole(role: Role, min: Role): boolean {
    return RANK[role] >= RANK[min];
}

export interface CurrentUser {
    id: number;
    name: string;
    email: string;
    role: Role;
}

export class AuthError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'AuthError';
    }
}

/** Returns the logged-in user, or null. Never trusts client-supplied ids. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
    const session = await getServerSession(authOptions);
    const u = session?.user as { id?: string; name?: string; email?: string; role?: string } | undefined;
    const id = Number(u?.id);
    if (!u || !Number.isInteger(id) || id <= 0) return null;
    return { id, name: u.name || '', email: u.email || '', role: normalizeRole(u.role) };
}

/** For server actions / route handlers: throws if not authenticated or not authorised. */
export async function requireUser(min: Role = 'agent'): Promise<CurrentUser> {
    const user = await getCurrentUser();
    if (!user) throw new AuthError('Unauthorized');
    if (!hasRole(user.role, min)) throw new AuthError('Forbidden');
    return user;
}

/** For server components (pages): redirects instead of throwing. */
export async function requirePageRole(min: Role = 'agent'): Promise<CurrentUser> {
    const user = await getCurrentUser();
    if (!user) redirect('/admin/login');
    if (!hasRole(user.role, min)) redirect('/admin/dashboard');
    return user;
}

/** Strictly parse an array of positive integer ids coming from the client. */
export function parseIds(input: unknown): number[] {
    if (!Array.isArray(input)) return [];
    const out: number[] = [];
    for (const v of input) {
        const n = Number(v);
        if (Number.isInteger(n) && n > 0) out.push(n);
    }
    return Array.from(new Set(out)).slice(0, 1000);
}

export function parseId(input: unknown): number | null {
    const n = Number(input);
    return Number.isInteger(n) && n > 0 ? n : null;
}
