import Link from 'next/link';

export default function CTASection() {
    return (
        <section style={{
            padding: '100px 0',
            background: 'linear-gradient(135deg, #0a0f2e 0%, #1a2d6b 100%)',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Decorative orb */}
            <div style={{
                position: 'absolute', top: '-100px', right: '-100px',
                width: '500px', height: '500px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative' }}>
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '28px', padding: '64px 48px',
                    backdropFilter: 'blur(10px)',
                }}>
                    <span style={{
                        display: 'inline-block',
                        background: 'rgba(212,175,55,0.12)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: '#d4af37', fontWeight: 700,
                        fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
                        padding: '6px 16px', borderRadius: '50px', marginBottom: '24px',
                    }}>
                        🏡 Let's Get Started
                    </span>
                    <h2 style={{
                        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                        fontWeight: 800, color: '#ffffff',
                        margin: '0 0 18px', fontFamily: 'Georgia, serif',
                        lineHeight: 1.25,
                    }}>
                        Ready to Find Your{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #d4af37, #f5d060)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Dream Property?
                        </span>
                    </h2>
                    <p style={{
                        fontSize: '18px', color: 'rgba(255,255,255,0.65)',
                        maxWidth: '540px', margin: '0 auto 40px', lineHeight: 1.7,
                    }}>
                        Talk to our Agra property experts today. Free consultation, no obligation.
                    </p>

                    <div className="cta-buttons" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/contact" style={{
                            background: 'linear-gradient(135deg, #d4af37, #c9a227)',
                            color: '#0a0f2e', padding: '16px 36px', borderRadius: '14px',
                            fontWeight: 800, fontSize: '16px', textDecoration: 'none',
                        }}>
                            Get Free Consultation
                        </Link>
                        <Link href="/properties" style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1.5px solid rgba(255,255,255,0.2)',
                            color: '#fff', padding: '16px 36px', borderRadius: '14px',
                            fontWeight: 700, fontSize: '16px', textDecoration: 'none',
                            backdropFilter: 'blur(10px)',
                        }}>
                            Browse Properties →
                        </Link>
                    </div>

                    {/* Trust indicators */}
                    <div className="cta-trust" style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '48px', flexWrap: 'wrap' }}>
                        {[
                            { icon: '✓', text: 'No Hidden Charges' },
                            { icon: '✓', text: 'Verified Properties' },
                            { icon: '✓', text: 'Free Expert Advice' },
                        ].map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                color: 'rgba(255,255,255,0.65)', fontSize: '14px',
                            }}>
                                <span style={{
                                    width: '20px', height: '20px', borderRadius: '50%',
                                    background: 'rgba(212,175,55,0.2)',
                                    border: '1px solid rgba(212,175,55,0.4)',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#d4af37', fontSize: '11px', fontWeight: 700,
                                }}>
                                    {item.icon}
                                </span>
                                {item.text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
