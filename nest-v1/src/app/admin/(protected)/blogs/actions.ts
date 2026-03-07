'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function addBlog(formData: FormData) {
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const status = formData.get('status') as string;
    const featured_image = (formData.get('featured_image') as string) || null;
    const excerpt = (formData.get('excerpt') as string) || null;
    const category_name = (formData.get('category_name') as string) || 'General';

    const category = await prisma.blogCategory.upsert({
        where: { category_name },
        update: {},
        create: { category_name },
    });

    await prisma.blogPost.create({
        data: {
            title,
            slug,
            content,
            status,
            featured_image,
            category_id: category.id,
        }
    });

    revalidatePath('/admin/blogs');
    revalidatePath('/blogs');
    redirect('/admin/blogs');
}

export async function editBlog(id: number, formData: FormData) {
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const status = formData.get('status') as string;
    const featured_image = (formData.get('featured_image') as string) || null;
    const excerpt = (formData.get('excerpt') as string) || null;
    const category_name = (formData.get('category_name') as string) || 'General';

    const category = await prisma.blogCategory.upsert({
        where: { category_name },
        update: {},
        create: { category_name },
    });

    await prisma.blogPost.update({
        where: { id },
        data: {
            title,
            slug,
            content,
            status,
            featured_image,
            category_id: category.id,
        }
    });

    revalidatePath('/admin/blogs');
    revalidatePath('/blogs');
    redirect('/admin/blogs');
}

export async function deleteBlog(id: number) {
    await prisma.blogPost.delete({ where: { id } });
    revalidatePath('/admin/blogs');
    revalidatePath('/blogs');
}
