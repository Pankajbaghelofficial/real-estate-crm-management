import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1574880534246-86d7e6ce3496?q=80&w=1200';

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function readTime(content: string): string {
    const words = stripHtml(content).split(/\s+/).length;
    return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function formatDate(d: Date) {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function BlogDetail({ params }: { params: { slug: string } }) {
    const { slug } = await params;

    const blog = await prisma.blogPost.findUnique({
        where: { slug },
        include: { category: true },
    });

    if (!blog || blog.status !== 'Published') notFound();

    const [recentPosts, allCategories] = await Promise.all([
        prisma.blogPost.findMany({
            where: { status: 'Published', NOT: { id: blog.id } },
            orderBy: { created_at: 'desc' },
            take: 5,
            include: { category: true },
        }),
        prisma.blogCategory.findMany({ orderBy: { category_name: 'asc' } }),
    ]);

    const rt = readTime(blog.content);
    const heroImage = blog.featured_image || DEFAULT_IMAGE;

    return (
        <div>
            {/* ── Hero Image Banner ─────────────────── */}
            <div style={{
                height: '480px', position: 'relative', overflow: 'hidden',
                background: '#0a0f2e',
            }}>
                <img
                    src={heroImage}
                    alt={blog.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
                />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(10,15,46,0.3) 0%, rgba(10,15,46,0.85) 100%)',
                }} />
                {/* Meta overlay */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '40px 40px 36px',
                    maxWidth: '900px', margin: '0 auto',
                }}>
                    {blog.category && (
                        <span style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #d4af37, #c9a227)',
                            color: '#0a0f2e', fontWeight: 800,
                            fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
                            padding: '4px 14px', borderRadius: '50px', marginBottom: '14px',
                        }}>
                            {blog.category.category_name}
                        </span>
                    )}
                    <h1 style={{
                        fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
                        fontWeight: 800, color: '#fff',
                        margin: '0 0 16px', lineHeight: 1.25,
                        fontFamily: 'Georgia, serif',
                        textShadow: '0 2px 16px rgba(0,0,0,0.5)',
                    }}>
                        {blog.title}
                    </h1>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {[
                            { icon: '👤', text: 'By Admin' },
                            { icon: '📅', text: formatDate(blog.created_at) },
                            { icon: '⏱️', text: rt },
                        ].map((item, i) => (
                            <span key={i} style={{
                                fontSize: '13px', color: 'rgba(255,255,255,0.75)',
                                display: 'flex', alignItems: 'center', gap: '5px',
                                fontWeight: 500,
                            }}>
                                {item.icon} {item.text}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content + Sidebar ─────────────────── */}
            <div style={{ background: '#f8f9ff', padding: '48px 24px 100px' }}>
                <div className="blog-detail-grid" style={{
                    maxWidth: '1200px', margin: '0 auto',
                    gap: '36px',
                }}>


                    {/* ── Article Body ──────────────────── */}
                    <article style={{
                        background: '#fff',
                        borderRadius: '24px',
                        border: '1.5px solid #eef0f8',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.05)',
                        overflow: 'hidden',
                    }}>
                        {/* Breadcrumb */}
                        <div style={{
                            padding: '20px 36px', borderBottom: '1px solid #f0f0f8',
                            display: 'flex', gap: '8px', alignItems: 'center',
                            fontSize: '13px', color: '#9ca3af',
                        }}>
                            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
                            <span>›</span>
                            <Link href="/blogs" style={{ color: '#6b7280', textDecoration: 'none' }}>Blog</Link>
                            <span>›</span>
                            <span style={{ color: '#374151', fontWeight: 600 }}>{blog.title}</span>
                        </div>

                        {/* Blog HTML Content */}
                        <div style={{ padding: '40px 36px 36px' }}>
                            <style>{`
                                .blog-prose h1,
                                .blog-prose h2,
                                .blog-prose h3,
                                .blog-prose h4 {
                                    font-family: Georgia, serif;
                                    color: #0a0f2e;
                                    margin: 1.6em 0 0.6em;
                                    line-height: 1.3;
                                }
                                .blog-prose h2 { font-size: 1.55rem; font-weight: 800; }
                                .blog-prose h3 { font-size: 1.25rem; font-weight: 700; }
                                .blog-prose p {
                                    font-size: 16px;
                                    line-height: 1.85;
                                    color: #374151;
                                    margin: 0 0 1.2em;
                                }
                                .blog-prose ul, .blog-prose ol {
                                    padding-left: 1.5em;
                                    margin: 0 0 1.2em;
                                }
                                .blog-prose li {
                                    font-size: 16px;
                                    line-height: 1.8;
                                    color: #374151;
                                    margin-bottom: 0.4em;
                                }
                                .blog-prose img {
                                    max-width: 100%;
                                    border-radius: 16px;
                                    margin: 1.5em 0;
                                    box-shadow: 0 4px 24px rgba(0,0,0,0.1);
                                }
                                .blog-prose blockquote {
                                    border-left: 4px solid #d4af37;
                                    padding: 12px 20px;
                                    margin: 1.5em 0;
                                    background: #fffbeb;
                                    border-radius: 0 12px 12px 0;
                                    font-style: italic;
                                    color: #6b7280;
                                }
                                .blog-prose a {
                                    color: #2563eb;
                                    text-decoration: underline;
                                }
                                .blog-prose strong { color: #0a0f2e; }
                                .blog-prose hr {
                                    border: none;
                                    border-top: 2px solid #f0f0f8;
                                    margin: 2em 0;
                                }
                                .blog-prose pre, .blog-prose code {
                                    background: #f1f5f9;
                                    border-radius: 8px;
                                    font-size: 14px;
                                    padding: 2px 6px;
                                }
                            `}</style>
                            <div
                                className="blog-prose"
                                dangerouslySetInnerHTML={{ __html: blog.content }}
                            />
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', background: '#f0f0f8', margin: '0 36px' }} />

                        {/* Tags + Share */}
                        <div style={{
                            padding: '24px 36px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            flexWrap: 'wrap', gap: '16px',
                        }}>
                            {/* Category tag */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 600 }}>Category:</span>
                                {blog.category && (
                                    <Link href={`/blogs?category=${blog.category.category_name}`} style={{
                                        background: '#eff6ff', color: '#2563eb',
                                        padding: '4px 12px', borderRadius: '50px',
                                        fontSize: '12px', fontWeight: 700, textDecoration: 'none',
                                    }}>
                                        {blog.category.category_name}
                                    </Link>
                                )}
                            </div>

                            {/* Share buttons */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 600 }}>Share:</span>
                                {[
                                    {
                                        label: 'WhatsApp', bg: '#25D366', emoji: '💬',
                                        url: `https://wa.me/?text=${encodeURIComponent(blog.title + ' ' + (typeof window !== 'undefined' ? window.location.href : ''))}`,
                                    },
                                    {
                                        label: 'Twitter', bg: '#1da1f2', emoji: '🐦',
                                        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}`,
                                    },
                                    {
                                        label: 'Facebook', bg: '#1877f2', emoji: '📘',
                                        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`,
                                    },
                                ].map(s => (
                                    <a
                                        key={s.label}
                                        href={s.url}
                                        target="_blank" rel="noopener noreferrer"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            background: s.bg, color: '#fff',
                                            padding: '7px 14px', borderRadius: '8px',
                                            fontSize: '12px', fontWeight: 700, textDecoration: 'none',
                                        }}
                                    >
                                        {s.emoji} {s.label}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Back to blog */}
                        <div style={{ padding: '0 36px 32px' }}>
                            <Link href="/blogs" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                color: '#6b7280', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
                            }}>
                                ← Back to all articles
                            </Link>
                        </div>
                    </article>

                    {/* ── Sticky Sidebar ────────────────── */}
                    <aside style={{ position: 'sticky', top: '90px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Recent Posts */}
                        <div style={{
                            background: '#fff', borderRadius: '20px',
                            border: '1.5px solid #eef0f8',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                padding: '20px 24px 16px',
                                borderBottom: '1px solid #f0f0f8',
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                <span style={{ fontSize: '16px' }}>📰</span>
                                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0a0f2e', margin: 0 }}>
                                    Recent Articles
                                </h3>
                            </div>
                            <div style={{ padding: '8px 0' }}>
                                {recentPosts.length === 0 ? (
                                    <p style={{ padding: '16px 24px', color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                                        No other posts yet.
                                    </p>
                                ) : recentPosts.map((post, i) => (
                                    <Link
                                        key={post.id}
                                        href={`/blogs/${post.slug}`}
                                        style={{
                                            display: 'flex', gap: '12px', alignItems: 'flex-start',
                                            padding: '12px 20px',
                                            borderBottom: i < recentPosts.length - 1 ? '1px solid #f8f8fc' : 'none',
                                            textDecoration: 'none', color: 'inherit',
                                        }}
                                    >
                                        <div style={{
                                            width: '52px', height: '52px', borderRadius: '10px',
                                            overflow: 'hidden', flexShrink: 0,
                                            background: '#f5f6fa',
                                        }}>
                                            <img
                                                src={post.featured_image || DEFAULT_IMAGE}
                                                alt={post.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div>
                                            <p style={{
                                                fontSize: '13px', fontWeight: 700, color: '#1a1a2e',
                                                margin: '0 0 3px', lineHeight: 1.4,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}>
                                                {post.title}
                                            </p>
                                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                {formatDate(post.created_at)}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Categories */}
                        <div style={{
                            background: '#fff', borderRadius: '20px',
                            border: '1.5px solid #eef0f8',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                padding: '20px 24px 16px',
                                borderBottom: '1px solid #f0f0f8',
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                <span style={{ fontSize: '16px' }}>🏷️</span>
                                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0a0f2e', margin: 0 }}>
                                    Categories
                                </h3>
                            </div>
                            <div style={{ padding: '12px 20px 16px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    <Link href="/blogs" style={{
                                        background: '#f5f6fa', color: '#374151',
                                        padding: '6px 14px', borderRadius: '50px',
                                        fontSize: '12px', fontWeight: 700, textDecoration: 'none',
                                        border: '1.5px solid #e8e8f0',
                                    }}>
                                        All Posts
                                    </Link>
                                    {allCategories.map(cat => (
                                        <Link
                                            key={cat.id}
                                            href={`/blogs?category=${cat.category_name}`}
                                            style={{
                                                background: blog.category?.id === cat.id ? '#eff6ff' : '#f5f6fa',
                                                color: blog.category?.id === cat.id ? '#2563eb' : '#374151',
                                                padding: '6px 14px', borderRadius: '50px',
                                                fontSize: '12px', fontWeight: 700, textDecoration: 'none',
                                                border: `1.5px solid ${blog.category?.id === cat.id ? '#bfdbfe' : '#e8e8f0'}`,
                                            }}
                                        >
                                            {cat.category_name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Newsletter CTA */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0a0f2e, #1a2d6b)',
                            borderRadius: '20px', padding: '28px 24px',
                            boxShadow: '0 8px 32px rgba(10,15,46,0.25)',
                        }}>
                            <div style={{ fontSize: '28px', marginBottom: '12px' }}>📬</div>
                            <h3 style={{
                                fontSize: '16px', fontWeight: 800, color: '#fff',
                                margin: '0 0 8px', fontFamily: 'Georgia, serif',
                            }}>
                                Get Property Updates
                            </h3>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 18px', lineHeight: 1.6 }}>
                                Subscribe for the latest Agra real estate news and insights.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input
                                    type="email"
                                    placeholder="Your email address"
                                    style={{
                                        width: '100%', padding: '12px 14px', borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'rgba(255,255,255,0.08)', color: '#fff',
                                        fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                                    }}
                                />
                                <button style={{
                                    width: '100%', padding: '12px',
                                    background: 'linear-gradient(135deg, #d4af37, #c9a227)',
                                    color: '#0a0f2e', border: 'none',
                                    borderRadius: '10px', fontSize: '13px', fontWeight: 800,
                                    cursor: 'pointer',
                                }}>
                                    Subscribe Now →
                                </button>
                            </div>
                        </div>

                        {/* Quick Enquiry CTA */}
                        <div style={{
                            background: '#fff', borderRadius: '20px', padding: '24px',
                            border: '1.5px solid #eef0f8',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🏠</div>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0a0f2e', margin: '0 0 6px' }}>
                                Looking for a Property?
                            </h3>
                            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }}>
                                Talk to our Agra property experts for free.
                            </p>
                            <Link href="/contact" style={{
                                display: 'block',
                                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                                color: '#fff', padding: '12px',
                                borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                                textDecoration: 'none',
                            }}>
                                Free Consultation →
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
