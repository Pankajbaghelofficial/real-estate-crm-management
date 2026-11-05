import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/siteSettings';
import { BUDGET_OPTIONS, PROPERTY_TYPES, propertiesHref } from '@/lib/propertySearch';
import HomeHeroSlider from '@/components/home/HomeHeroSlider';
import HomeSearch from '@/components/home/HomeSearch';
import HeroInquiryForm from '@/components/home/HeroInquiryForm';
import PropertyCard from '@/components/home/PropertyCard';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import Testimonials from '@/components/home/Testimonials';
import styles from '@/components/home/home.module.css';

// Rendered per request so DB content (featured properties / posts) is never a stale build-time snapshot.
export const dynamic = 'force-dynamic';

const CARD_SELECT = {
    id: true, title: true, price: true, location: true, area_size: true,
    property_type: true, bedrooms: true, is_featured: true,
    images: { take: 1, select: { image_url: true } },
} as const;

const TYPE_META: Record<string, { label: string; icon: string; tint: string }> = {
    Residential: { label: 'Residential Homes', icon: '🏠', tint: '#e8f0fe' },
    Villa: { label: 'Villas & Bungalows', icon: '🏡', tint: '#f3e8ff' },
    Plot: { label: 'Plots / Land', icon: '🗺️', tint: '#e6f7ef' },
    Commercial: { label: 'Commercial Spaces', icon: '🏢', tint: '#fff4e0' },
    Shop: { label: 'Shops & Showrooms', icon: '🏬', tint: '#ffe9ec' },
};

const EXPLORE = [
    { title: 'Buy a Home', text: 'Flats, houses & builder floors', icon: '🔑', href: propertiesHref({ category: 'Residential' }) },
    { title: 'Luxury Villas', text: 'Independent villas & bungalows', icon: '🏡', href: propertiesHref({ category: 'Villa' }) },
    { title: 'Plots / Land', text: 'Residential & investment plots', icon: '🗺️', href: propertiesHref({ category: 'Plot' }) },
    { title: 'Commercial', text: 'Offices & business spaces', icon: '🏢', href: propertiesHref({ category: 'Commercial' }) },
    { title: 'Shops', text: 'Prime retail locations', icon: '🏬', href: propertiesHref({ category: 'Shop' }) },
    { title: 'Sell / Rent Out', text: 'List your property for free', icon: '📢', href: '/contact' },
];

function SectionHead({ title, sub, href, linkText = 'View all' }: { title: string; sub?: string; href?: string; linkText?: string }) {
    return (
        <div className={styles.secHead}>
            <div>
                <h2 className={styles.secTitle}>{title}</h2>
                {sub && <p className={styles.secSub}>{sub}</p>}
            </div>
            {href && <Link href={href} className={styles.secLink}>{linkText} →</Link>}
        </div>
    );
}

export default async function Home() {
    const [settings, featured, latest, typeCounts, localityCounts, totalCount, blogs] = await Promise.all([
        getSiteSettings(),
        prisma.property.findMany({
            where: { status: 'Published', is_featured: true },
            orderBy: { created_at: 'desc' }, take: 10, select: CARD_SELECT,
        }),
        prisma.property.findMany({
            where: { status: 'Published' },
            orderBy: { created_at: 'desc' }, take: 10, select: CARD_SELECT,
        }),
        prisma.property.groupBy({
            by: ['property_type'], where: { status: 'Published' }, _count: { _all: true },
        }),
        prisma.property.groupBy({
            by: ['location'], where: { status: 'Published' }, _count: { _all: true },
            orderBy: { _count: { location: 'desc' } }, take: 8,
        }),
        prisma.property.count({ where: { status: 'Published' } }),
        prisma.blogPost.findMany({
            where: { status: 'Published' },
            orderBy: { created_at: 'desc' }, take: 3,
            select: { id: true, title: true, slug: true, featured_image: true, created_at: true, category: { select: { category_name: true } } },
        }),
    ]);

    const countByType = new Map(typeCounts.map(t => [t.property_type, t._count._all]));
    const types = [...PROPERTY_TYPES, ...typeCounts.map(t => t.property_type).filter(t => !(PROPERTY_TYPES as readonly string[]).includes(t))];
    const localities = localityCounts.map(l => ({ name: l.location, count: l._count._all }));
    const slides = [...(settings.heroSlides || [])].sort((a, b) => a.order - b.order);

    return (
        <div className={styles.page}>
            {/* ── Hero + search ─────────────────────────────── */}
            <section className={styles.hero}>
                <HomeHeroSlider slides={slides} />
                <div className={styles.heroInner}>
                    <h1 className={styles.heroTitle}>
                        Find your perfect property in <span>{settings.address.split(',')[0] || 'your city'}</span>
                    </h1>
                    <p className={styles.heroSub}>
                        {totalCount > 0 ? `${totalCount}+ verified listings` : 'Verified listings'} · Homes, villas, plots, shops &amp; commercial spaces
                    </p>
                    <HomeSearch localities={localities.map(l => l.name)} />
                </div>
            </section>

            {/* ── Explore options ───────────────────────────── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <SectionHead title="Get started with exploring real estate options" />
                    <div className={styles.exploreGrid}>
                        {EXPLORE.map(e => (
                            <Link key={e.title} href={e.href} className={styles.exploreCard}>
                                <span className={styles.exploreIcon} aria-hidden="true">{e.icon}</span>
                                <span className={styles.exploreTitle}>{e.title}</span>
                                <span className={styles.exploreText}>{e.text}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Featured carousel ─────────────────────────── */}
            {featured.length > 0 && (
                <section className={`${styles.section} ${styles.sectionAlt}`}>
                    <div className={styles.container}>
                        <SectionHead title="Handpicked properties" sub="Premium listings recommended by our experts" href="/properties" />
                        <div className={styles.carousel}>
                            {featured.map(p => <PropertyCard key={p.id} p={p} />)}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Property types ────────────────────────────── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <SectionHead title="Apartments, villas, plots and more" sub="Browse properties by type" />
                    <div className={styles.typeGrid}>
                        {types.map(t => {
                            const meta = TYPE_META[t] || { label: t, icon: '🏘️', tint: '#eef1f6' };
                            const n = countByType.get(t) || 0;
                            return (
                                <Link key={t} href={propertiesHref({ category: t })} className={styles.typeCard} style={{ background: meta.tint }}>
                                    <span className={styles.typeIcon} aria-hidden="true">{meta.icon}</span>
                                    <span className={styles.typeName}>{meta.label}</span>
                                    <span className={styles.typeCount}>{n} {n === 1 ? 'Property' : 'Properties'}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Newly added carousel ──────────────────────── */}
            <section className={`${styles.section} ${styles.sectionAlt}`}>
                <div className={styles.container}>
                    <SectionHead title="Newly added properties" sub="Fresh listings, updated daily" href="/properties" />
                    {latest.length > 0 ? (
                        <div className={styles.carousel}>
                            {latest.map(p => <PropertyCard key={p.id} p={p} />)}
                        </div>
                    ) : (
                        <div className={styles.empty}>No properties listed yet. Please check back soon.</div>
                    )}
                </div>
            </section>

            {/* ── Budget ────────────────────────────────────── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <SectionHead title="Properties by budget" sub="Choose a price range that works for you" />
                    <div className={styles.chipRow}>
                        {BUDGET_OPTIONS.map(b => (
                            <Link key={b.value} href={propertiesHref({ budget: b.value })} className={styles.chip}>{b.label}</Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Localities ────────────────────────────────── */}
            {localities.length > 0 && (
                <section className={`${styles.section} ${styles.sectionAlt}`}>
                    <div className={styles.container}>
                        <SectionHead title="Explore popular localities" sub="Most listed areas on our platform" />
                        <div className={styles.locGrid}>
                            {localities.map(l => (
                                <Link key={l.name} href={propertiesHref({ q: l.name })} className={styles.locCard}>
                                    <span className={styles.locPin} aria-hidden="true">📍</span>
                                    <span>
                                        <span className={styles.locName}>{l.name}</span>
                                        <span className={styles.locCount}>{l.count} {l.count === 1 ? 'property' : 'properties'}</span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Sell / post property banner ───────────────── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.postBanner}>
                        <div>
                            <span className={styles.postEyebrow}>Sell or rent faster</span>
                            <h2 className={styles.postTitle}>Post your property for <span>FREE</span></h2>
                            <ul className={styles.postList}>
                                <li>✓ Reach genuine buyers &amp; tenants</li>
                                <li>✓ Dedicated relationship manager</li>
                                <li>✓ Help with pricing, paperwork &amp; site visits</li>
                            </ul>
                            <div className={styles.postActions}>
                                <Link href="/contact" className={styles.postBtn}>Contact us</Link>
                                {settings.phone && <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} className={styles.postBtnGhost}>Call {settings.phone}</a>}
                            </div>
                        </div>
                        <HeroInquiryForm />
                    </div>
                </div>
            </section>

            {/* ── Blog insights ─────────────────────────────── */}
            {blogs.length > 0 && (
                <section className={`${styles.section} ${styles.sectionAlt}`}>
                    <div className={styles.container}>
                        <SectionHead title="Insights & articles" sub="News, guides and tips for property buyers" href="/blogs" linkText="Read all" />
                        <div className={styles.blogGrid}>
                            {blogs.map(b => (
                                <Link key={b.id} href={`/blogs/${b.slug}`} className={styles.blogCard}>
                                    <div className={styles.blogImg}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={b.featured_image || 'https://images.unsplash.com/photo-1574880534246-86d7e6ce3496?q=80&w=800'} alt={b.title} loading="lazy" />
                                    </div>
                                    <div className={styles.blogBody}>
                                        <span className={styles.blogCat}>{b.category?.category_name}</span>
                                        <h3 className={styles.blogTitle}>{b.title}</h3>
                                        <span className={styles.blogDate}>
                                            {b.created_at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <WhyChooseUs />
            <Testimonials />
        </div>
    );
}
