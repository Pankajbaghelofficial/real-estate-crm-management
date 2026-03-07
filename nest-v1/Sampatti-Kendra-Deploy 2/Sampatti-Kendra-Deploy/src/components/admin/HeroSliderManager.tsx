'use client';

import { useState, useEffect } from 'react';
import { HeroSlide } from '@/lib/siteSettings';
import { addHeroSlide, deleteHeroSlide, updateHeroSlides, getHeroSlides } from '@/app/actions/site';
import GalleryPicker from './GalleryPicker';

export default function HeroSliderManager() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGallery, setShowGallery] = useState(false);

    useEffect(() => {
        loadSlides();
    }, []);

    const loadSlides = async () => {
        const data = await getHeroSlides();
        setSlides(data);
        setLoading(false);
    };

    async function handleGallerySelect(urls: string | string[]) {
        const urlList = Array.isArray(urls) ? urls : [urls];

        for (const url of urlList) {
            await addHeroSlide({ image_url: url });
        }

        setShowGallery(false);
        loadSlides();
    }

    async function handleDelete(id: string) {
        if (confirm('Delete this slide?')) {
            const res = await deleteHeroSlide(id);
            if (res.success) loadSlides();
        }
    }

    async function handleUpdate(id: string, updates: Partial<HeroSlide>) {
        const newSlides = slides.map(s => s.id === id ? { ...s, ...updates } : s);
        setSlides(newSlides);
        await updateHeroSlides(newSlides);
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0a0f2e', margin: 0 }}>Hero Slider Management</h1>
                    <p style={{ color: '#64748b' }}>Manage the auto-sliding images on your home page</p>
                </div>
                <button
                    onClick={() => setShowGallery(true)}
                    style={{
                        padding: '10px 20px', background: '#2563eb', color: '#fff',
                        borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '8px', border: 'none'
                    }}
                >
                    + Add New Slide (from Gallery)
                </button>
            </div>

            <GalleryPicker
                isOpen={showGallery}
                onClose={() => setShowGallery(false)}
                onSelect={handleGallerySelect}
                multiple={true}
                title="Select Hero Slider Images"
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {slides.map((slide) => (
                    <div key={slide.id} style={{
                        background: '#fff', borderRadius: '12px', overflow: 'hidden',
                        border: '1px solid #eef0f7', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ position: 'relative', height: '180px' }}>
                            <img src={slide.image_url} alt="slide" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                                onClick={() => handleDelete(slide.id)}
                                style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    background: '#ef4444', color: '#fff', border: 'none',
                                    padding: '6px', borderRadius: '6px', cursor: 'pointer'
                                }}
                            >
                                🗑 Delete
                            </button>
                        </div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Title (Optional)</label>
                                <input
                                    type="text"
                                    value={slide.title || ''}
                                    onChange={(e) => handleUpdate(slide.id, { title: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', marginTop: '4px' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Subtitle (Optional)</label>
                                <textarea
                                    value={slide.subtitle || ''}
                                    onChange={(e) => handleUpdate(slide.id, { subtitle: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', marginTop: '4px', height: '60px' }}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {slides.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1', padding: '60px', textAlign: 'center',
                        border: '2px dashed #e2e8f0', borderRadius: '12px', color: '#94a3b8'
                    }}>
                        No slides yet. Click the button above to upload your first image.
                    </div>
                )}
            </div>
        </div>
    );
}
