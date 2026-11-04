'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type GalleryFile = {
    filename: string;
    url: string;
    size: number;
    uploadedAt: string;
};

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function GalleryClient() {
    const [files, setFiles] = useState<GalleryFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string[]>([]);
    const [selected, setSelected] = useState<GalleryFile | null>(null);
    const [copied, setCopied] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<string | null>(null); // custom confirm modal
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/upload');
            const data = await res.json();
            setFiles(data.files || []);
        } catch { setFiles([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    async function uploadFiles(fileList: FileList) {
        setUploading(true);
        const msgs: string[] = [];
        for (const file of Array.from(fileList)) {
            msgs.push(`⏳ Uploading ${file.name}...`);
            setUploadProgress([...msgs]);
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            msgs[msgs.length - 1] = res.ok ? `✅ ${file.name}` : `❌ ${file.name}: ${data.error}`;
            setUploadProgress([...msgs]);
        }
        await loadFiles();
        setTimeout(() => setUploadProgress([]), 3000);
        setUploading(false);
    }

    function showConfirm(filename: string) {
        setConfirmTarget(filename);
    }

    async function execDelete() {
        if (!confirmTarget) return;
        const filename = confirmTarget;
        setConfirmTarget(null);
        setDeleting(filename);
        const res = await fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename }) });
        if (res.ok) {
            if (selected?.filename === filename) setSelected(null);
        } else {
            const data = await res.json().catch(() => ({}));
            setUploadProgress([`❌ ${data.error || 'Delete failed'}`]);
            setTimeout(() => setUploadProgress([]), 5000);
        }
        await loadFiles();
        setDeleting(null);
    }

    function copyUrl(url: string) {
        // Blob storage returns absolute URLs; local uploads are site-relative.
        navigator.clipboard.writeText(/^https?:\/\//.test(url) ? url : window.location.origin + url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const filtered = files.filter(f => f.filename.toLowerCase().includes(search.toLowerCase()));

    // Drag events
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
    const onDragLeave = () => setDragging(false);
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
    };

    const CARD: React.CSSProperties = { background: 'var(--bg-admin-card)', borderRadius: '14px', border: '1px solid var(--border-admin)' };

    return (
        <div style={{ background: 'var(--bg-admin)', minHeight: '100vh', padding: '28px 32px', fontFamily: "var(--font-sans)" }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-admin)', margin: 0 }}>🖼️ Media Gallery</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-admin-dim)', margin: '4px 0 0' }}>{files.length} image{files.length !== 1 ? 's' : ''} uploaded</p>
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '9px 20px', borderRadius: '8px', fontSize: '13px',
                        fontWeight: 700, background: uploading ? 'rgba(63, 192, 231, 0.5)' : 'var(--accent-premium-gold)',
                        color: '#0a0f2e', border: 'none', cursor: uploading ? 'wait' : 'pointer',
                    }}
                >
                    {uploading ? '⏳ Uploading...' : '⬆️ Upload Images'}
                </button>
                <input
                    ref={fileInputRef} type="file" multiple accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files && uploadFiles(e.target.files)}
                />
            </div>

            {/* ── Stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                {[
                    { icon: '🖼️', label: 'Total Images', value: files.length, color: 'var(--accent-premium-gold)', bg: 'rgba(63, 192, 231, 0.1)' },
                    { icon: '💾', label: 'Total Size', value: formatBytes(files.reduce((a, f) => a + f.size, 0)), color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
                    { icon: '📅', label: 'Last Uploaded', value: files[0] ? formatDate(files[0].uploadedAt).split(',')[0] : '—', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                ].map(s => (
                    <div key={s.label} className="glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-admin)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{s.icon}</div>
                        <div>
                            <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-admin)' }} suppressHydrationWarning>{s.value}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-admin-dim)' }}>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Upload Progress ── */}
            {uploadProgress.length > 0 && (
                <div style={{ ...CARD, padding: '12px 16px', marginBottom: '16px', borderColor: '#bfdbfe' }}>
                    {uploadProgress.map((m, i) => <p key={i} style={{ margin: '2px 0', fontSize: '13px', color: m.startsWith('✅') ? '#16a34a' : m.startsWith('❌') ? '#dc2626' : '#2563eb' }}>{m}</p>)}
                </div>
            )}

            {/* ── Drag & Drop Zone ── */}
            <div
                ref={dropRef}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{
                    border: `2px dashed ${dragging ? 'var(--accent-premium-gold)' : 'var(--border-admin)'}`,
                    borderRadius: '12px', background: dragging ? 'rgba(63, 192, 231, 0.05)' : 'var(--bg-admin-input)',
                    padding: '28px', textAlign: 'center', cursor: 'pointer',
                    marginBottom: '20px', transition: 'all 0.2s ease',
                }}
            >
                <p style={{ fontSize: '28px', margin: '0 0 6px' }}>📤</p>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--accent-premium-gold)', fontSize: '14px' }}>
                    {dragging ? 'Drop images here!' : 'Drag & drop images here, or click to browse'}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-admin-dim)' }}>JPEG, PNG, WebP, GIF • Max 4MB each • Multiple files allowed</p>
            </div>

            {/* ── Search ── */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-admin-input)', border: '1px solid var(--border-admin)', borderRadius: '8px', padding: '8px 12px', flex: 1 }}>
                    <span style={{ color: 'var(--text-admin-dim)' }}>🔍</span>
                    <input
                        type="text" placeholder="Search images by filename..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text-admin)', width: '100%', background: 'transparent' }}
                    />
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-admin-dim)', whiteSpace: 'nowrap' }}>{filtered.length} of {files.length}</p>
            </div>

            {/* ── Main Content: Grid + Preview ── */}
            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 300px' : '1fr', gap: '20px', alignItems: 'start' }}>

                {/* Grid */}
                <div style={{ ...CARD, padding: '16px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#8b8ca7' }}>
                            <p style={{ fontSize: '28px', margin: '0 0 8px' }}>⏳</p>
                            <p style={{ margin: 0 }}>Loading gallery...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#8b8ca7' }}>
                            <p style={{ fontSize: '36px', margin: '0 0 8px' }}>🖼️</p>
                            <p style={{ margin: 0, fontWeight: 600 }}>{search ? 'No images match your search' : 'No images uploaded yet'}</p>
                            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Use the upload button or drag & drop above</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                            {filtered.map(file => (
                                <div
                                    key={file.filename}
                                    onClick={() => setSelected(selected?.filename === file.filename ? null : file)}
                                    style={{
                                        borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
                                        border: selected?.filename === file.filename ? '2px solid var(--accent-premium-gold)' : '1px solid var(--border-admin)',
                                        background: 'var(--bg-admin-input)', position: 'relative', transition: 'all 0.2s',
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={file.url} alt={file.filename}
                                        style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
                                    />
                                    <div style={{ padding: '6px 8px' }}>
                                        <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-admin)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                                            {file.filename.replace(/^upload_\d+_\w+\./, '...')}
                                        </p>
                                        <p style={{ margin: '1px 0 0', fontSize: '10px', color: 'var(--text-admin-dim)' }}>{formatBytes(file.size)}</p>
                                    </div>
                                    {/* Hover delete button */}
                                    <button
                                        onClick={e => { e.stopPropagation(); showConfirm(file.filename); }}
                                        disabled={deleting === file.filename}
                                        title="Delete"
                                        style={{
                                            position: 'absolute', top: '5px', right: '5px',
                                            width: '22px', height: '22px', borderRadius: '50%',
                                            background: '#dc2626', color: '#fff', border: 'none',
                                            fontSize: '11px', cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                                        }}
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Preview Panel */}
                {selected && (
                    <div style={{ ...CARD, padding: '0', overflow: 'hidden', position: 'sticky', top: '0' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selected.url} alt={selected.filename} style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
                        <div style={{ padding: '16px' }}>
                            <p style={{ margin: '0 0 12px', fontWeight: 700, color: 'var(--text-admin)', fontSize: '13px', wordBreak: 'break-all' }}>{selected.filename}</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--text-admin-dim)', flexShrink: 0 }}>📦 Size</span>
                                    <span style={{ color: 'var(--text-admin)', textAlign: 'right', wordBreak: 'break-all' }}>{formatBytes(selected.size)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--text-admin-dim)', flexShrink: 0 }}>📅 Uploaded</span>
                                    <span style={{ color: 'var(--text-admin)', textAlign: 'right', wordBreak: 'break-all' }} suppressHydrationWarning>{formatDate(selected.uploadedAt)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--text-admin-dim)', flexShrink: 0 }}>🔗 URL</span>
                                    <span style={{ color: 'var(--text-admin)', textAlign: 'right', wordBreak: 'break-all' }}>{selected.url}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    onClick={() => copyUrl(selected.url)}
                                    style={{
                                        width: '100%', padding: '9px', borderRadius: '8px', fontSize: '13px',
                                        fontWeight: 600, background: copied ? '#16a34a' : 'var(--accent-premium-gold)',
                                        color: copied ? '#fff' : '#0a0f2e', border: 'none', cursor: 'pointer',
                                    }}
                                >
                                    {copied ? '✅ URL Copied!' : '📋 Copy Image URL'}
                                </button>
                                <a href={selected.url} download target="_blank" rel="noreferrer"
                                    style={{ display: 'block', textAlign: 'center', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', textDecoration: 'none', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                    ⬇️ Download
                                </a>
                                <button
                                    onClick={() => showConfirm(selected.filename)}
                                    disabled={deleting === selected.filename}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer' }}
                                >
                                    {deleting === selected.filename ? '🗑 Deleting...' : '🗑 Delete Image'}
                                </button>
                                <button onClick={() => setSelected(null)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', fontSize: '12px', color: '#8b8ca7', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                    Close Preview
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* ── Delete Confirm Modal ── */}
            {confirmTarget && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                }} onClick={() => setConfirmTarget(null)}>
                    <div
                        onClick={e => e.stopPropagation()}
                        className="glass-panel"
                        style={{
                            borderRadius: '16px', padding: '28px 32px',
                            width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            textAlign: 'center', border: '1px solid var(--border-admin)',
                        }}
                    >
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: 'var(--text-admin)' }}>Delete Image?</h3>
                        <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--text-admin-dim)', wordBreak: 'break-all' }}>{confirmTarget}</p>
                        <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'var(--text-admin-dim)' }}>Yeh action undo nahi hogi.</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setConfirmTarget(null)}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px',
                                    fontWeight: 600, background: 'var(--bg-admin-input)', color: 'var(--text-admin)',
                                    border: '1px solid var(--border-admin)', cursor: 'pointer',
                                }}
                            >Cancel</button>
                            <button
                                onClick={execDelete}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px',
                                    fontWeight: 700, background: '#dc2626', color: '#fff',
                                    border: 'none', cursor: 'pointer',
                                }}
                            >🗑 Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
