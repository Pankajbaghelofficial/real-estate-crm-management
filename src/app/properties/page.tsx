import Link from 'next/link';
import { prisma } from '@/lib/prisma';


const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800';

function formatPriceUnit(price: number) {
    if (price >= 10000000) {
        return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
        return `₹${(price / 100000).toFixed(0)} Lac`;
    }
    return `₹${price.toLocaleString()}`;
}

export default async function PropertiesPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string }>;
}) {
    const { category } = await searchParams;

    const properties = await prisma.property.findMany({
        where: {
            status: 'Published',
            ...(category && category !== 'All' ? { property_type: category } : {})
        },
        orderBy: { created_at: 'desc' },
        include: { images: true },
    });

    const distinctCategories = await prisma.property.findMany({
        where: { status: 'Published' },
        distinct: ['property_type'],
        select: { property_type: true },
    });

    const categories = ['All', ...distinctCategories.map(c => c.property_type).sort()];

    return (
        <div className="page-wrapper">
            {/* Redesigned Hero Section */}
            <section className="properties-hero">
                <div className="container">
                    <h1>Explore Premium Properties</h1>
                    <p>Discover the finest residential and commercial properties in Agra</p>
                </div>
            </section>

            {/* Horizontal Filter Bar */}
            <div className="filter-container">
                <div className="container">
                    <div className="category-filter-bar">
                        {categories.map((cat) => {
                            const isActive = (category === cat) || (!category && cat === 'All');
                            const href = cat === 'All' ? '/properties' : `/properties?category=${encodeURIComponent(cat)}`;

                            return (
                                <Link
                                    key={cat}
                                    href={href}
                                    className={`filter-btn ${isActive ? 'active' : ''}`}
                                >
                                    {cat}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="container pb-16">
                <div className="mt-8 mb-4">
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Showing <b>{properties.length}</b> properties</p>
                </div>

                {/* Properties Grid */}
                <div className="property-grid">
                    {properties.map((prop) => (
                        <div key={prop.id} className="property-card">
                            <div className="property-image" style={{ backgroundImage: `url(${prop.images[0]?.image_url || DEFAULT_IMAGE})` }}>
                                <span className="property-badge">{prop.property_type}</span>
                            </div>
                            <div className="property-content">
                                <h3 className="property-title">{prop.title}</h3>

                                <div className="property-details-list">
                                    <div className="detail-item">
                                        <span>📍</span> {prop.location}
                                    </div>
                                    <div className="detail-item">
                                        <span>📏</span> {prop.area_size}
                                    </div>
                                </div>

                                <div className="property-price-row">
                                    <span className="price-label">Price Range</span>
                                    <span className="property-price-value">
                                        {formatPriceUnit(prop.price)}
                                    </span>
                                </div>

                                <Link href={`/properties/${prop.id}`} className="enquire-btn">
                                    Enquire Now
                                </Link>
                            </div>
                        </div>
                    ))}

                    {properties.length === 0 && (
                        <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '5rem 0' }}>
                            No properties found at the moment.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
