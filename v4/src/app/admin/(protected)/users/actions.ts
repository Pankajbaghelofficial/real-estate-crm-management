'use server';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

async function checkSuperAdmin() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role?.toLowerCase();
    return (role === 'superadmin' || role === 'super_admin');
}

export async function addAdminUser(formData: FormData) {
    const isSuper = await checkSuperAdmin();
    if (!isSuper) {
        return { success: false, message: 'Access Denied: Only super admins can manage users.' };
    }

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = (formData.get('role') as string || 'agent').toUpperCase(); // Store as uppercase for DB consistency

    if (!name || !email || !password) {
        return { success: false, message: 'All fields are required.' };
    }
    if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters.' };
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

export async function updateAdminUser(userId: number, formData: FormData) {
    const isSuper = await checkSuperAdmin();
    if (!isSuper) {
        return { success: false, message: 'Access Denied: Only super admins can manage users.' };
    }

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = (formData.get('role') as string || 'agent').toUpperCase();

    if (!name || !email) {
        return { success: false, message: 'Name and Email are required.' };
    }

    // Check if email is taken by another user
    const existing: any[] = await prisma.$queryRaw`SELECT id FROM AdminUser WHERE email = ${email} AND id != ${userId} LIMIT 1`;
    if (existing.length > 0) {
        return { success: false, message: 'This email is already in use by another account.' };
    }

    if (password && password.length > 0) {
        if (password.length < 6) {
            return { success: false, message: 'New password must be at least 6 characters.' };
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

export async function deleteAdminUser(userId: number) {
    const isSuper = await checkSuperAdmin();
    if (!isSuper) {
        return { success: false, message: 'Access Denied: Only super admins can delete users.' };
    }

    const countResult: any[] = await prisma.$queryRaw`SELECT count(*) as count FROM AdminUser`;
    const count = Number(countResult[0].count);

    if (count <= 1) {
        return { success: false, message: 'Cannot delete the last admin user.' };
    }

    await prisma.$executeRaw`DELETE FROM AdminUser WHERE id = ${userId}`;
    revalidatePath('/admin/users');
    return { success: true, message: 'User deleted successfully.' };
}
