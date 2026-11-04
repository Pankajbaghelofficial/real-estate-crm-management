'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, isValidRoleInput, normalizeRole, parseId } from '@/lib/authz';


async function checkSuperAdmin() {
    const user = await getCurrentUser();
    return user?.role === 'superadmin' ? user : null;
}

function readRole(formData: FormData): string | null {
    const raw = formData.get('role') || 'agent';
    if (!isValidRoleInput(raw)) return null;
    return normalizeRole(raw).toUpperCase(); // stored uppercase for DB consistency
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addAdminUser(formData: FormData) {
    const isSuper = await checkSuperAdmin();
    if (!isSuper) {
        return { success: false, message: 'Access Denied: Only super admins can manage users.' };
    }

    const name = String(formData.get('name') ?? '').trim().slice(0, 100);
    const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200);
    const password = String(formData.get('password') ?? '');
    const role = readRole(formData);

    if (!name || !email || !password) {
        return { success: false, message: 'All fields are required.' };
    }
    if (!role) return { success: false, message: 'Invalid role.' };
    if (!EMAIL_RE.test(email)) return { success: false, message: 'Invalid email address.' };
    if (password.length < 8 || password.length > 200) {
        return { success: false, message: 'Password must be at least 8 characters.' };
    }

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
        return { success: false, message: 'A user with this email already exists.' };
    }

    const hashed = await bcrypt.hash(password, 12);
    // Use raw query for consistency with our CRM fixes
    await prisma.$executeRaw`
        INSERT INTO AdminUser (name, email, password, role) 
        VALUES (${name}, ${email}, ${hashed}, ${role})
    `;

    revalidatePath('/admin/users');
    return { success: true, message: `User "${name}" created successfully!` };
}

export async function updateAdminUser(userIdRaw: number, formData: FormData) {
    const me = await checkSuperAdmin();
    if (!me) {
        return { success: false, message: 'Access Denied: Only super admins can manage users.' };
    }
    const userId = parseId(userIdRaw);
    if (!userId) return { success: false, message: 'Invalid user.' };

    const name = String(formData.get('name') ?? '').trim().slice(0, 100);
    const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200);
    const password = String(formData.get('password') ?? '');
    const role = readRole(formData);

    if (!name || !email) {
        return { success: false, message: 'Name and Email are required.' };
    }
    if (!role) return { success: false, message: 'Invalid role.' };
    if (!EMAIL_RE.test(email)) return { success: false, message: 'Invalid email address.' };
    if (userId === me.id && role !== 'SUPERADMIN') {
        return { success: false, message: 'You cannot remove your own super admin role.' };
    }

    // Check if email is taken by another user
    const existing: { id: number }[] = await prisma.$queryRaw`SELECT id FROM AdminUser WHERE email = ${email} AND id != ${userId} LIMIT 1`;
    if (existing.length > 0) {
        return { success: false, message: 'This email is already in use by another account.' };
    }

    if (password && password.length > 0) {
        if (password.length < 8 || password.length > 200) {
            return { success: false, message: 'New password must be at least 8 characters.' };
        }
        const hashed = await bcrypt.hash(password, 12);
        await prisma.$executeRaw`
            UPDATE AdminUser 
            SET name = ${name}, email = ${email}, role = ${role}, password = ${hashed}
            WHERE id = ${userId}
        `;
    } else {
        await prisma.$executeRaw`
            UPDATE AdminUser 
            SET name = ${name}, email = ${email}, role = ${role}
            WHERE id = ${userId}
        `;
    }

    revalidatePath('/admin/users');
    return { success: true, message: `User "${name}" updated successfully!` };
}

export async function deleteAdminUser(userIdRaw: number) {
    const me = await checkSuperAdmin();
    if (!me) {
        return { success: false, message: 'Access Denied: Only super admins can delete users.' };
    }
    const userId = parseId(userIdRaw);
    if (!userId) return { success: false, message: 'Invalid user.' };
    if (userId === me.id) return { success: false, message: 'You cannot delete your own account.' };

    const countResult: { count: bigint | number }[] = await prisma.$queryRaw`SELECT count(*) as count FROM AdminUser`;
    const count = Number(countResult[0].count);

    if (count <= 1) {
        return { success: false, message: 'Cannot delete the last admin user.' };
    }

    await prisma.$executeRaw`DELETE FROM AdminUser WHERE id = ${userId}`;
    revalidatePath('/admin/users');
    return { success: true, message: 'User deleted successfully.' };
}
