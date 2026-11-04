import 'server-only';
import { writeFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { put, list, del } from '@vercel/blob';

/*
 * Image storage.
 *  - Vercel:      BLOB_READ_WRITE_TOKEN is set → files go to Vercel Blob
 *                 (the serverless filesystem is read-only / temporary).
 *  - Local / VPS: no token → files go to public/uploads on disk.
 * Images already committed in public/uploads keep working in both modes
 * (on Vercel they are served as static files).
 */

export const UPLOAD_DIR = () => path.join(process.cwd(), 'public', 'uploads');
// Vercel rejects request bodies over 4.5 MB, so stay below that.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const BLOB_PREFIX = 'uploads/';

export const usingBlobStorage = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

type Kind = 'jpg' | 'png' | 'webp' | 'gif' | 'ico';

const CONTENT_TYPES: Record<Kind, string> = {
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    ico: 'image/x-icon',
};

/** Detect image type from file content (magic bytes) — never trust name or MIME. */
export function detectImageType(buf: Buffer): Kind | null {
    if (buf.length < 12) return null;
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
    if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
    const g = buf.subarray(0, 6).toString('ascii');
    if (g === 'GIF87a' || g === 'GIF89a') return 'gif';
    if (buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0) return 'ico';
    return null;
}

export class UploadError extends Error {}

export interface UploadedFile {
    filename: string;
    url: string;
    size: number;
    uploadedAt: string;
    /** 'blob' = Vercel Blob, 'local' = file in public/uploads */
    source: 'blob' | 'local';
}

/**
 * Validate and store an uploaded image. Filename and extension are generated
 * server-side from the detected content type, so HTML/SVG/script files can not
 * be smuggled in with an image MIME type.
 */
export async function saveImageUpload(
    file: File,
    opts: { prefix?: string; allowIco?: boolean } = {}
): Promise<{ url: string; filename: string }> {
    if (!file || typeof file.arrayBuffer !== 'function') throw new UploadError('No file provided');
    if (file.size === 0) throw new UploadError('Empty file');
    if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('File size must be less than 4MB');

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = detectImageType(buffer);
    if (!kind || (kind === 'ico' && !opts.allowIco)) {
        throw new UploadError(
            opts.allowIco
                ? 'Only JPEG, PNG, WebP, GIF and ICO images are allowed'
                : 'Only JPEG, PNG, WebP, and GIF images are allowed'
        );
    }

    const prefix = (opts.prefix || 'upload').replace(/[^a-z0-9]/gi, '');
    const filename = `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${kind}`;

    if (usingBlobStorage()) {
        const blob = await put(BLOB_PREFIX + filename, buffer, {
            access: 'public',
            contentType: CONTENT_TYPES[kind],
            addRandomSuffix: false,
            cacheControlMaxAge: 365 * 24 * 60 * 60, // names are unique, safe to cache long
        });
        return { url: blob.url, filename };
    }

    await mkdir(UPLOAD_DIR(), { recursive: true });
    await writeFile(path.join(UPLOAD_DIR(), filename), buffer, { flag: 'wx' });
    return { url: `/uploads/${filename}`, filename };
}

async function listLocalUploads(): Promise<UploadedFile[]> {
    try {
        const files = await readdir(UPLOAD_DIR());
        const images = files.filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f));
        return await Promise.all(
            images.map(async filename => {
                const info = await stat(path.join(UPLOAD_DIR(), filename));
                return {
                    filename,
                    url: `/uploads/${filename}`,
                    size: info.size,
                    uploadedAt: info.mtime.toISOString(),
                    source: 'local' as const,
                };
            })
        );
    } catch {
        return []; // folder missing or not readable (e.g. not bundled on Vercel)
    }
}

async function listBlobUploads(): Promise<UploadedFile[]> {
    const out: UploadedFile[] = [];
    let cursor: string | undefined;
    do {
        const page = await list({ prefix: BLOB_PREFIX, limit: 1000, cursor });
        for (const b of page.blobs) {
            out.push({
                filename: b.pathname.slice(BLOB_PREFIX.length),
                url: b.url,
                size: b.size,
                uploadedAt: new Date(b.uploadedAt).toISOString(),
                source: 'blob',
            });
        }
        cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor && out.length < 10_000);
    return out;
}

/** All gallery images, newest first. */
export async function listUploads(): Promise<UploadedFile[]> {
    const [local, blob] = await Promise.all([
        listLocalUploads(),
        usingBlobStorage() ? listBlobUploads() : Promise.resolve([]),
    ]);
    const items = [...blob, ...local];
    items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    return items;
}

/** Only allow a plain filename produced by us (no paths, no traversal). */
export function isSafeUploadName(name: unknown): name is string {
    return typeof name === 'string' && /^[A-Za-z0-9._-]{1,200}$/.test(name) && !name.startsWith('.') && !name.includes('..');
}

export async function deleteUpload(filename: string): Promise<void> {
    if (!isSafeUploadName(filename)) throw new UploadError('Invalid filename');

    const dir = path.resolve(UPLOAD_DIR());
    const filePath = path.resolve(dir, filename);
    if (path.dirname(filePath) !== dir) throw new UploadError('Invalid filename');
    const isLocal = await stat(filePath).then(s => s.isFile()).catch(() => false);

    if (usingBlobStorage()) {
        if (isLocal) {
            // Files shipped inside the deployment are read-only on Vercel.
            throw new UploadError('This image is part of the deployed website files and cannot be deleted here.');
        }
        await del(BLOB_PREFIX + filename);
        return;
    }

    if (!isLocal) throw new UploadError('File not found');
    await unlink(filePath);
}

/** Image URLs saved to the DB must be local uploads or https URLs (blocks javascript: etc). */
export function isSafeImageUrl(url: unknown): url is string {
    if (typeof url !== 'string' || url.length > 2000) return false;
    if (/^\/uploads\/[A-Za-z0-9._-]+$/.test(url) && !url.includes('..')) return true;
    try {
        const u = new URL(url);
        return u.protocol === 'https:';
    } catch {
        return false;
    }
}
