'use client';

import { useState } from 'react';
import Link from 'next/link';

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    featured_image: string;
    created_at: string;
    readTime: string;
    category: string;
    categoryId: number | null;
}

interface Category {
    id: number;
    name: string;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
}

export default function BlogsClient({
    blogs,
    categories,
}: {
    blogs: BlogPost[];
    categories: Category[];
}) {
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    const filtered = blogs.filter(b => {
        const matchCat = activeCategory === null || b.categoryId === activeCategory;
        const matchSearch =
            search.trim() === '' ||
            b.title.toLowerCase().includes(search.toLowerCase()) ||
            b.excerpt.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    const featured = filtered[0];
    const rest = filtered.slice(1);

    return (
        <div>
            {/* ── Hero Banner ─────────────────────────── */}
            <section style={{
                background: 'linear-gradient(135deg, #0a0f2e 0%, #0d1b4b 50%, #1a2d6b 100%)',
                padding: '140px 24px 80px',
                position: 'relative', overflow: 'hidden', textAlign: 'center',
            }}>
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <div style={{
                        position: 'absolute', top: '-60px', right: '-80px',
                        width: '400px', height: '400px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
                    }} />
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }} />
                </div>
                <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
                    <span style={{
                        display: 'inline-block',
                        background: 'rgba(212,175,55,0.12)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: '#d4af37', fontWeight: 700,
                        fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
                        padding: '6px 16px', borderRadius: '50px', marginBottom: '20px',
                    }}>
                        📰 Real Estate Insights
                    </span>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3rem)',
                        fontWeight: 800, color: '#fff',
                        margin: '0 0 16px',
                        fontFamily: 'Georgia, serif', lineHeight: 1.2,
                    }}>
                        Latest{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #d4af37, #f5d060)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Property Insights
                        </span>
                    </h1>
                    <p style={{
                        fontSize: '17px', color: 'rgba(255,255,255,0.65)',
                        lineHeight: 1.75, margin: '0 0 32px',
                    }}>
                        Expert guides, investment tips, and Agra real estate news — updated regularly
                    </p>

                    {/* Search bar */}
                    <div style={{
                        display: 'flex', background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '14px', padding: '6px',
                        backdropFilter: 'blur(10px)',
                        maxWidth: '480px', margin: '0 auto',
                    }}>
                        <input
                            type="text"
                            placeholder="Search articles…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                padding: '10px 16px', fontSize: '15px', color: '#fff',
                            }}
                        />
                        <button style={{
                            background: 'linear-gradient(135deg, #d4af37, #c9a227)',
                            color: '#0a0f2e', padding: '10px 20px', borderRadius: '10px',
                            fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer',
                        }}>
                            🔍
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Main Content ─────────────────────────── */}
            <section style={{ background: '#f8f9ff', padding: '60px 0 100px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

                    {/* Category filter pills */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '48px', justifyContent: 'center' }}>
                        <button
                            onClick={() => setActiveCategory(null)}
                            style={{
                                padding: '9px 20px', borderRadius: '50px',
                                border: '1.5px solid ' + (activeCategory === null ? '#2563eb' : '#e8e8f0'),
                                background: activeCategory === null ? '#2563eb' : '#fff',
                                color: activeCategory === null ? '#fff' : '#374151',
                                fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                            }}
                        >
                            All Posts ({blogs.length})
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                style={{
                                    padding: '9px 20px', borderRadius: '50px',
                                    border: '1.5px solid ' + (activeCategory === cat.id ? '#2563eb' : '#e8e8f0'),
                                    background: activeCategory === cat.id ? '#2563eb' : '#fff',
                                    color: activeCategory === cat.id ? '#fff' : '#374151',
                                    fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {filtered.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '80px 24px',
                            background: '#fff', borderRadius: '20px',
                            border: '2px dashed #e8e8f0',
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📰</div>
                            <p style={{ color: '#6b7280', fontSize: '16px' }}>No articles found. Try a different search or category.</p>
                        </div>
                    ) : (
                        <>
                            {/* Featured Article */}
                            {featured && (
                                <Link href={`/blogs/${featured.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="blog-featured-card" style={{
                                        background: '#fff',
                                        border: '1.5px solid #eef0f8',
                                        borderRadius: '24px', overflow: 'hidden',
                                        boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
                                        marginBottom: '40px', minHeight: '360px',
                                    }}>
                                        <div style={{
                                            position: 'relative', overflow: 'hidden',
                                            background: '#f5f6fa',
                                        }}>
                                            <img
                                                src={featured.featured_image}
                                                alt={featured.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '320px' }}
                                            />
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: 'linear-gradient(to right, transparent 70%, rgba(0,0,0,0.1))',
                                            }} />
                                            <div style={{
                                                position: 'absolute', top: '20px', left: '20px',
                                                background: 'linear-gradient(135deg, #d4af37, #c9a227)',
                                                color: '#0a0f2e', padding: '5px 14px',
                                                borderRadius: '50px', fontSize: '11px', fontWeight: 800,
                                                textTransform: 'uppercase', letterSpacing: '0.5px',
                                            }}>
                                                ⭐ Featured
                                            </div>
                                        </div>
                                        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                background: '#eff6ff', color: '#2563eb',
                                                fontWeight: 700, fontSize: '11px', letterSpacing: '1px',
                                                textTransform: 'uppercase', padding: '4px 12px',
                                                borderRadius: '50px', marginBottom: '16px', width: 'fit-content',
                                            }}>
                                                {featured.category}
                                            </span>
                                            <h2 style={{
                                                fontSize: '24px', fontWeight: 800, color: '#0a0f2e',
                                                margin: '0 0 14px', fontFamily: 'Georgia, serif', lineHeight: 1.3,
                                            }}>
                                                {featured.title}
                                            </h2>
                                            <p style={{
                                                fontSize: '15px', color: '#4b5563', lineHeight: 1.7,
                                                margin: '0 0 24px',
                                            }}>
                                                {featured.excerpt}
                                            </p>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '13px', color: '#9ca3af' }} suppressHydrationWarning>
                                                    📅 {formatDate(featured.created_at)}
                                                </span>
                                                <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                                                    ⏱️ {featured.readTime}
                                                </span>
                                            </div>
                                            <div style={{
                                                marginTop: '24px', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                color: '#2563eb', fontWeight: 700, fontSize: '14px',
                                            }}>
                                                Read full article →
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {/* Grid of remaining articles */}
                            {rest.length > 0 && (
                                <div className="rg-3" style={{ gap: '28px' }}>
                                    {rest.map(blog => (
                                        <Link
                                            key={blog.id}
                                            href={`/blogs/${blog.slug}`}
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            <article style={{
                                                background: '#fff',
                                                border: '1.5px solid #eef0f8',
                                                borderRadius: '20px', overflow: 'hidden',
                                                boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                                                height: '100%', display: 'flex', flexDirection: 'column',
                                            }}>
                                                {/* Thumbnail */}
                                                <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                                                    <img
                                                        src={blog.featured_image}
                                                        alt={blog.title}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                    <div style={{
                                                        position: 'absolute', inset: 0,
                                                        background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3) 100%)',
                                                    }} />
                                                    <span style={{
                                                        position: 'absolute', top: '14px', left: '14px',
                                                        background: 'rgba(255,255,255,0.92)',
                                                        backdropFilter: 'blur(8px)',
                                                        color: '#2563eb', fontWeight: 700,
                                                        fontSize: '11px', letterSpacing: '0.5px',
                                                        textTransform: 'uppercase',
                                                        padding: '4px 12px', borderRadius: '50px',
                                                    }}>
                                                        {blog.category}
                                                    </span>
                                                </div>

                                                {/* Content */}
                                                <div style={{ padding: '20px 22px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                                        <span style={{ fontSize: '12px', color: '#9ca3af' }} suppressHydrationWarning>📅 {formatDate(blog.created_at)}</span>
                                                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>⏱️ {blog.readTime}</span>
                                                    </div>
                                                    <h3 style={{
                                                        fontSize: '16px', fontWeight: 700, color: '#0a0f2e',
                                                        margin: '0 0 10px', lineHeight: 1.4, fontFamily: 'Georgia, serif',
                                                    }}>
                                                        {blog.title}
                                                    </h3>
                                                    <p style={{
                                                        fontSize: '13px', color: '#4b5563', lineHeight: 1.65,
                                                        margin: '0 0 20px', flex: 1,
                                                    }}>
                                                        {blog.excerpt.length > 110 ? blog.excerpt.slice(0, 110) + '…' : blog.excerpt}
                                                    </p>
                                                    <span style={{
                                                        color: '#2563eb', fontWeight: 700, fontSize: '13px',
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                    }}>
                                                        Read More →
                                                    </span>
                                                </div>
                                            </article>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
