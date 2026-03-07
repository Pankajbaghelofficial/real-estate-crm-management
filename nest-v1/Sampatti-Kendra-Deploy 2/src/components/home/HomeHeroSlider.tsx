'use client';

import { useState, useEffect } from 'react';
import { HeroSlide } from '@/lib/siteSettings';

export default function HomeHeroSlider({ slides }: { slides: HeroSlide[] }) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (slides.length <= 1) return;

        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000); // 5 seconds interval

        return () => clearInterval(timer);
    }, [slides.length]);

    if (!slides || slides.length === 0) {
        return (
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, #0a0f2e 0%, #0d1b4b 40%, #1a2d6b 70%)',
            }} />
        );
    }

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `linear-gradient(rgba(10, 15, 46, 0.6), rgba(10, 15, 46, 0.6)), url(${slide.image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transition: 'opacity 1s ease-in-out, transform 1s ease-in-out',
                        opacity: index === current ? 1 : 0,
                        transform: index === current ? 'scale(1.05)' : 'scale(1)',
                        zIndex: index === current ? 1 : 0,
                    }}
                />
            ))}

            {/* Dots navigation */}
            {slides.length > 1 && (
                <div style={{
                    position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', gap: '8px', zIndex: 10
                }}>
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            style={{
                                width: '12px', height: '12px', borderRadius: '50%',
                                border: 'none', cursor: 'pointer',
                                background: i === current ? '#d4af37' : 'rgba(255,255,255,0.3)',
                                transition: 'all 0.3s'
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
