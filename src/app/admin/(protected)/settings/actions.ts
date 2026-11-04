'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireUser, AuthError } from '@/lib/authz';
import { getSiteSettings as readSiteSettings, saveSiteSettings as writeSiteSettings } from '@/lib/siteSettings';
import { UploadError, isSafeImageUrl, saveImageUpload } from '@/lib/uploads';

type Result = { success: boolean; message: string };

function fail(err: unknown): Result {
    if (err instanceof AuthError) return { success: false, message: 'Access denied.' };
    if (err instanceof UploadError) return { success: false, message: err.message };
    console.error('Settings action error:', err);
    return { success: false, message: 'Something went wrong. Please try again.' };
}

export async function getSiteSettings() {
    return readSiteSettings();
}

export async function saveSiteSettings(formData: FormData): Promise<Result> {
    try {
        await requireUser('superadmin');
        const settings = readSiteSettings();
        const s = (k: string, max = 300) => String(formData.get(k) ?? '').trim().slice(0, max);
        const url = (k: string, fallback: string) => {
            const v = s(k, 2000);
            return v && isSafeImageUrl(v) ? v : fallback;
        };

        const updated = {
            ...settings,
            siteName: s('siteName') || settings.siteName,
            tagline: s('tagline') || settings.tagline,
            whatsapp: s('whatsapp', 30).replace(/[^0-9+]/g, '') || settings.whatsapp,
            phone: s('phone', 30) || settings.phone,
            email: s('email', 200) || settings.email,
            address: s('address', 500) || settings.address,
            logoUrl: url('logoUrl', settings.logoUrl),
            faviconUrl: url('faviconUrl', settings.faviconUrl),
        };

        const logoFile = formData.get('logoFile');
        if (logoFile instanceof File && logoFile.size > 0) {
            updated.logoUrl = (await saveImageUpload(logoFile, { prefix: 'logo' })).url;
        }

        const iconFile = formData.get('iconFile');
        if (iconFile instanceof File && iconFile.size > 0) {
            updated.faviconUrl = (await saveImageUpload(iconFile, { prefix: 'favicon', allowIco: true })).url;
        }

        if (!writeSiteSettings(updated)) return { success: false, message: 'Could not save settings file.' };
        revalidatePath('/', 'layout');
        revalidatePath('/admin', 'layout');
        revalidatePath('/admin/settings', 'page');
        return { success: true, message: 'Website settings saved successfully!' };
    } catch (err) {
        return fail(err);
    }
}

// The user id always comes from the session, never from the form (prevents
// changing another user's profile / password by editing the request).
export async function updateAdminProfile(formData: FormData): Promise<Result> {
    try {
        const user = await requireUser('agent');
        const name = String(formData.get('name') ?? '').trim().slice(0, 100);
        const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200);

        if (!name || !email) return { success: false, message: 'Name and email are required.' };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, message: 'Invalid email address.' };

        const taken = await prisma.adminUser.findFirst({ where: { email, NOT: { id: user.id } }, select: { id: true } });
        if (taken) return { success: false, message: 'This email is already in use by another account.' };

        await prisma.adminUser.update({ where: { id: user.id }, data: { name, email } });
        revalidatePath('/admin', 'layout');
        return { success: true, message: 'Profile updated successfully!' };
    } catch (err) {
        return fail(err);
    }
}

export async function changePassword(formData: FormData): Promise<Result> {
    try {
        const sessionUser = await requireUser('agent');
        const currentPassword = String(formData.get('currentPassword') ?? '');
        const newPassword = String(formData.get('newPassword') ?? '');
        const confirmPassword = String(formData.get('confirmPassword') ?? '');

        if (newPassword !== confirmPassword) return { success: false, message: 'New passwords do not match.' };
        if (newPassword.length < 8) return { success: false, message: 'Password must be at least 8 characters.' };
        if (newPassword.length > 200) return { success: false, message: 'Password is too long.' };

        const user = await prisma.adminUser.findUnique({ where: { id: sessionUser.id } });
        if (!user) return { success: false, message: 'User not found.' };

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return { success: false, message: 'Current password is incorrect.' };

        const hashed = await bcrypt.hash(newPassword, 12);
        await prisma.adminUser.update({ where: { id: user.id }, data: { password: hashed } });
        return { success: true, message: 'Password changed successfully!' };
    } catch (err) {
        return fail(err);
    }
}
