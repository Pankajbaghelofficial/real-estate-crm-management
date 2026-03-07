'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import GalleryPicker from '@/components/admin/GalleryPicker';

/* ─── Shared CSS helpers ─────────────────────────────── */
const INPUT: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid #e0e0f0', fontSize: '13px', color: '#1a1a2e',
    outline: 'none', fontFamily: "'Inter', sans-serif",
    background: '#fff', boxSizing: 'border-box',
};
const LABEL: React.CSSProperties = {
    display: 'block', marginBottom: '6px', fontSize: '12px',
    fontWeight: 600, color: '#555570', textTransform: 'uppercase', letterSpacing: '0.5px',
};
const CARD: React.CSSProperties = {
    background: '#fff', borderRadius: '12px', border: '1px solid #eef0f7',
    padding: '24px', marginBottom: '20px',
};
const CARD_TITLE: React.CSSProperties = {
    fontSize: '14px', fontWeight: 700, color: '#1a1a2e',
    marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f8',
};

/* ─── Colour palette ─────────────────────────────────── */
const COLOURS = [
    '#000000', '#374151', '#6B7280', '#DC2626', '#EA580C',
    '#D97706', '#65A30D', '#16A34A', '#0284C7', '#2563EB',
    '#7C3AED', '#DB2777', '#FFFFFF', '#FEF3C7', '#DCFCE7',
    '#DBEAFE', '#EDE9FE', '#FCE7F3',
];

/* ─── Toolbar button component ───────────────────────── */
function TB({
    title, html, onAction, active,
}: {
    title: string; html: string; onAction: () => void; active?: boolean;
}) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => { e.preventDefault(); onAction(); }}   // prevent focus loss
            style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
                fontWeight: 600, border: '1px solid #e0e0f0', cursor: 'pointer',
                lineHeight: 1.5, background: active ? '#eff6ff' : '#fff',
                color: active ? '#2563eb' : '#374151',
            }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

/* ─── Main component ─────────────────────────────────── */
export default function PropertyFormClient({
    property, action, mode,
}: {
    property?: {
        title?: string; price?: string | number; location?: string;
        area_size?: string; property_type?: string; status?: string;
        description?: string; is_featured?: boolean; image_urls?: string[];
        amenities?: string; bedrooms?: number; bathrooms?: number;
    };
    action: (formData: FormData) => Promise<void>;
    mode: 'add' | 'edit';
}) {
    const [loading, setLoading] = useState(false);
    const [showColors, setShowColors] = useState(false);
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

    // Universal Gallery Picker states
    const [imageUrls, setImageUrls] = useState<string[]>(property?.image_urls || []);
    const [showGalleryFor, setShowGalleryFor] = useState<'main' | 'description' | null>(null);

    const editorRef = useRef<HTMLDivElement>(null);
    const hiddenRef = useRef<HTMLInputElement>(null);
    const savedSelRef = useRef<Range | null>(null);
    // Tracks the direct-child block element of the editor where the cursor lives
    const currentBlockRef = useRef<Node | null>(null);

    /* Seed content + set paragraph separator */
    useEffect(() => {
        if (editorRef.current) {
            if (property?.description) {
                editorRef.current.innerHTML = property.description;
            }
            document.execCommand('defaultParagraphSeparator', false, 'p');
        }
    }, []);

    /* Called on every click/keyup inside editor — finds and remembers the block */
    const trackBlock = useCallback(() => {
        const editor = editorRef.current;
        const sel = window.getSelection();
        if (!editor || !sel || sel.rangeCount === 0) return;

        // Save selection for inline commands (bold, italic, etc.)
        savedSelRef.current = sel.getRangeAt(0).cloneRange();

        // Walk up from cursor to find direct child of editor
        let node: Node | null = sel.getRangeAt(0).startContainer;
        while (node && node.parentNode !== editor) {
            node = node.parentNode;
        }
        if (node && node !== editor) {
            currentBlockRef.current = node;
        }
    }, []);

    /* Save selection (alias for inline format commands) */
    const saveSelection = useCallback(() => { trackBlock(); }, [trackBlock]);

    /* Restore saved selection for inline commands */
    const restoreSelection = useCallback(() => {
        const sel = window.getSelection();
        if (sel && savedSelRef.current) {
            try { sel.removeAllRanges(); sel.addRange(savedSelRef.current); } catch { /* ignore */ }
        }
    }, []);

    /* Sync hidden input */
    const syncContent = useCallback(() => {
        if (hiddenRef.current && editorRef.current) {
            hiddenRef.current.value = editorRef.current.innerHTML;
        }
    }, []);

    /* Update active-format state */
    const updateActive = useCallback(() => {
        const cmds = ['bold', 'italic', 'underline', 'strikeThrough',
            'insertUnorderedList', 'insertOrderedList',
            'justifyLeft', 'justifyCenter', 'justifyRight'];
        const active = new Set<string>();
        cmds.forEach(c => { if (document.queryCommandState(c)) active.add(c); });
        setActiveFormats(active);
    }, []);

    /* Exec inline commands (bold, italic, colour, etc.) */
    const exec = useCallback((cmd: string, value?: string) => {
        editorRef.current?.focus();
        restoreSelection();
        document.execCommand(cmd, false, value);
        syncContent();
        updateActive();
    }, [restoreSelection, syncContent, updateActive]);

    /* ── Apply block-level tag (h2, h3, blockquote, p, pre …)
       Uses currentBlockRef so it NEVER depends on selection restoration ── */
    const applyBlock = useCallback((tag: string) => {
        const editor = editorRef.current;
        if (!editor) return;

        let target = currentBlockRef.current;

        // If no tracked block, try to get it from the current selection
        if (!target || !editor.contains(target)) {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                let node: Node | null = sel.getRangeAt(0).startContainer;
                while (node && node.parentNode !== editor) node = node.parentNode;
                if (node && node !== editor) target = node;
            }
        }

        if (!target || !editor.contains(target)) {
            // Absolute fallback: append a new empty block
            const el = document.createElement(tag);
            el.innerHTML = '<br>';
            editor.appendChild(el);
            editor.focus();
            const r = document.createRange();
            r.setStart(el, 0); r.collapse(true);
            window.getSelection()?.removeAllRanges();
            window.getSelection()?.addRange(r);
            currentBlockRef.current = el;
            syncContent();
            return;
        }

        // Build new element, preserving existing content
        const newEl = document.createElement(tag);
        if (target.nodeType === Node.TEXT_NODE) {
            newEl.textContent = target.textContent ?? '';
            if (!newEl.textContent.trim()) newEl.innerHTML = '<br>';
        } else {
            newEl.innerHTML = (target as HTMLElement).innerHTML || '<br>';
        }

        editor.replaceChild(newEl, target);
        currentBlockRef.current = newEl;

        // Move cursor to end of new element
        editor.focus();
        const r = document.createRange();
        r.selectNodeContents(newEl);
        r.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(r);
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

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
                        {mode === 'add' ? '+ Add New Property' : '✏️ Edit Property'}
                    </h1>
                    <p style={{ fontSize: '13px', color: '#8b8ca7', margin: '4px 0 0' }}>
                        {mode === 'add' ? 'Fill in all the details to list a new property' : 'Update the details for this listing'}
                    </p>
                </div>
                <Link href="/admin/properties" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: 500, background: '#f5f6fa', color: '#555570',
                    textDecoration: 'none', border: '1px solid #e0e0f0',
                }}>← Back</Link>
            </div>

            <form onSubmit={handleSubmit}>
                {/* ── Basic Details ── */}
                <div style={CARD}>
                    <h3 style={CARD_TITLE}>📋 Basic Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {[
                            { label: 'Property Title *', name: 'title', placeholder: 'e.g. Luxury Villa in Tajganj', type: 'text' },
                            { label: 'Price (₹) *', name: 'price', placeholder: 'e.g. 2500000', type: 'text' },
                            { label: 'Location *', name: 'location', placeholder: 'e.g. Tajganj, Agra', type: 'text' },
                            { label: 'Area Size *', name: 'area_size', placeholder: 'e.g. 5000 Sq Ft', type: 'text' },
                        ].map(f => (
                            <div key={f.name}>
                                <label style={LABEL}>{f.label}</label>
                                <input type={f.type} name={f.name} required
                                    defaultValue={f.name === 'price' ? String(property?.price ?? '') : (property as never)?.[f.name] ?? ''}
                                    placeholder={f.placeholder} style={INPUT} />
                            </div>
                        ))}
                        <div>
                            <label style={LABEL}>Property Type *</label>
                            <select name="property_type" required defaultValue={property?.property_type || 'Residential'} style={INPUT}>
                                {['Residential', 'Commercial', 'Villa', 'Shop', 'Plot'].map(t =>
                                    <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={LABEL}>Status *</label>
                            <select name="status" required defaultValue={property?.status || 'Draft'} style={INPUT}>
                                <option value="Draft">📝 Draft</option>
                                <option value="Published">✅ Published</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Extra Details ── */}
                <div style={CARD}>
                    <h3 style={CARD_TITLE}>🔢 Property Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={LABEL}>Bedrooms</label>
                            <input type="number" name="bedrooms" defaultValue={property?.bedrooms} placeholder="e.g. 3" min={0} style={INPUT} />
                        </div>
                        <div>
                            <label style={LABEL}>Bathrooms</label>
                            <input type="number" name="bathrooms" defaultValue={property?.bathrooms} placeholder="e.g. 2" min={0} style={INPUT} />
                        </div>
                        <div>
                            <label style={LABEL}>Property Images *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                {imageUrls.map((url, idx) => (
                                    <div key={idx} style={{ position: 'relative', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e0e0f0' }}>
                                        <input type="hidden" name="image_urls" value={url} />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button type="button" onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))}
                                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(220, 38, 38, 0.8)', color: '#fff', border: 'none', width: '18px', height: '18px', borderRadius: '4px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>✕</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setShowGalleryFor('main')}
                                    style={{ height: '60px', borderRadius: '8px', border: '2px dashed #c7d2fe', background: '#f8f9ff', color: '#2563eb', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    ➕
                                </button>
                            </div>
                            <p style={{ fontSize: '11px', color: '#8b8ca7', margin: 0 }}>Select one or more images for the property gallery</p>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={LABEL}>Amenities (comma separated)</label>
                            <input type="text" name="amenities" defaultValue={property?.amenities} placeholder="e.g. Parking, Garden, Gym, Pool" style={INPUT} />
                        </div>
                    </div>
                </div>

                {/* ── Rich-text Description ── */}
                <div style={CARD}>
                    <h3 style={CARD_TITLE}>📝 Description</h3>

                    {/* ── Toolbar ── */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center',
                        padding: '8px 10px', background: '#f8f9ff',
                        border: '1px solid #e0e0f0', borderBottom: 'none', borderRadius: '8px 8px 0 0',
                    }}>

                        {/* Format Block */}
                        <select
                            onMouseDown={saveSelection}
                            onChange={(e) => {
                                const tag = e.target.value;
                                applyBlock(tag);
                                e.target.value = 'p';
                            }}
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

                        {/* Bold / Italic / Underline / Strikethrough */}
                        <TB title="Bold (Ctrl+B)" html="<b>B</b>" onAction={() => exec('bold')} active={activeFormats.has('bold')} />
                        <TB title="Italic (Ctrl+I)" html="<i>I</i>" onAction={() => exec('italic')} active={activeFormats.has('italic')} />
                        <TB title="Underline (Ctrl+U)" html="<u>U</u>" onAction={() => exec('underline')} active={activeFormats.has('underline')} />
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
                        <TB title="Justify" html="☰" onAction={() => exec('justifyFull')} />

                        <div style={{ width: '1px', height: '22px', background: '#e0e0f0', margin: '0 4px' }} />

                        {/* Indent */}
                        <TB title="Indent" html="→|" onAction={() => exec('indent')} />
                        <TB title="Outdent" html="|←" onAction={() => exec('outdent')} />

                        <div style={{ width: '1px', height: '22px', background: '#e0e0f0', margin: '0 4px' }} />

                        {/* Text Color Picker */}
                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                title="Text Color"
                                onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowColors(v => !v); }}
                                style={{
                                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                    border: '1px solid #e0e0f0', cursor: 'pointer', background: '#fff', color: '#374151',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                }}
                            >
                                <span style={{ fontSize: '15px' }}>A</span>
                                <span style={{
                                    width: '12px', height: '4px', borderRadius: '2px',
                                    background: 'linear-gradient(90deg,#f00,#0f0,#00f)', display: 'inline-block',
                                }} />
                                <span style={{ fontSize: '10px' }}>▼</span>
                            </button>

                            {showColors && (
                                <div
                                    style={{
                                        position: 'absolute', top: '110%', left: 0, zIndex: 100,
                                        background: '#fff', border: '1px solid #e0e0f0', borderRadius: '10px',
                                        padding: '10px', boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                                        display: 'grid', gridTemplateColumns: 'repeat(6, 24px)', gap: '5px',
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    {COLOURS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            title={c}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                exec('foreColor', c);
                                                setShowColors(false);
                                            }}
                                            style={{
                                                width: '24px', height: '24px', borderRadius: '4px',
                                                border: c === '#FFFFFF' ? '1px solid #e0e0f0' : '1px solid transparent',
                                                background: c, cursor: 'pointer',
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Highlight */}
                        <button
                            type="button"
                            title="Highlight Text"
                            onMouseDown={(e) => { e.preventDefault(); restoreSelection(); document.execCommand('hiliteColor', false, '#FEF08A'); syncContent(); }}
                            style={{
                                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                border: '1px solid #e0e0f0', cursor: 'pointer', background: '#FEF08A', color: '#374151',
                            }}
                        >🖍</button>

                        <div style={{ width: '1px', height: '22px', background: '#e0e0f0', margin: '0 4px' }} />

                        {/* Image from Gallery */}
                        <button
                            type="button"
                            title="Insert Image from Gallery"
                            onMouseDown={(e) => { e.preventDefault(); setShowGalleryFor('description'); }}
                            style={{
                                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                border: '1px solid #e0e0f0', cursor: 'pointer', background: '#fff', color: '#374151',
                                display: 'flex', alignItems: 'center', gap: '4px',
                            }}
                        >🖼 Image</button>

                        <div style={{ width: '1px', height: '22px', background: '#e0e0f0', margin: '0 4px' }} />
                        <TB title="Clear Formatting" html="Tx" onAction={() => exec('removeFormat')} />
                        <div style={{ width: '1px', height: '22px', background: '#e0e0f0', margin: '0 4px' }} />
                        <TB title="Undo" html="↩" onAction={() => exec('undo')} />
                        <TB title="Redo" html="↪" onAction={() => exec('redo')} />
                    </div>

                    {/* Editor area */}
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
                            minHeight: '260px', padding: '16px 20px',
                            border: '1px solid #e0e0f0', borderRadius: '0 0 10px 10px',
                            fontSize: '14px', color: '#1a1a2e', lineHeight: 1.8,
                            outline: 'none', background: '#fff',
                        }}
                    />
                </div>

                {/* ── Gallery Picker Modal ── */}
                <GalleryPicker
                    isOpen={showGalleryFor !== null}
                    onClose={() => setShowGalleryFor(null)}
                    title={showGalleryFor === 'main' ? "Add Property Images" : "Insert Image into Description"}
                    multiple={showGalleryFor === 'main'}
                    onSelect={(urlOrUrls) => {
                        if (showGalleryFor === 'main') {
                            const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
                            setImageUrls(prev => {
                                const combined = [...prev, ...urls];
                                // Unique only
                                return Array.from(new Set(combined));
                            });
                        } else if (showGalleryFor === 'description') {
                            const url = Array.isArray(urlOrUrls) ? urlOrUrls[0] : urlOrUrls;
                            const editor = editorRef.current;
                            if (editor) {
                                editor.focus();
                                let inserted = false;
                                const sel = window.getSelection();
                                if (savedSelRef.current && sel) {
                                    try {
                                        sel.removeAllRanges(); sel.addRange(savedSelRef.current);
                                        document.execCommand('insertHTML', false, `<img src="${url}" alt="property image" style="max-width:100%;border-radius:8px;margin:10px 0;display:block;" />`);
                                        inserted = true;
                                    } catch { /* ignore */ }
                                }
                                if (!inserted) {
                                    const img = document.createElement('img');
                                    img.src = url; img.alt = 'property image';
                                    img.style.cssText = 'max-width:100%;border-radius:8px;margin:10px 0;display:block;';
                                    editor.appendChild(img);
                                }
                                syncContent();
                            }
                        }
                        setShowGalleryFor(null);
                    }}
                />

                <input type="hidden" name="description" ref={hiddenRef} defaultValue={property?.description || ''} />
                <p style={{ fontSize: '11px', color: '#b0b0c3', marginTop: '12px', marginBottom: '20px' }}>
                    Tip: Select text first, then click a toolbar button to apply formatting.
                </p>

                {/* ── Options ── */}
                <div style={CARD}>
                    <h3 style={CARD_TITLE}>⚙️ Options</h3>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input type="checkbox" name="is_featured" id="is_featured" defaultChecked={property?.is_featured}
                            style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }} />
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a2e' }}>⭐ Mark as Featured Property</span>
                        <span style={{ fontSize: '12px', color: '#8b8ca7' }}>— Shown at the top of listings</span>
                    </label>
                </div>

                {/* ── Actions ── */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <Link href="/admin/properties" style={{
                        padding: '10px 24px', borderRadius: '8px', fontSize: '14px',
                        fontWeight: 500, background: '#fff', color: '#555570',
                        textDecoration: 'none', border: '1px solid #e0e0f0',
                    }}>Cancel</Link>
                    <button type="submit" disabled={loading} style={{
                        padding: '10px 28px', borderRadius: '8px', fontSize: '14px',
                        fontWeight: 600, background: loading ? '#93c5fd' : '#2563eb',
                        color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                        {loading ? '⏳ Saving...' : mode === 'add' ? '✅ Save Property' : '✅ Update Property'}
                    </button>
                </div>
            </form>
        </div>
    );
}
