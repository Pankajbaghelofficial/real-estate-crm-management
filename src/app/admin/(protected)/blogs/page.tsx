import { requirePageRole } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { deleteBlog } from './actions';


export default async function ManageBlogs() {
    await requirePageRole('admin');
    const blogs = await prisma.blogPost.findMany({
        orderBy: { created_at: 'desc' },
        include: { category: true },
    });

    const published = blogs.filter((b) => b.status === 'Published').length;
    const drafts = blogs.length - published;

    const R: React.CSSProperties = { background: 'var(--bg-admin)', minHeight: '100vh', padding: '28px 32px', fontFamily: "var(--font-sans)" };
    const CARD: React.CSSProperties = { background: 'var(--bg-admin-card)', borderRadius: '12px', border: '1px solid var(--border-admin)', padding: '20px 24px' };
    const BADGE = (color: string, bg: string): React.CSSProperties => ({
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
        fontWeight: 600, color, background: bg, whiteSpace: 'nowrap',
    });

    return (
        <div style={R}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-admin)', margin: 0 }}>📝 Manage Blogs</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-admin-dim)', margin: '4px 0 0' }}>Create, edit and publish articles</p>
                </div>
                <Link href="/admin/blogs/add" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '9px 18px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: 600, background: 'var(--accent-premium-gold)', color: '#0a0f2e', textDecoration: 'none',
                }}>+ Write New Post</Link>
            </div>

            {/* ── Stat Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                {[
                    { icon: '📰', label: 'Total Posts', value: blogs.length, color: 'var(--accent-premium-gold)', bg: 'rgba(63, 192, 231, 0.1)' },
                    { icon: '✅', label: 'Published', value: published, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                    { icon: '📝', label: 'Drafts', value: drafts, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
                ].map(s => (
                    <div key={s.label} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                            {s.icon}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-admin)' }}>{s.value}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-admin-dim)' }}>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Table Card ── */}
            <div style={CARD}>
                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-admin)' }}>
                        All Blog Posts <span style={{ color: 'var(--text-admin-dim)', fontWeight: 400 }}>({blogs.length})</span>
                    </p>
                    <Link href="/admin/blogs/add" style={{
                        padding: '6px 14px', borderRadius: '7px', fontSize: '12px',
                        fontWeight: 600, background: 'var(--bg-admin-input)', color: 'var(--accent-premium-gold)',
                        textDecoration: 'none', border: '1px solid var(--border-admin)',
                    }}>+ New Post</Link>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-admin)', background: 'rgba(255,255,255,0.02)' }}>
                                {['Title', 'Category', 'Status', 'Date', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-admin-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {blogs.length > 0 ? blogs.map((blog) => (
                                <tr key={blog.id} style={{ borderBottom: '1px solid var(--border-admin)' }}>
                                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-admin)', maxWidth: '280px' }}>
                                        <p style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{blog.title}</p>
                                    </td>
                                    <td style={{ padding: '12px 14px', color: 'var(--text-admin-dim)' }}>
                                        <span style={BADGE('var(--text-admin)', 'var(--bg-admin-input)')}>🗂 {blog.category?.category_name || 'Uncategorized'}</span>
                                    </td>
                                    <td style={{ padding: '12px 14px' }}>
                                        {blog.status === 'Published'
                                            ? <span style={BADGE('#16a34a', '#f0fdf4')}>● Published</span>
                                            : <span style={BADGE('#d97706', '#fffbeb')}>● Draft</span>}
                                    </td>
                                    <td style={{ padding: '12px 14px', color: 'var(--text-admin-dim)', whiteSpace: 'nowrap' }} suppressHydrationWarning>
                                        {new Date(blog.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                                            <Link href={`/admin/blogs/edit/${blog.id}`} style={{
                                                padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                                                fontWeight: 600, background: 'rgba(63, 192, 231, 0.1)', color: 'var(--accent-premium-gold)',
                                                textDecoration: 'none', border: '1px solid var(--accent-premium-gold)',
                                            }}>✏️ Edit</Link>
                                            <form action={deleteBlog.bind(null, blog.id)} style={{ display: 'inline' }}>
                                                <button type="submit" style={{
                                                    padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                                                    fontWeight: 600, background: '#fff1f2', color: '#dc2626',
                                                    border: '1px solid #fecaca', cursor: 'pointer',
                                                }}>🗑 Delete</button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#8b8ca7' }}>
                                        <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📰</p>
                                        <p style={{ margin: 0, fontWeight: 600 }}>No blog posts yet</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Click "Write New Post" to get started</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {blogs.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-admin)' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-admin-dim)' }}>Showing {blogs.length} post{blogs.length !== 1 ? 's' : ''}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-admin-dim)' }} suppressHydrationWarning>Last updated: {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
