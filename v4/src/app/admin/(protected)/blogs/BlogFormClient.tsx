'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import GalleryPicker from '@/components/admin/GalleryPicker';

/* ─── Shared style tokens ─────────────────────────── */
const CARD: React.CSSProperties = {
    background: '#fff', borderRadius: '14px',
    border: '1px solid #eef0f7', padding: '24px 28px', marginBottom: '20px',
};
const CARD_TITLE: React.CSSProperties = {
    fontSize: '14px', fontWeight: 700, color: '#1a1a2e',
    marginBottom: '18px', paddingBottom: '10px', borderBottom: '1px solid #f0f0f8',
};
const LABEL: React.CSSProperties = {
    display: 'block', marginBottom: '6px', fontSize: '12px',
    fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.4px',
};
const INPUT: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #e0e0f0', fontSize: '14px', color: '#1a1a2e',
    background: '#fdfdff', outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
};

const COLOURS = [
    '#000000', '#374151', '#dc2626', '#ea580c', '#d97706',
    '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777',
    '#ffffff', '#f3f4f6', '#fecaca', '#fed7aa', '#fef08a',
    '#bbf7d0', '#a5f3fc', '#bfdbfe', '#ddd6fe', '#fbcfe8',
];

/* ─── Toolbar Button ─────────────────────────────── */
function TB({ title, html, onAction, active }: { title: string; html: string; onAction: () => void; active?: boolean }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => { e.preventDefault(); onAction(); }}
            style={{
                padding: '4px 9px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                border: active ? '1px solid #2563eb' : '1px solid #e0e0f0',
                cursor: 'pointer',
                background: active ? '#eff6ff' : '#fff',
                color: active ? '#2563eb' : '#374151',
                minWidth: '32px',
            }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

/* ─── Props ──────────────────────────────────────── */
type BlogFormProps = {
    mode?: 'add' | 'edit';
    post?: {
        id?: number;
        title?: string;
        slug?: string;
        category_name?: string;
        status?: string;
        content?: string;
        featured_image?: string | null;
        excerpt?: string | null;
    };
    action: (formData: FormData) => Promise<void>;
};

export default function BlogFormClient({ mode = 'add', post, action }: BlogFormProps) {
    const [loading, setLoading] = useState(false);
    const [showColors, setShowColors] = useState(false);
    const [showImgPanel, setShowImgPanel] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadedImgUrl, setUploadedImgUrl] = useState<string | null>(null);
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
    const [slug, setSlug] = useState(post?.slug || '');
    const [featuredImage, setFeaturedImage] = useState<string>(post?.featured_image || '');

    // Universal Gallery Picker states
    const [showGalleryFor, setShowGalleryFor] = useState<'featured' | 'content' | null>(null);

    const editorRef = useRef<HTMLDivElement>(null);
    const hiddenRef = useRef<HTMLInputElement>(null);
    const savedSelRef = useRef<Range | null>(null);
    const currentBlockRef = useRef<Node | null>(null);

    /* Seed editor content */
    useEffect(() => {
        if (editorRef.current) {
            if (post?.content) editorRef.current.innerHTML = post.content;
            document.execCommand('defaultParagraphSeparator', false, 'p');
        }
    }, []);

    /* Auto-generate slug from title */
    const autoSlug = (title: string) =>
        title.toLowerCase().trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

    /* Track cursor block */
    const trackBlock = useCallback(() => {
        const editor = editorRef.current;
        const sel = window.getSelection();
        if (!editor || !sel || sel.rangeCount === 0) return;
        savedSelRef.current = sel.getRangeAt(0).cloneRange();
        let node: Node | null = sel.getRangeAt(0).startContainer;
        while (node && node.parentNode !== editor) node = node.parentNode;
        if (node && node !== editor) currentBlockRef.current = node;
    }, []);

    const saveSelection = useCallback(() => { trackBlock(); }, [trackBlock]);

    const restoreSelection = useCallback(() => {
        const sel = window.getSelection();
        if (sel && savedSelRef.current) {
            try { sel.removeAllRanges(); sel.addRange(savedSelRef.current); } catch { /* ignore */ }
        }
    }, []);

    const syncContent = useCallback(() => {
        if (hiddenRef.current && editorRef.current) {
            hiddenRef.current.value = editorRef.current.innerHTML;
        }
    }, []);

    const updateActive = useCallback(() => {
        const cmds = ['bold', 'italic', 'underline', 'strikeThrough',
            'insertUnorderedList', 'insertOrderedList',
            'justifyLeft', 'justifyCenter', 'justifyRight'];
        const active = new Set<string>();
        cmds.forEach(c => { if (document.queryCommandState(c)) active.add(c); });
        setActiveFormats(active);
    }, []);

    const exec = useCallback((cmd: string, value?: string) => {
        editorRef.current?.focus();
        restoreSelection();
        document.execCommand(cmd, false, value);
        syncContent();
        updateActive();
    }, [restoreSelection, syncContent, updateActive]);

    /* Block format via DOM manipulation */
    const applyBlock = useCallback((tag: string) => {
        const editor = editorRef.current;
        if (!editor) return;
        let target = currentBlockRef.current;
        if (!target || !editor.contains(target)) {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                let node: Node | null = sel.getRangeAt(0).startContainer;
                while (node && node.parentNode !== editor) node = node.parentNode;
                if (node && node !== editor) target = node;
            }
        }
        if (!target || !editor.contains(target)) {
            const el = document.createElement(tag);
            el.innerHTML = '<br>';
            editor.appendChild(el);
            editor.focus();
            currentBlockRef.current = el;
            syncContent(); return;
        }
        const newEl = document.createElement(tag);
        if (target.nodeType === Node.TEXT_NODE) {
            newEl.textContent = target.textContent ?? '';
            if (!newEl.textContent.trim()) newEl.innerHTML = '<br>';
        } else {
            newEl.innerHTML = (target as HTMLElement).innerHTML || '<br>';
        }
        editor.replaceChild(newEl, target);
        currentBlockRef.current = newEl;
        editor.focus();
        const r = document.createRange();
        r.selectNodeContents(newEl); r.collapse(false);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(r);
        savedSelRef.current = r.cloneRange();
        syncContent();
    }, [syncContent]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        if (hiddenRef.current && editorRef.current)
            hiddenRef.current.value = editorRef.current.innerHTML;
        const formData = new FormData(e.currentTarget);
        await action(formData);
    }

    const pageTitle = mode === 'edit' ? '✏️ Edit Blog Post' : '📝 Write New Post';

    return (
        <div style={{ background: '#f5f6fa', minHeight: '100vh', padding: '28px 32px', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Page Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{pageTitle}</h1>
                    <p style={{ fontSize: '13px', color: '#8b8ca7', margin: '4px 0 0' }}>
                        {mode === 'edit' ? 'Update your blog post content' : 'Draft a new article for your website'}
                    </p>
                </div>
                <Link href="/admin/blogs" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: 600, background: '#fff', color: '#374151',
                    textDecoration: 'none', border: '1px solid #e0e0f0',
                }}>← Back to Blogs</Link>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

                    {/* ── LEFT COLUMN ── */}
                    <div>
                        {/* Basic Info */}
                        <div style={CARD}>
                            <h3 style={CARD_TITLE}>📋 Post Details</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={LABEL}>Title *</label>
                                    <input
                                        type="text" name="title" required
                                        defaultValue={post?.title || ''}
                                        placeholder="e.g. Real Estate Trends 2025"
                                        style={INPUT}
                                        onChange={e => mode === 'add' && setSlug(autoSlug(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label style={LABEL}>URL Slug *</label>
                                    <input
                                        type="text" name="slug" required
                                        value={slug}
                                        onChange={e => setSlug(e.target.value)}
                                        placeholder="e.g. real-estate-trends-2025"
                                        style={INPUT}
                                    />
                                </div>
                                <div>
                                    <label style={LABEL}>Category</label>
                                    <input
                                        type="text" name="category_name"
                                        defaultValue={post?.category_name || ''}
                                        placeholder="e.g. Investment, Tips"
                                        style={INPUT}
                                    />
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={LABEL}>Excerpt / Summary</label>
                                    <textarea
                                        name="excerpt" rows={2}
                                        defaultValue={post?.excerpt || ''}
                                        placeholder="Brief summary shown in blog listings..."
                                        style={{ ...INPUT, resize: 'vertical' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Rich Text Editor ── */}
                        <div style={CARD}>
                            <h3 style={CARD_TITLE}>📝 Content Editor</h3>

                            {/* Toolbar */}
                            <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center',
                                padding: '8px 10px', background: '#f8f9ff',
                                border: '1px solid #e0e0f0', borderBottom: 'none', borderRadius: '8px 8px 0 0',
                            }}>
                                {/* Format Block */}
                                <select
                                    onMouseDown={saveSelection}
                                    onChange={e => { applyBlock(e.target.value); e.target.value = 'p'; }}
                                    style={{ ...INPUT, width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                                >
                                    <option value="p">Paragraph</option>
                                    <option value="h2">Heading 2</option>
                                    <option value="h3">Heading 3</option>
                                    <option value="h4">Heading 4</option>
                                    <option value="h5">Heading 5</option>
                                    <option value="blockquote">📌 Blockquote</option>
                                    <option value="pre">💻 Code Block</option>
                                </select>

                                <div style={{ width: '1px', height: '22px', background: '#e0e0f0', margin: '0 4px' }} />

                                {/* Inline formats */}
                                <TB title="Bold" html="<b>B</b>" onAction={() => exec('bold')} active={activeFormats.has('bold')} />
                                <TB title="Italic" html="<i>I</i>" onAction={() => exec('italic')} active={activeFormats.has('italic')} />
                                <TB title="Underline" html="<u>U</u>" onAction={() => exec('underline')} active={activeFormats.has('underline')} />
                                <TB title="Strikethrough" html="<s>S</s>" onAction={() => exec('strikeThrough')} active={activeFormats.has('strikeThrough')} />

                                <div style={{ width: '1px', height: '22px', background: '#e0e0f0', margin: '0 4px' }} />

                                {/* Lists */}
                                <TB title="Bullet List" html="• List" onAction={() => exec('insertUnorderedList')} active={activeFormats.has('insertUnorderedList')} />
                                <TB title="Numbered List" html="1. List" onAction={() => exec('insertOrderedList')} active={activeFormats.has('insertOrderedList')} />

                                <div style={{ width: '1px', height: '22px', background: '#e0e0f0', margin: '0 4px' }} />

                                {/* Alignment */}
                                <TB title="Align Left" html="◀" onAction={() => exec('justifyLeft')} active={activeFormats.has('justifyLeft')} />
                                <TB title="Align Center" html="▬" onAction={() => exec('justifyCenter')} active={activeFormats.has('justifyCenter')} />
                                <TB title="Align Right" html="▶" onAction={() => exec('justifyRight')} active={activeFormats.has('justifyRight')} />

                                <div style={{ width: '1px', height: '22px', background: '#e0e0f0', margin: '0 4px' }} />

                                {/* Indent */}
                                <TB title="Indent" html="→|" onAction={() => exec('indent')} />
                                <TB title="Outdent" html="|←" onAction={() => exec('outdent')} />

                                <div style={{ width: '1px', height: '22px', background: '#e0e0f0', margin: '0 4px' }} />

                                {/* Text Color */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        type="button"
                                        title="Text Color"
                                        onMouseDown={e => { e.preventDefault(); saveSelection(); setShowColors(v => !v); }}
                                        style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: '1px solid #e0e0f0', cursor: 'pointer', background: '#fff', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <span style={{ fontSize: '15px' }}>A</span>
                                        <span style={{ width: '12px', height: '4px', borderRadius: '2px', background: 'linear-gradient(90deg,#f00,#0f0,#00f)', display: 'inline-block' }} />
                                        <span style={{ fontSize: '10px' }}>▼</span>
                                    </button>
                                    {showColors && (
                                        <div
                                            style={{ position: 'absolute', top: '110%', left: 0, zIndex: 100, background: '#fff', border: '1px solid #e0e0f0', borderRadius: '10px', padding: '10px', boxShadow: '0 6px 24px rgba(0,0,0,0.12)', display: 'grid', gridTemplateColumns: 'repeat(6, 24px)', gap: '5px' }}
                                            onMouseDown={e => e.preventDefault()}
                                        >
                                            {COLOURS.map(c => (
                                                <button key={c} type="button"
                                                    onMouseDown={e => { e.preventDefault(); exec('foreColor', c); setShowColors(false); }}
                                                    style={{ width: '24px', height: '24px', borderRadius: '4px', border: c === '#FFFFFF' ? '1px solid #e0e0f0' : '1px solid transparent', background: c, cursor: 'pointer' }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Highlight */}
                                <button
                                    type="button" title="Highlight"
                                    onMouseDown={e => { e.preventDefault(); restoreSelection(); document.execCommand('hiliteColor', false, '#FEF08A'); syncContent(); }}
                                    style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: '1px solid #e0e0f0', cursor: 'pointer', background: '#FEF08A', color: '#374151' }}
                                >🖍</button>

                                {/* Image upload toggle */}
                                <button
                                    type="button" title="Insert Image from Gallery"
                                    onMouseDown={e => { e.preventDefault(); setShowGalleryFor('content'); }}
                                    style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: '1px solid #e0e0f0', cursor: 'pointer', background: '#fff', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >🖼 Image</button>

                                <div style={{ width: '1px', height: '22px', background: '#e0e0f0', margin: '0 4px' }} />
                                <TB title="Clear Formatting" html="Tx" onAction={() => exec('removeFormat')} />
                                <div style={{ width: '1px', height: '22px', background: '#e0e0f0', margin: '0 4px' }} />
                                <TB title="Undo" html="↩" onAction={() => exec('undo')} />
                                <TB title="Redo" html="↪" onAction={() => exec('redo')} />
                            </div>

                            {/* Editor Area */}
                            <div
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={syncContent}
                                onKeyUp={() => { trackBlock(); updateActive(); }}
                                onMouseUp={() => { trackBlock(); updateActive(); }}
                                onSelect={trackBlock}
                                onClick={trackBlock}
                                style={{
                                    minHeight: '320px', padding: '16px 18px',
                                    border: '1px solid #e0e0f0',
                                    borderRadius: '0 0 8px 8px',
                                    fontSize: '14px', color: '#1a1a2e', lineHeight: 1.8,
                                    outline: 'none', background: '#fff', fontFamily: "'Inter', sans-serif",
                                }}
                            />

                            <input type="hidden" name="content" ref={hiddenRef} defaultValue={post?.content || ''} />
                            <p style={{ fontSize: '11px', color: '#b0b0c3', marginTop: '6px' }}>
                                Tip: Click in the editor first, then use toolbar buttons to apply formatting.
                            </p>
                        </div>
                    </div>

                    {/* ── RIGHT SIDEBAR ── */}
                    <div>
                        {/* Publish Card */}
                        <div style={CARD}>
                            <h3 style={CARD_TITLE}>🚀 Publish</h3>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={LABEL}>Status</label>
                                <select name="status" defaultValue={post?.status || 'Draft'} style={INPUT}>
                                    <option value="Draft">📝 Draft</option>
                                    <option value="Published">✅ Published</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%', padding: '11px', borderRadius: '8px',
                                    fontSize: '14px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                                    background: loading ? '#93c5fd' : '#2563eb',
                                    color: '#fff', border: 'none', transition: 'background 0.2s',
                                }}
                            >
                                {loading ? '⏳ Saving...' : mode === 'edit' ? '💾 Update Post' : '🚀 Publish Post'}
                            </button>
                            <Link href="/admin/blogs" style={{ display: 'block', textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#8b8ca7', textDecoration: 'none' }}>
                                Cancel & go back
                            </Link>

                            {/* ── Featured Image ── */}
                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f0f0f8' }}>
                                <label style={LABEL}>🖼️ Featured Image</label>
                                <input type="hidden" name="featured_image" value={featuredImage} />
                                {featuredImage ? (
                                    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid #bfdbfe' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={featuredImage} alt="featured" style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                                        <div
                                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s', opacity: 0 }}
                                        >
                                            <button type="button" onClick={() => setShowGalleryFor('featured')}
                                                style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#fff', color: '#1a1a2e', border: 'none', cursor: 'pointer' }}>🔄 Change</button>
                                            <button type="button" onClick={() => setFeaturedImage('')}
                                                style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}>✕ Remove</button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── Picker trigger ── */
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {/* Primary: pick from gallery */}
                                        <button type="button" onClick={() => setShowGalleryFor('featured')}
                                            style={{ width: '100%', padding: '16px 14px', borderRadius: '8px', border: '2px dashed #c7d2fe', background: '#f8f9ff', color: '#2563eb', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}
                                        >
                                            <span style={{ fontSize: '24px' }}>🖼️</span>
                                            Choose from Gallery
                                            <span style={{ fontSize: '11px', color: '#a0a0b5', fontWeight: 400 }}>Select from uploaded images</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Universal Gallery Picker ── */}
                        <GalleryPicker
                            isOpen={showGalleryFor !== null}
                            onClose={() => setShowGalleryFor(null)}
                            title={showGalleryFor === 'featured' ? "Choose Featured Image" : "Insert Image into Content"}
                            onSelect={(url) => {
                                if (showGalleryFor === 'featured') {
                                    setFeaturedImage(Array.isArray(url) ? url[0] : url);
                                } else if (showGalleryFor === 'content') {
                                    const editor = editorRef.current;
                                    const insertUrl = Array.isArray(url) ? url[0] : url;
                                    if (editor) {
                                        editor.focus();
                                        let inserted = false;
                                        const sel = window.getSelection();
                                        if (savedSelRef.current && sel) {
                                            try {
                                                sel.removeAllRanges(); sel.addRange(savedSelRef.current);
                                                document.execCommand('insertHTML', false, `<img src="${insertUrl}" alt="blog image" style="max-width:100%;border-radius:8px;margin:10px 0;display:block;" />`);
                                                inserted = true;
                                            } catch { /* ignore */ }
                                        }
                                        if (!inserted) {
                                            const img = document.createElement('img');
                                            img.src = insertUrl; img.alt = 'blog image';
                                            img.style.cssText = 'max-width:100%;border-radius:8px;margin:10px 0;display:block;';
                                            editor.appendChild(img);
                                        }
                                        syncContent();
                                    }
                                }
                                setShowGalleryFor(null);
                            }}
                        />

                        {/* Tips Card */}
                        <div style={{ ...CARD, background: '#f8fbff', border: '1px solid #e0e7ff', marginTop: '20px' }}>
                            <h3 style={{ ...CARD_TITLE, borderColor: '#e0e7ff' }}>💡 Editor Tips</h3>
                            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '12px', color: '#555570', lineHeight: 2 }}>
                                <li>Click in editor, then pick <b>Heading 2</b> to create a section title</li>
                                <li>Select text → click <b>B</b> for bold</li>
                                <li>Use <b>🖼 Image</b> to pick from gallery</li>
                                <li>📌 Blockquote for highlighted quotes</li>
                                <li>💻 Code Block for code snippets</li>
                            </ul>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
}
