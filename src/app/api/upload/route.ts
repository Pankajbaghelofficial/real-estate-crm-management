import { NextRequest, NextResponse } from 'next/server';
import { mkdir, readdir, stat, unlink } from 'fs/promises';
import path from 'path';
import { AuthError, requireUser } from '@/lib/authz';
import { UPLOAD_DIR, UploadError, isSafeUploadName, saveImageUpload } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

function authErrorResponse(err: unknown) {
    if (err instanceof AuthError) {
        const status = err.message === 'Forbidden' ? 403 : 401;
        return NextResponse.json({ error: err.message }, { status });
    }
    return null;
}

/* ─── POST: Upload a file (any logged-in user, e.g. agents adding property photos) ── */
export async function POST(req: NextRequest) {
    try {
        await requireUser('agent');
        const formData = await req.formData();
        const file = formData.get('file');
        if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const { url, filename } = await saveImageUpload(file);
        return NextResponse.json({ url, filename, originalName: file.name, size: file.size });
    } catch (err) {
        const authRes = authErrorResponse(err);
        if (authRes) return authRes;
        if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
        console.error('Upload error:', err);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

/* ─── GET: List all uploaded files (logged-in users; used by the gallery picker) ── */
export async function GET() {
    try {
        await requireUser('agent');
        await mkdir(UPLOAD_DIR(), { recursive: true });
        const files = await readdir(UPLOAD_DIR());
        const imageFiles = files.filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f));

        const items = await Promise.all(
            imageFiles.map(async (filename) => {
                const info = await stat(path.join(UPLOAD_DIR(), filename));
                return {
                    filename,
                    url: `/uploads/${filename}`,
                    size: info.size,
                    uploadedAt: info.mtime.toISOString(),
                };
            })
        );

        items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        return NextResponse.json({ files: items });
    } catch (err) {
        const authRes = authErrorResponse(err);
        if (authRes) return authRes;
        console.error('Gallery list error:', err);
        return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }
}

/* ─── DELETE: Remove a file (admins only) ───────────────────────────── */
export async function DELETE(req: NextRequest) {
    try {
        await requireUser('admin');
        const body = await req.json().catch(() => ({}));
        const filename = body?.filename;
        if (!isSafeUploadName(filename))
            return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });

        const dir = UPLOAD_DIR();
        const filePath = path.resolve(dir, filename);
        if (path.dirname(filePath) !== path.resolve(dir))
            return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });

        await unlink(filePath);
        return NextResponse.json({ success: true });
    } catch (err) {
        const authRes = authErrorResponse(err);
        if (authRes) return authRes;
        console.error('Delete error:', err);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
