import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/authz';
import { UploadError, deleteUpload, listUploads, saveImageUpload } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

function errorResponse(err: unknown, fallback: string) {
    if (err instanceof AuthError) {
        return NextResponse.json({ error: err.message }, { status: err.message === 'Forbidden' ? 403 : 401 });
    }
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error(`${fallback}:`, err);
    return NextResponse.json({ error: fallback }, { status: 500 });
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
        return errorResponse(err, 'Upload failed');
    }
}

/* ─── GET: List all uploaded files (logged-in users; used by the gallery picker) ── */
export async function GET() {
    try {
        await requireUser('agent');
        return NextResponse.json({ files: await listUploads() });
    } catch (err) {
        return errorResponse(err, 'Failed to list files');
    }
}

/* ─── DELETE: Remove a file (admins only) ───────────────────────────── */
export async function DELETE(req: NextRequest) {
    try {
        await requireUser('admin');
        const body = await req.json().catch(() => ({}));
        await deleteUpload(body?.filename);
        return NextResponse.json({ success: true });
    } catch (err) {
        return errorResponse(err, 'Delete failed');
    }
}
