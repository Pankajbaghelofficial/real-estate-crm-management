import { prisma } from '@/lib/prisma';
import BlogsClient from './BlogsClient';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1574880534246-86d7e6ce3496?q=80&w=800';

// Strip HTML tags to get plain text
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function readTime(content: string): string {
    const text = stripHtml(content);
    const words = text.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.ceil(words / 200));
    return `${mins} min read`;
}

// Rendered per request so DB content (featured properties / posts) is never a stale build-time snapshot.
export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Blog | Sampatti Kendra — Real Estate Insights',
    description: 'Read the latest real estate news, guides, and investment tips for Agra property buyers.',
};

export default async function BlogListingPage() {
    const blogs = await prisma.blogPost.findMany({
        where: { status: 'Published' },
        include: { category: true },
        orderBy: { created_at: 'desc' },
    });

    const categories = Array.from(
        new Map(
            blogs
                .filter(b => b.category)
                .map(b => [b.category!.id, b.category!.category_name])
        ).entries()
    ).map(([id, name]) => ({ id, name }));

    const serialized = blogs.map(b => {
        const plainText = stripHtml(b.content);
        const excerpt = b.meta_description
            ? stripHtml(b.meta_description)
            : plainText.substring(0, 145) + (plainText.length > 145 ? '…' : '');
        return {
            id: b.id,
            title: b.title,
            slug: b.slug,
            content: b.content,
            excerpt,
            featured_image: b.featured_image || DEFAULT_IMAGE,
            created_at: b.created_at.toISOString(),
            readTime: readTime(b.content),
            category: b.category ? b.category.category_name : 'General',
            categoryId: b.category?.id ?? null,
        };
    });

    return <BlogsClient blogs={serialized} categories={categories} />;
}
