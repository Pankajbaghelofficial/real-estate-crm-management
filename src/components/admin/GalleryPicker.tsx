'use client';

import { useState, useEffect } from 'react';

interface GalleryImage {
    filename: string;
    url: string;
}

interface GalleryPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string | string[]) => void;
    title?: string;
    multiple?: boolean;
}

export default function GalleryPicker({ isOpen, onClose, onSelect, title = "Choose Image", multiple = false }: GalleryPickerProps) {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchImages();
            setSelectedUrls([]);
        }
    }, [isOpen]);

    async function fetchImages() {
        setLoading(true);
        try {
            const res = await fetch('/api/upload');
            const data = await res.json();
            setImages(data.files || []);
        } catch {
            setImages([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');

            // Add to gallery list
            setImages(prev => [{ filename: data.filename, url: data.url }, ...prev]);

            if (multiple) {
                setSelectedUrls(prev => [...prev, data.url]);
            } else {
                onSelect(data.url);
            }
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    }

    const toggleSelect = (url: string) => {
        if (!multiple) {
            onSelect(url);
            return;
        }
        setSelectedUrls(prev =>
            prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
        );
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.55)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="glass-panel"
                style={{
                    background: 'var(--bg-admin-card)', borderRadius: '16px', width: '100%',
                    maxWidth: '800px', maxHeight: '85vh', display: 'flex',
                    flexDirection: 'column', overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: '1px solid var(--border-admin)'
                }}
            >
                {/* Modal Header */}
                <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-admin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-admin)' }}>🖼️ {title} {multiple && `(${selectedUrls.length} selected)`}</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-admin-dim)' }}>{images.length} images in gallery</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
                            fontWeight: 600, background: uploading ? 'rgba(63, 192, 231, 0.5)' : 'var(--accent-premium-gold)',
                            color: '#0a0f2e', cursor: uploading ? 'wait' : 'pointer'
                        }}>
                            {uploading ? '⏳ Uploading...' : '⬆️ Upload New'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading} onChange={handleUpload} />
                        </label>
                        {multiple && (
                            <button
                                type="button"
                                disabled={selectedUrls.length === 0}
                                onClick={() => onSelect(selectedUrls)}
                                style={{
                                    padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
                                    fontWeight: 700, background: selectedUrls.length === 0 ? 'var(--bg-admin-input)' : '#16a34a',
                                    color: selectedUrls.length === 0 ? 'var(--text-admin-dim)' : '#fff', border: 'none', cursor: selectedUrls.length === 0 ? 'not-allowed' : 'pointer'
                                }}
                            >✨ Insert Selected</button>
                        )}
                        <button type="button" onClick={onClose}
                            style={{
                                padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
                                fontWeight: 600, background: 'var(--bg-admin-input)', color: 'var(--text-admin)',
                                border: '1px solid var(--border-admin)', cursor: 'pointer'
                            }}
                        >✕ Close</button>
                    </div>
                </div>

                {/* Modal Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-admin-dim)' }}>
                            <p style={{ fontSize: '28px', margin: '0 0 8px' }}>⏳</p>
                            <p style={{ margin: 0 }}>Loading gallery...</p>
                        </div>
                    ) : images.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-admin-dim)' }}>
                            <p style={{ fontSize: '36px', margin: '0 0 8px' }}>🖼️</p>
                            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-admin)' }}>Gallery is empty</p>
                            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Use "⬆️ Upload New" button above to add images</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                            {images.map(img => {
                                const isSelected = selectedUrls.includes(img.url);
                                return (
                                    <div
                                        key={img.filename}
                                        onClick={() => toggleSelect(img.url)}
                                        style={{
                                            borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
                                            border: isSelected ? '3px solid var(--accent-premium-gold)' : '1px solid var(--border-admin)',
                                            background: 'var(--bg-admin-input)', transition: 'all 0.15s',
                                            position: 'relative',
                                            transform: isSelected ? 'scale(0.96)' : 'scale(1)'
                                        }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img.url} alt={img.filename} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} />

                                        {isSelected && (
                                            <div style={{
                                                position: 'absolute', top: '5px', right: '5px',
                                                background: 'var(--accent-premium-gold)', color: '#0a0f2e', borderRadius: '50%',
                                                width: '20px', height: '20px', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: '12px', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
                                            }}>✓</div>
                                        )}

                                        {multiple && !isSelected && (
                                            <div style={{
                                                position: 'absolute', top: '5px', right: '5px',
                                                background: 'rgba(255,255,255,0.1)', borderRadius: '50%',
                                                width: '20px', height: '20px', border: '1px solid var(--border-admin)'
                                            }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
