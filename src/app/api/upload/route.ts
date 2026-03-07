import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = () => path.join(process.cwd(), 'public', 'uploads');

/* ─── POST: Upload a file ──────────────────────────── */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
        if (!allowedTypes.includes(file.type))
            return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and GIF images are allowed' }, { status: 400 });

        if (file.size > 5 * 1024 * 1024)
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        await mkdir(UPLOAD_DIR(), { recursive: true });
        await writeFile(path.join(UPLOAD_DIR(), filename), buffer);

        return NextResponse.json({ url: `/uploads/${filename}`, filename, originalName: file.name, size: file.size });

    } catch (err) {
        console.error('Upload error:', err);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

/* ─── GET: List all uploaded files ────────────────── */
export async function GET() {
    try {
        await mkdir(UPLOAD_DIR(), { recursive: true });
        const files = await readdir(UPLOAD_DIR());
        const imageFiles = files.filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f));

        const items = await Promise.all(
            imageFiles.map(async (filename) => {
                const filePath = path.join(UPLOAD_DIR(), filename);
                const info = await stat(filePath);
                return {
                    filename,
                    url: `/uploads/${filename}`,
                    size: info.size,
                    uploadedAt: info.mtime.toISOString(),
                };
            })
        );

        // Sort newest first
        items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        return NextResponse.json({ files: items });

    } catch (err) {
        console.error('Gallery list error:', err);
        return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }
}

/* ─── DELETE: Remove a file ────────────────────────── */
export async function DELETE(req: NextRequest) {
    try {
        const { filename } = await req.json();
        if (!filename || filename.includes('..') || filename.includes('/'))
            return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });

        const filePath = path.join(UPLOAD_DIR(), filename);
        await unlink(filePath);
        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Delete error:', err);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
