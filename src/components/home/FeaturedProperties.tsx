import Link from 'next/link';
import { prisma } from '@/lib/prisma';


function formatPrice(price: number): string {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(0)} L`;
    return `₹${price.toLocaleString()}`;
}

export default async function FeaturedProperties() {
    const properties = await prisma.property.findMany({
        where: { status: 'Published', is_featured: true },
        take: 6,
        orderBy: { created_at: 'desc' },
        include: { images: { take: 1 } },
    });

    const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800';

    return (
        <section style={{ padding: '100px 0', background: '#ffffff' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '56px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <span style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                            color: '#92400e', fontWeight: 700,
                            fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
                            padding: '6px 16px', borderRadius: '50px', marginBottom: '14px',
                        }}>
                            ⭐ Premium Listings
                        </span>
                        <h2 style={{
                            fontSize: '2.4rem', fontWeight: 800, color: '#0a0f2e',
                            margin: 0, fontFamily: 'Georgia, serif',
                        }}>
                            Featured Properties
                        </h2>
                    </div>
                    <Link href="/properties" style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        color: '#2563eb', fontWeight: 700, fontSize: '14px',
                        textDecoration: 'none', border: '2px solid #dbeafe',
                        padding: '10px 20px', borderRadius: '10px',
                        background: '#eff6ff',
                    }}>
                        View All Properties →
                    </Link>
                </div>

                {properties.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '80px 24px',
                        background: '#f8f9ff', borderRadius: '20px',
                        border: '2px dashed #e8e8f0',
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏠</div>
                        <p style={{ color: '#6b7280', fontSize: '16px' }}>No featured properties yet. Add some from the admin panel!</p>
                    </div>
                ) : (
                    <div className="rg-3" style={{ gap: '28px' }}>
                        {properties.map((prop) => {
                            const imgUrl = prop.images[0]?.image_url || DEFAULT_IMAGE;
                            return (
                                <div key={prop.id} style={{
                                    background: '#fff', borderRadius: '20px',
                                    border: '1.5px solid #eef0f8',
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                                    transition: 'all 0.3s ease',
                                }}>
                                    {/* Image */}
                                    <div style={{
                                        position: 'relative', height: '220px', overflow: 'hidden',
                                    }}>
                                        <img
                                            src={imgUrl}
                                            alt={prop.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.4) 100%)',
                                        }} />
                                        {/* Badge */}
                                        <div style={{
                                            position: 'absolute', top: '16px', left: '16px',
                                            background: 'linear-gradient(135deg, #d4af37, #c9a227)',
                                            color: '#0a0f2e', padding: '4px 12px', borderRadius: '50px',
                                            fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                                        }}>
                                            {prop.property_type}
                                        </div>
                                        {/* Featured badge */}
                                        <div style={{
                                            position: 'absolute', top: '16px', right: '16px',
                                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                                            color: '#fff', padding: '4px 10px', borderRadius: '50px',
                                            fontSize: '11px', fontWeight: 600,
                                        }}>
                                            ⭐ Featured
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div style={{ padding: '20px' }}>
                                        <h3 style={{
                                            fontSize: '17px', fontWeight: 700, color: '#0a0f2e',
                                            margin: '0 0 6px', lineHeight: 1.3,
                                        }}>
                                            {prop.title}
                                        </h3>
                                        <p style={{
                                            fontSize: '13px', color: '#6b7280', margin: '0 0 14px',
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                        }}>
                                            📍 {prop.location}
                                        </p>

                                        {/* Area */}
                                        {prop.area_size && (
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                background: '#f5f6fa', padding: '4px 10px', borderRadius: '8px',
                                                fontSize: '12px', color: '#555', fontWeight: 500, marginBottom: '14px',
                                            }}>
                                                📐 {prop.area_size}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>Starting from</span>
                                                <div style={{
                                                    fontSize: '22px', fontWeight: 800, color: '#0a0f2e', lineHeight: 1,
                                                }}>
                                                    {formatPrice(prop.price)}
                                                </div>
                                            </div>
                                            <Link href={`/properties/${prop.id}`} style={{
                                                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                                                color: '#fff', padding: '10px 18px', borderRadius: '10px',
                                                fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                                            }}>
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
