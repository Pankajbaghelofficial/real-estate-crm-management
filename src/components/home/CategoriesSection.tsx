import Link from 'next/link';

const CATEGORIES = [
    {
        name: 'Residential Plot',
        icon: '🏠',
        description: 'Ideal family homes & plots',
        color: '#2563eb',
        bg: '#eff6ff',
        count: '120+ Listings',
    },
    {
        name: 'Villa',
        icon: '🏰',
        description: 'Luxury villas & bungalows',
        color: '#7c3aed',
        bg: '#f5f3ff',
        count: '45+ Listings',
    },
    {
        name: 'Commercial',
        icon: '🏢',
        description: 'Office & business spaces',
        color: '#059669',
        bg: '#ecfdf5',
        count: '80+ Listings',
    },
    {
        name: 'Shop',
        icon: '🏬',
        description: 'Prime retail locations',
        color: '#d97706',
        bg: '#fffbeb',
        count: '60+ Listings',
    },
];

export default function CategoriesSection() {
    return (
        <section style={{
            padding: '100px 0',
            background: '#f8f9ff',
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <span style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                        color: '#2563eb', fontWeight: 700,
                        fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
                        padding: '6px 16px', borderRadius: '50px', marginBottom: '16px',
                    }}>
                        Property Types
                    </span>
                    <h2 style={{
                        fontSize: '2.4rem', fontWeight: 800, color: '#0a0f2e',
                        margin: '0 0 12px', fontFamily: 'Georgia, serif',
                    }}>
                        Browse by Category
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '17px', maxWidth: '480px', margin: '0 auto' }}>
                        Explore a wide variety of property types tailored to your needs
                    </p>
                </div>

                {/* Cards */}
                <div className="rg-4" style={{ gap: '24px' }}>
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat.name}
                            href={`/properties?category=${cat.name}`}
                            style={{
                                background: '#fff',
                                border: '1.5px solid #eef0f8',
                                borderRadius: '20px',
                                padding: '36px 24px',
                                textDecoration: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '14px',
                                textAlign: 'center',
                                transition: 'all 0.25s ease',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{
                                width: '68px', height: '68px',
                                background: cat.bg,
                                borderRadius: '18px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '32px',
                                marginBottom: '4px',
                            }}>
                                {cat.icon}
                            </div>
                            <h3 style={{
                                fontSize: '17px', fontWeight: 700, color: '#0a0f2e', margin: 0,
                            }}>
                                {cat.name}
                            </h3>
                            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                                {cat.description}
                            </p>
                            <span style={{
                                fontSize: '12px', fontWeight: 600,
                                color: cat.color,
                                background: cat.bg,
                                padding: '4px 12px', borderRadius: '50px',
                            }}>
                                {cat.count}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
