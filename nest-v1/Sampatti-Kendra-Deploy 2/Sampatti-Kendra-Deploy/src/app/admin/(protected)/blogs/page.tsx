import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { deleteBlog } from './actions';

const prisma = new PrismaClient();

export default async function ManageBlogs() {
    const blogs = await prisma.blogPost.findMany({
        orderBy: { created_at: 'desc' },
        include: { category: true },
    });

    const published = blogs.filter((b) => b.status === 'Published').length;
    const drafts = blogs.length - published;

    const R: React.CSSProperties = { background: '#f5f6fa', minHeight: '100vh', padding: '28px 32px', fontFamily: "'Inter', sans-serif" };
    const CARD: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #eef0f7', padding: '20px 24px' };
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
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>📝 Manage Blogs</h1>
                    <p style={{ fontSize: '13px', color: '#8b8ca7', margin: '4px 0 0' }}>Create, edit and publish articles</p>
                </div>
                <Link href="/admin/blogs/add" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '9px 18px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: 600, background: '#2563eb', color: '#fff', textDecoration: 'none',
                }}>+ Write New Post</Link>
            </div>

            {/* ── Stat Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                {[
                    { icon: '📰', label: 'Total Posts', value: blogs.length, color: '#2563eb', bg: '#eff6ff' },
                    { icon: '✅', label: 'Published', value: published, color: '#16a34a', bg: '#f0fdf4' },
                    { icon: '📝', label: 'Drafts', value: drafts, color: '#d97706', bg: '#fffbeb' },
                ].map(s => (
                    <div key={s.label} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                            {s.icon}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#8b8ca7' }}>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Table Card ── */}
            <div style={CARD}>
                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>
                        All Blog Posts <span style={{ color: '#8b8ca7', fontWeight: 400 }}>({blogs.length})</span>
                    </p>
                    <Link href="/admin/blogs/add" style={{
                        padding: '6px 14px', borderRadius: '7px', fontSize: '12px',
                        fontWeight: 600, background: '#f5f6fa', color: '#2563eb',
                        textDecoration: 'none', border: '1px solid #e0e7ff',
                    }}>+ New Post</Link>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #f0f0f8' }}>
                                {['Title', 'Category', 'Status', 'Date', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: '11px', fontWeight: 700, color: '#8b8ca7', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {blogs.length > 0 ? blogs.map((blog) => (
                                <tr key={blog.id} style={{ borderBottom: '1px solid #f9f9fc' }}>
                                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1a1a2e', maxWidth: '280px' }}>
                                        <p style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{blog.title}</p>
                                    </td>
                                    <td style={{ padding: '12px 14px', color: '#555570' }}>
                                        <span style={BADGE('#374151', '#f3f4f6')}>🗂 {blog.category?.category_name || 'Uncategorized'}</span>
                                    </td>
                                    <td style={{ padding: '12px 14px' }}>
                                        {blog.status === 'Published'
                                            ? <span style={BADGE('#16a34a', '#f0fdf4')}>● Published</span>
                                            : <span style={BADGE('#d97706', '#fffbeb')}>● Draft</span>}
                                    </td>
                                    <td style={{ padding: '12px 14px', color: '#8b8ca7', whiteSpace: 'nowrap' }} suppressHydrationWarning>
                                        {new Date(blog.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                                            <Link href={`/admin/blogs/edit/${blog.id}`} style={{
                                                padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                                                fontWeight: 600, background: '#eff6ff', color: '#2563eb',
                                                textDecoration: 'none', border: '1px solid #e0e7ff',
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f8' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#8b8ca7' }}>Showing {blogs.length} post{blogs.length !== 1 ? 's' : ''}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#8b8ca7' }} suppressHydrationWarning>Last updated: {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
