import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const admin = await prisma.adminUser.upsert({
            where: { email: 'admin@sampattikendra.com' },
            update: { password: hashedPassword },
            create: {
                email: 'admin@sampattikendra.com',
                name: 'Admin User',
                password: hashedPassword,
                role: 'admin',
            },
        });
        return NextResponse.json({ success: true, email: admin.email });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
