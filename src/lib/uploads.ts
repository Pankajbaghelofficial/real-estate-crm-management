import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const UPLOAD_DIR = () => path.join(process.cwd(), 'public', 'uploads');
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

type Kind = 'jpg' | 'png' | 'webp' | 'gif' | 'ico';

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
    if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('File size must be less than 5MB');

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
    await mkdir(UPLOAD_DIR(), { recursive: true });
    await writeFile(path.join(UPLOAD_DIR(), filename), buffer, { flag: 'wx' });
    return { url: `/uploads/${filename}`, filename };
}

/** Only allow a plain filename produced by us (no paths, no traversal). */
export function isSafeUploadName(name: unknown): name is string {
    return typeof name === 'string' && /^[A-Za-z0-9._-]{1,200}$/.test(name) && !name.startsWith('.') && !name.includes('..');
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
