const REVIEWS = [
    {
        name: 'Rahul Sharma',
        role: 'Business Owner',
        text: 'Sampatti Kendra helped me find the perfect shop in Sanjay Place for my business. The team was transparent and made the entire process seamless. Highly recommended!',
        rating: 5,
        initials: 'RS',
        color: '#2563eb',
    },
    {
        name: 'Priya Verma',
        role: 'Homeowner',
        text: 'Very professional team. They made buying my first home in Dayal Bagh completely hassle-free. They guided us through every legal detail. Truly exceptional service!',
        rating: 5,
        initials: 'PV',
        color: '#7c3aed',
    },
    {
        name: 'Amit Agarwal',
        role: 'Property Investor',
        text: 'I have bought 3 plots through Sampatti Kendra over the last 5 years. Their market knowledge and honest advice have always helped me make smart investments.',
        rating: 5,
        initials: 'AA',
        color: '#059669',
    },
];

export default function Testimonials() {
    return (
        <section style={{ padding: '100px 0', background: '#f8f9ff' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <span style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                        color: '#92400e', fontWeight: 700,
                        fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
                        padding: '6px 16px', borderRadius: '50px', marginBottom: '16px',
                    }}>
                        ⭐ Client Stories
                    </span>
                    <h2 style={{
                        fontSize: '2.4rem', fontWeight: 800, color: '#0a0f2e',
                        margin: '0 0 12px', fontFamily: 'Georgia, serif',
                    }}>
                        What Our Clients Say
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '17px', maxWidth: '460px', margin: '0 auto' }}>
                        Real stories from real people who found their dream property with us
                    </p>
                </div>

                {/* Cards */}
                <div className="testimonials-grid" style={{ gap: '28px' }}>

                    {REVIEWS.map((rev, i) => (
                        <div key={i} style={{
                            background: '#fff',
                            border: '1.5px solid #eef0f8',
                            borderRadius: '20px',
                            padding: '32px 28px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                            position: 'relative',
                        }}>
                            {/* Quote mark */}
                            <div style={{
                                position: 'absolute', top: '20px', right: '24px',
                                fontSize: '64px', lineHeight: 1, color: '#f0f0f8',
                                fontFamily: 'Georgia, serif', fontWeight: 700,
                                userSelect: 'none',
                            }}>
                                "
                            </div>

                            {/* Stars */}
                            <div style={{ marginBottom: '16px', display: 'flex', gap: '3px' }}>
                                {[...Array(rev.rating)].map((_, si) => (
                                    <span key={si} style={{ fontSize: '16px', color: '#f59e0b' }}>★</span>
                                ))}
                            </div>

                            <p style={{
                                fontSize: '15px', color: '#374151', lineHeight: 1.75,
                                margin: '0 0 24px', fontStyle: 'italic',
                            }}>
                                "{rev.text}"
                            </p>

                            {/* Author */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${rev.color}, ${rev.color}cc)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 700, fontSize: '14px',
                                    flexShrink: 0,
                                }}>
                                    {rev.initials}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#0a0f2e', fontSize: '15px' }}>{rev.name}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>{rev.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
