const POINTS = [
    {
        icon: '🎯',
        title: 'Local Expertise',
        description: 'Deep knowledge of Agra\'s localities — from Taj Nagari to Dayal Bagh — helping you find the best deals.',
        color: '#2563eb', bg: '#eff6ff',
    },
    {
        icon: '🤝',
        title: 'Verified Properties',
        description: 'All listings are personally verified for legal clarity. Zero risk, maximum peace of mind.',
        color: '#7c3aed', bg: '#f5f3ff',
    },
    {
        icon: '⚡',
        title: 'Fast Process',
        description: 'From shortlisting to registration, we fast-track every step so you move in faster.',
        color: '#059669', bg: '#ecfdf5',
    },
    {
        icon: '💰',
        title: 'Best Prices',
        description: 'Competitive pricing with transparent cost breakdowns. No hidden charges, ever.',
        color: '#d97706', bg: '#fffbeb',
    },
    {
        icon: '📞',
        title: '24/7 Support',
        description: 'Our agents are always a call or WhatsApp away to assist you at every stage.',
        color: '#dc2626', bg: '#fef2f2',
    },
    {
        icon: '🏆',
        title: 'Award Winning',
        description: 'Recognized as Agra\'s top real estate platform with 500+ successful transactions.',
        color: '#0891b2', bg: '#ecfeff',
    },
];

export default function WhyChooseUs() {
    return (
        <section style={{
            padding: '100px 0',
            background: 'linear-gradient(180deg, #0a0f2e 0%, #0d1b4b 100%)',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Subtle background texture */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(212,175,55,0.07) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 50%, rgba(37,99,235,0.07) 0%, transparent 50%)`,
            }} />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <span style={{
                        display: 'inline-block',
                        background: 'rgba(212,175,55,0.12)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: '#d4af37', fontWeight: 700,
                        fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
                        padding: '6px 16px', borderRadius: '50px', marginBottom: '16px',
                    }}>
                        Why Us
                    </span>
                    <h2 style={{
                        fontSize: '2.4rem', fontWeight: 800, color: '#ffffff',
                        margin: '0 0 14px', fontFamily: 'Georgia, serif',
                    }}>
                        Why Choose{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #d4af37, #f5d060)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Sampatti Kendra
                        </span>
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17px', maxWidth: '500px', margin: '0 auto' }}>
                        We're not just a broker — we're your trusted property partner in Agra
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="why-grid" style={{ gap: '24px' }}>

                    {POINTS.map((pt, i) => (
                        <div key={i} style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px', padding: '32px 28px',
                            backdropFilter: 'blur(10px)',
                        }}>
                            <div style={{
                                width: '56px', height: '56px',
                                background: pt.bg, borderRadius: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '26px', marginBottom: '20px',
                            }}>
                                {pt.icon}
                            </div>
                            <h3 style={{
                                fontSize: '17px', fontWeight: 700, color: '#fff',
                                margin: '0 0 10px',
                            }}>
                                {pt.title}
                            </h3>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>
                                {pt.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
