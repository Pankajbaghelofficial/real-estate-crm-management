'use server';

import { revalidatePath } from 'next/cache';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const settingsPath = path.join(process.cwd(), 'data', 'site-settings.json');

export async function getSiteSettings() {
    try {
        const raw = fs.readFileSync(settingsPath, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return {
            siteName: 'Sampatti Kendra',
            tagline: 'Premium Properties in Agra',
            logoUrl: '',
            faviconUrl: '',
            whatsapp: '+919876543210',
            phone: '+91 98765 43210',
            email: 'info@sampattikendra.com',
            address: 'Agra, Uttar Pradesh, India',
        };
    }
}

export async function saveSiteSettings(formData: FormData) {
    const settings = await getSiteSettings();

    const updated = {
        ...settings,
        siteName: formData.get('siteName') as string || settings.siteName,
        tagline: formData.get('tagline') as string || settings.tagline,
        whatsapp: formData.get('whatsapp') as string || settings.whatsapp,
        phone: formData.get('phone') as string || settings.phone,
        email: formData.get('email') as string || settings.email,
        address: formData.get('address') as string || settings.address,
        logoUrl: formData.get('logoUrl') as string || settings.logoUrl,
        faviconUrl: formData.get('faviconUrl') as string || settings.faviconUrl,
    };

    // Handle logo file upload
    const logoFile = formData.get('logoFile') as File | null;
    if (logoFile && logoFile.size > 0) {
        const buffer = Buffer.from(await logoFile.arrayBuffer());
        const ext = logoFile.name.split('.').pop();
        const timestamp = Date.now();
        const filename = `logo_${timestamp}.${ext}`;
        const uploadPath = path.join(process.cwd(), 'public', 'uploads', filename);
        fs.writeFileSync(uploadPath, buffer);
        updated.logoUrl = `/uploads/${filename}`;
    }

    // Handle favicon/icon upload
    const iconFile = formData.get('iconFile') as File | null;
    if (iconFile && iconFile.size > 0) {
        const buffer = Buffer.from(await iconFile.arrayBuffer());
        const ext = iconFile.name.split('.').pop();
        const timestamp = Date.now();
        const filename = `favicon_${timestamp}.${ext}`;
        const uploadPath = path.join(process.cwd(), 'public', 'uploads', filename);
        fs.writeFileSync(uploadPath, buffer);
        updated.faviconUrl = `/uploads/${filename}`;
    }

    fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2), 'utf-8');
    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/settings', 'page');
    return { success: true, message: 'Website settings saved successfully!' };
}

export async function updateAdminProfile(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const userId = parseInt(formData.get('userId') as string);

    if (!name || !email) return { success: false, message: 'Name and email are required.' };

    await prisma.adminUser.update({
        where: { id: userId },
        data: { name, email },
    });

    revalidatePath('/admin/settings');
    return { success: true, message: 'Profile updated successfully!' };
}

export async function changePassword(formData: FormData) {
    const userId = parseInt(formData.get('userId') as string);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
        return { success: false, message: 'New passwords do not match.' };
    }
    if (newPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters.' };
    }

    const user = await prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: 'User not found.' };

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return { success: false, message: 'Current password is incorrect.' };

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({ where: { id: userId }, data: { password: hashed } });

    return { success: true, message: 'Password changed successfully!' };
}
