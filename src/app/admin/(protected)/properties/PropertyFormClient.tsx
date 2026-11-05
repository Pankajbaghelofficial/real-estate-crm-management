'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import GalleryPicker from '@/components/admin/GalleryPicker';
import {
    AMENITY_OPTIONS, FACING_OPTIONS, FURNISHING_OPTIONS, OWNERSHIP_OPTIONS,
    POSSESSION_OPTIONS, PROPERTY_AGE_OPTIONS, PROPERTY_TYPES, splitAmenities,
} from '@/lib/propertySearch';

/* ─── Shared CSS helpers ─────────────────────────────── */
const INPUT: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid var(--border-admin)', fontSize: '13px', color: 'var(--text-admin)',
    outline: 'none', fontFamily: "var(--font-sans)",
    background: 'var(--bg-admin-input)', boxSizing: 'border-box',
};
const LABEL: React.CSSProperties = {
    display: 'block', marginBottom: '6px', fontSize: '12px',
    fontWeight: 600, color: 'var(--text-admin-dim)', textTransform: 'uppercase', letterSpacing: '0.5px',
};
const CARD: React.CSSProperties = {
    background: 'var(--bg-admin-card)', borderRadius: '12px', border: '1px solid var(--border-admin)',
    padding: '24px', marginBottom: '20px',
};
const CARD_TITLE: React.CSSProperties = {
    fontSize: '14px', fontWeight: 700, color: 'var(--text-admin)',
    marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-admin)',
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
                fontWeight: 600, border: '1px solid var(--border-admin)', cursor: 'pointer',
                lineHeight: 1.5, background: active ? 'rgba(63, 192, 231, 0.15)' : 'transparent',
                color: active ? 'var(--accent-premium-gold)' : 'var(--text-admin)',
            }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

/* ─── Main component ─────────────────────────────────── */
export interface PropertyFormData {
    title?: string; price?: string | number; location?: string;
    area_size?: string; property_type?: string; status?: string;
    description?: string; is_featured?: boolean; image_urls?: string[];
    amenities?: string; bedrooms?: number; bathrooms?: number;
    listing_type?: string; city?: string | null; locality?: string | null;
    area_sqft?: number | null; furnishing?: string | null; possession_status?: string | null;
    property_age?: string | null; floor_no?: number | null; total_floors?: number | null;
    facing?: string | null; balconies?: number | null; ownership?: string | null;
    rera_number?: string | null; is_verified?: boolean;
}

function SelectField({ label, name, options, value, placeholder = 'Select' }: {
    label: string; name: string; options: readonly string[]; value?: string | null; placeholder?: string;
}) {
    return (
        <div>
            <label style={LABEL} htmlFor={`pf-${name}`}>{label}</label>
            <select id={`pf-${name}`} name={name} defaultValue={value ?? ''} style={INPUT}>
                <option value="">{placeholder}</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

function NumberField({ label, name, value, placeholder, min = 0, step }: {
    label: string; name: string; value?: number | null; placeholder?: string; min?: number; step?: string;
}) {
    return (
        <div>
            <label style={LABEL} htmlFor={`pf-${name}`}>{label}</label>
            <input id={`pf-${name}`} type="number" name={name} defaultValue={value ?? ''} placeholder={placeholder} min={min} step={step} style={INPUT} />
        </div>
    );
}

export default function PropertyFormClient({
    property, action, mode, canVerify = false,
}: {
    property?: PropertyFormData;
    action: (formData: FormData) => Promise<void>;
    mode: 'add' | 'edit';
    canVerify?: boolean;
}) {
    const existingAmenities = splitAmenities(property?.amenities);
    const checkedAmenities = new Set(existingAmenities.filter(a => (AMENITY_OPTIONS as readonly string[]).includes(a)));
    const extraAmenities = existingAmenities.filter(a => !checkedAmenities.has(a)).join(', ');

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
        <div style={{ fontFamily: "var(--font-sans)" }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 className="premium-gradient-text" style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                        {mode === 'add' ? '+ Add New Property' : '✏️ Edit Property'}
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-admin-dim)', margin: '4px 0 0' }}>
                        {mode === 'add' ? 'Fill in all the details to list a new property' : 'Update the details for this listing'}
                    </p>
                </div>
                <Link href="/admin/properties" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: 500, background: 'var(--bg-admin-card)', color: 'var(--text-admin-dim)',
                    textDecoration: 'none', border: '1px solid var(--border-admin)',
                }}>← Back</Link>
            </div>

            <form onSubmit={handleSubmit}>
                {/* ── Basic Details ── */}
                <div className="glass-panel" style={CARD}>
                    <h3 style={CARD_TITLE}>📋 Basic Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={LABEL} htmlFor="pf-listing_type">Listing For *</label>
                            <select id="pf-listing_type" name="listing_type" required defaultValue={property?.listing_type || 'Sale'} style={INPUT}>
                                <option value="Sale">Sale</option>
                                <option value="Rent">Rent / Lease</option>
                            </select>
                        </div>
                        <div>
                            <label style={LABEL} htmlFor="pf-property_type">Property Type *</label>
                            <select id="pf-property_type" name="property_type" required defaultValue={property?.property_type || 'Residential'} style={INPUT}>
                                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                {property?.property_type && !(PROPERTY_TYPES as readonly string[]).includes(property.property_type) && (
                                    <option value={property.property_type}>{property.property_type}</option>
                                )}
                            </select>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={LABEL} htmlFor="pf-title">Property Title *</label>
                            <input id="pf-title" type="text" name="title" required defaultValue={property?.title ?? ''} placeholder="e.g. 3 BHK Apartment in Kamla Nagar" style={INPUT} />
                        </div>
                        <div>
                            <label style={LABEL} htmlFor="pf-price">Price (₹) * <span style={{ textTransform: 'none', fontWeight: 400 }}>— monthly rent for Rent</span></label>
                            <input id="pf-price" type="text" name="price" required inputMode="numeric" defaultValue={String(property?.price ?? '')} placeholder="e.g. 2500000" style={INPUT} />
                        </div>
                        <div>
                            <label style={LABEL} htmlFor="pf-status">Status *</label>
                            <select id="pf-status" name="status" required defaultValue={property?.status || 'Draft'} style={INPUT}>
                                <option value="Draft">📝 Draft</option>
                                <option value="Published">✅ Published</option>
                            </select>
                        </div>
                        <div>
                            <label style={LABEL} htmlFor="pf-city">City</label>
                            <input id="pf-city" type="text" name="city" defaultValue={property?.city ?? (mode === 'add' ? 'Agra' : '')} placeholder="e.g. Agra" style={INPUT} />
                        </div>
                        <div>
                            <label style={LABEL} htmlFor="pf-locality">Locality</label>
                            <input id="pf-locality" type="text" name="locality" defaultValue={property?.locality ?? ''} placeholder="e.g. Kamla Nagar" style={INPUT} />
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={LABEL} htmlFor="pf-location">Address / Location shown on listing *</label>
                            <input id="pf-location" type="text" name="location" required defaultValue={property?.location ?? ''} placeholder="e.g. Block C, Kamla Nagar, Agra" style={INPUT} />
                        </div>
                    </div>
                </div>

                {/* ── Extra Details ── */}
                <div className="glass-panel" style={CARD}>
                    <h3 style={CARD_TITLE}>🔢 Property Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                        <div>
                            <label style={LABEL} htmlFor="pf-area_size">Area (as shown) *</label>
                            <input id="pf-area_size" type="text" name="area_size" required defaultValue={property?.area_size ?? ''} placeholder="e.g. 1650 sq.ft" style={INPUT} />
                        </div>
                        <NumberField label="Area in sq.ft (number)" name="area_sqft" value={property?.area_sqft} placeholder="e.g. 1650" step="any" />
                        <NumberField label="Bedrooms (BHK)" name="bedrooms" value={property?.bedrooms} placeholder="e.g. 3" />
                        <NumberField label="Bathrooms" name="bathrooms" value={property?.bathrooms} placeholder="e.g. 2" />
                        <NumberField label="Balconies" name="balconies" value={property?.balconies} placeholder="e.g. 1" />
                        <NumberField label="Floor No." name="floor_no" value={property?.floor_no} placeholder="0 = Ground" min={-5} />
                        <NumberField label="Total Floors" name="total_floors" value={property?.total_floors} placeholder="e.g. 10" />
                        <SelectField label="Furnishing" name="furnishing" options={FURNISHING_OPTIONS} value={property?.furnishing} />
                        <SelectField label="Possession" name="possession_status" options={POSSESSION_OPTIONS} value={property?.possession_status} />
                        <SelectField label="Property Age" name="property_age" options={PROPERTY_AGE_OPTIONS} value={property?.property_age} />
                        <SelectField label="Facing" name="facing" options={FACING_OPTIONS} value={property?.facing} />
                        <SelectField label="Ownership" name="ownership" options={OWNERSHIP_OPTIONS} value={property?.ownership} />
                        <div>
                            <label style={LABEL} htmlFor="pf-rera_number">RERA No.</label>
                            <input id="pf-rera_number" type="text" name="rera_number" defaultValue={property?.rera_number ?? ''} placeholder="Optional" style={INPUT} />
                        </div>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-admin-dim)', margin: '10px 0 0' }}>
                        &quot;Area in sq.ft&quot; is used for price per sq.ft and sorting by area.
                    </p>
                </div>

                {/* ── Amenities ── */}
                <div className="glass-panel" style={CARD}>
                    <h3 style={CARD_TITLE}>✨ Amenities</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                        {AMENITY_OPTIONS.map(a => (
                            <label key={a} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-admin)', cursor: 'pointer' }}>
                                <input type="checkbox" name="amenity_opts" value={a} defaultChecked={checkedAmenities.has(a)}
                                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-premium-gold)' }} />
                                {a}
                            </label>
                        ))}
                    </div>
                    <label style={LABEL} htmlFor="pf-amenities">Other amenities (comma separated)</label>
                    <input id="pf-amenities" type="text" name="amenities" defaultValue={extraAmenities} placeholder="e.g. Modular Kitchen, Terrace" style={INPUT} />
                </div>

                {/* ── Images ── */}
                <div className="glass-panel" style={CARD}>
                    <h3 style={CARD_TITLE}>🖼 Property Images</h3>
                    <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                {imageUrls.map((url, idx) => (
                                    <div key={idx} style={{ position: 'relative', height: '75px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-admin)' }}>
                                        <input type="hidden" name="image_urls" value={url} />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button type="button" aria-label="Remove image" onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))}
                                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(220, 38, 38, 0.8)', color: '#fff', border: 'none', width: '18px', height: '18px', borderRadius: '4px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>✕</button>
                                    </div>
                                ))}
                                <button type="button" aria-label="Add images" onClick={() => setShowGalleryFor('main')}
                                    style={{ height: '75px', borderRadius: '8px', border: '2px dashed var(--border-admin)', background: 'var(--bg-admin-input)', color: 'var(--accent-premium-gold)', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    ➕
                                </button>
                            </div>
                            <p style={{ fontSize: '11px', color: '#8b8ca7', margin: 0 }}>Select one or more images for the property gallery. The first image is the cover.</p>
                    </div>
                </div>

                {/* ── Rich-text Description ── */}
                <div className="glass-panel" style={CARD}>
                    <h3 style={CARD_TITLE}>📝 Description</h3>

                    {/* ── Toolbar ── */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center',
                        padding: '8px 10px', background: 'var(--bg-admin-input)',
                        border: '1px solid var(--border-admin)', borderBottom: 'none', borderRadius: '8px 8px 0 0',
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

                        <div style={{ width: '1px', height: '22px', background: 'var(--border-admin)', margin: '0 4px' }} />

                        {/* Bold / Italic / Underline / Strikethrough */}
                        <TB title="Bold (Ctrl+B)" html="<b>B</b>" onAction={() => exec('bold')} active={activeFormats.has('bold')} />
                        <TB title="Italic (Ctrl+I)" html="<i>I</i>" onAction={() => exec('italic')} active={activeFormats.has('italic')} />
                        <TB title="Underline (Ctrl+U)" html="<u>U</u>" onAction={() => exec('underline')} active={activeFormats.has('underline')} />
                        <TB title="Strikethrough" html="<s>S</s>" onAction={() => exec('strikeThrough')} active={activeFormats.has('strikeThrough')} />

                        <div style={{ width: '1px', height: '22px', background: 'var(--border-admin)', margin: '0 4px' }} />

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
                            <style>{`
                                    select option { background: var(--bg-admin-card); color: var(--text-admin); }
                                `}</style>
                            <button
                                type="button"
                                title="Text Color"
                                onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowColors(v => !v); }}
                                style={{
                                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                    border: '1px solid var(--border-admin)', cursor: 'pointer', background: 'var(--bg-admin-card)', color: 'var(--text-admin)',
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
                                    className="glass-panel"
                                    style={{
                                        position: 'absolute', top: '110%', left: 0, zIndex: 100,
                                        background: 'var(--bg-admin-card)', border: '1px solid var(--border-admin)', borderRadius: '10px',
                                        padding: '10px', boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
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
                                                border: c.toUpperCase() === '#FFFFFF' ? '1px solid var(--border-admin)' : '1px solid transparent',
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
                            onMouseDown={(e) => { e.preventDefault(); restoreSelection(); document.execCommand('hiliteColor', false, 'rgba(63, 192, 231, 0.4)'); syncContent(); }}
                            style={{
                                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                border: '1px solid var(--border-admin)', cursor: 'pointer', background: 'rgba(63, 192, 231, 0.2)', color: 'var(--text-admin)',
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
                                border: '1px solid var(--border-admin)', cursor: 'pointer', background: 'var(--bg-admin-card)', color: 'var(--text-admin)',
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
                            border: '1px solid var(--border-admin)', borderRadius: '0 0 10px 10px',
                            fontSize: '14px', color: 'var(--text-admin)', lineHeight: 1.8,
                            outline: 'none', background: 'var(--bg-admin-card)',
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
                <div className="glass-panel" style={CARD}>
                    <h3 style={CARD_TITLE}>⚙️ Options</h3>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input type="checkbox" name="is_featured" id="is_featured" defaultChecked={property?.is_featured}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--accent-premium-gold)', cursor: 'pointer' }} />
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-admin)' }}>⭐ Mark as Featured Property</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-admin-dim)' }}>— Shown at the top of listings</span>
                    </label>
                    {canVerify ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '14px' }}>
                            <input type="checkbox" name="is_verified" defaultChecked={property?.is_verified}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-premium-gold)', cursor: 'pointer' }} />
                            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-admin)' }}>✔ Verified Listing</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-admin-dim)' }}>— Documents / site checked by our team</span>
                        </label>
                    ) : property?.is_verified ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-admin-dim)', margin: '14px 0 0' }}>✔ This listing is verified. Only admins can change this.</p>
                    ) : null}
                </div>

                {/* ── Actions ── */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <Link href="/admin/properties" style={{
                        padding: '10px 24px', borderRadius: '8px', fontSize: '14px',
                        fontWeight: 500, background: 'var(--bg-admin-card)', color: 'var(--text-admin)',
                        textDecoration: 'none', border: '1px solid var(--border-admin)',
                    }}>Cancel</Link>
                    <button type="submit" disabled={loading} style={{
                        padding: '10px 28px', borderRadius: '8px', fontSize: '14px',
                        fontWeight: 600, background: loading ? 'rgba(63, 192, 231, 0.5)' : 'var(--accent-premium-gold)',
                        color: '#0a0f2e', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 15px rgba(63, 192, 231, 0.2)',
                    }}>
                        {loading ? '⏳ Saving...' : mode === 'add' ? '✅ Save Property' : '✅ Update Property'}
                    </button>
                </div>
            </form>
        </div>
    );
}
