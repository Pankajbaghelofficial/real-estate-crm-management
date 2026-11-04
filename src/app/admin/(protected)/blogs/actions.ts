'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { parseId, requireUser } from '@/lib/authz';
import { isSafeImageUrl } from '@/lib/uploads';
import { sanitizeRichText } from '@/lib/sanitize';

const STATUSES = ['Draft', 'Published'];

function slugify(v: string): string {
    return v
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 200);
}

function readBlogForm(formData: FormData) {
    const s = (k: string, max = 500) => String(formData.get(k) ?? '').trim().slice(0, max);
    const title = s('title', 300);
    const slug = slugify(s('slug', 300) || title) || `post-${Date.now()}`; // non-Latin titles produce empty slugs
    const content = sanitizeRichText(String(formData.get('content') ?? '').slice(0, 500_000));
    const statusRaw = s('status', 20);
    const status = STATUSES.includes(statusRaw) ? statusRaw : 'Draft';
    const img = s('featured_image', 2000);
    const featured_image = img && isSafeImageUrl(img) ? img : null;
    const category_name = s('category_name', 100) || 'General';

    if (!title) throw new Error('Title is required');
    return { title, slug, content, status, featured_image, category_name };
}

async function ensureUniqueSlug(slug: string, excludeId?: number) {
    const existing = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
    if (existing && existing.id !== excludeId) throw new Error('A blog with this slug already exists');
}

export async function addBlog(formData: FormData) {
    await requireUser('admin');
    const { category_name, ...data } = readBlogForm(formData);
    await ensureUniqueSlug(data.slug);

    const category = await prisma.blogCategory.upsert({
        where: { category_name },
        update: {},
        create: { category_name },
    });

    await prisma.blogPost.create({ data: { ...data, category_id: category.id } });

    revalidatePath('/admin/blogs');
    revalidatePath('/blogs');
    redirect('/admin/blogs');
}

export async function editBlog(idRaw: number, formData: FormData) {
    await requireUser('admin');
    const id = parseId(idRaw);
    if (!id) throw new Error('Invalid blog');
    const { category_name, ...data } = readBlogForm(formData);
    await ensureUniqueSlug(data.slug, id);

    const category = await prisma.blogCategory.upsert({
        where: { category_name },
        update: {},
        create: { category_name },
    });

    await prisma.blogPost.update({ where: { id }, data: { ...data, category_id: category.id } });

    revalidatePath('/admin/blogs');
    revalidatePath('/blogs');
    revalidatePath(`/blogs/${data.slug}`);
    redirect('/admin/blogs');
}

export async function deleteBlog(idRaw: number) {
    await requireUser('admin');
    const id = parseId(idRaw);
    if (!id) throw new Error('Invalid blog');
    await prisma.blogPost.delete({ where: { id } });
    revalidatePath('/admin/blogs');
    revalidatePath('/blogs');
}
