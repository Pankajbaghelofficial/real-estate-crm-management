import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import { editBlog } from '../../actions';
import BlogFormClient from '../../BlogFormClient';

const prisma = new PrismaClient();

export default async function EditBlogPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const blogId = parseInt(id, 10);
    if (isNaN(blogId)) notFound();

    const blog = await prisma.blogPost.findUnique({
        where: { id: blogId },
        include: { category: true },
    });
    if (!blog) notFound();

    const updateAction = editBlog.bind(null, blogId);

    return (
        <BlogFormClient
            mode="edit"
            post={{
                id: blog.id,
                title: blog.title,
                slug: blog.slug,
                category_name: blog.category?.category_name,
                status: blog.status,
                content: blog.content ?? '',
            }}
            action={updateAction}
        />
    );
}
