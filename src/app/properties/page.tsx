import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
    BHK_OPTIONS, BUDGET_OPTIONS, FURNISHING_OPTIONS, PAGE_SIZE, POSSESSION_OPTIONS, PROPERTY_TYPES,
    RENT_BUDGET_OPTIONS, SORT_OPTIONS, buildPropertyOrderBy, buildPropertyWhere, filtersToHref,
    formatListingPrice, parsePropertyFilters, pricePerSqft, propertiesHref, type HrefParams,
} from '@/lib/propertySearch';
import { DEFAULT_PROPERTY_IMAGE } from '@/components/home/PropertyCard';
import styles from './listing.module.css';
import FilterPanel from './FilterPanel';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Properties for Sale & Rent | Sampatti Kendra',
    description: 'Search verified homes, villas, plots, shops and commercial properties for sale and rent.',
};

function floorLabel(floor: number | null, total: number | null): string | null {
    if (floor === null && !total) return null;
    const f = floor === null ? '' : floor === 0 ? 'Ground' : floor < 0 ? `Basement ${-floor}` : `${floor}`;
    if (f && total) return `${f} of ${total} floors`;
    return f ? `Floor ${f}` : `${total} floors`;
}

export default async function PropertiesPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const filters = parsePropertyFilters(await searchParams);
    const where = buildPropertyWhere(filters);
    const base = filtersToHref(filters);
    const href = (patch: Partial<HrefParams>) => propertiesHref({ ...base, ...patch, page: patch.page });

    const [total, properties, distinctTypes] = await Promise.all([
        prisma.property.count({ where }),
        prisma.property.findMany({
            where,
            orderBy: buildPropertyOrderBy(filters.sort),
            skip: (filters.page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            select: {
                id: true, title: true, price: true, location: true, locality: true, city: true,
                area_size: true, area_sqft: true, property_type: true, listing_type: true,
                bedrooms: true, bathrooms: true, furnishing: true, possession_status: true,
                floor_no: true, total_floors: true, is_featured: true, is_verified: true, created_at: true,
                images: { take: 1, select: { image_url: true } },
                _count: { select: { images: true } },
            },
        }),
        prisma.property.findMany({
            where: { status: 'Published' }, distinct: ['property_type'], select: { property_type: true },
        }),
    ]);

    const types = Array.from(new Set([...PROPERTY_TYPES, ...distinctTypes.map(t => t.property_type)]));
    const budgets = filters.listing === 'rent' ? RENT_BUDGET_OPTIONS : filters.listing === 'buy' ? BUDGET_OPTIONS : [...BUDGET_OPTIONS, ...RENT_BUDGET_OPTIONS];
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const from = total === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
    const to = Math.min(total, filters.page * PAGE_SIZE);

    const chips: { label: string; remove: Partial<HrefParams> }[] = [];
    if (filters.q) chips.push({ label: `“${filters.q}”`, remove: { q: undefined } });
    if (filters.category) chips.push({ label: filters.category, remove: { category: undefined } });
    if (filters.budget) chips.push({ label: filters.budget.label, remove: { budget: undefined } });
    if (filters.bhk) chips.push({ label: filters.bhk >= 4 ? '4+ BHK' : `${filters.bhk} BHK`, remove: { bhk: undefined } });
    if (filters.furnishing) chips.push({ label: filters.furnishing, remove: { furnishing: undefined } });
    if (filters.possession) chips.push({ label: filters.possession, remove: { possession: undefined } });
    if (filters.verified) chips.push({ label: 'Verified only', remove: { verified: undefined } });

    const heading = `${filters.category ? `${filters.category} properties` : 'Properties'} ${filters.listing === 'rent' ? 'for rent' : filters.listing === 'buy' ? 'for sale' : 'for sale & rent'}${filters.q ? ` in “${filters.q}”` : ''}`;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <nav className={styles.crumbs} aria-label="Breadcrumb">
                    <Link href="/">Home</Link> <span aria-hidden="true">›</span> <span>Properties</span>
                </nav>

                <div className={styles.listingTabs} role="tablist" aria-label="Listing type">
                    {[{ v: undefined, l: 'All' }, { v: 'buy', l: 'Buy' }, { v: 'rent', l: 'Rent' }].map(t => (
                        <Link
                            key={t.l}
                            role="tab"
                            aria-selected={filters.listing === t.v}
                            href={href({ listing: t.v, budget: undefined })}
                            className={`${styles.listingTab} ${filters.listing === t.v ? styles.listingTabActive : ''}`}
                        >
                            {t.l}
                        </Link>
                    ))}
                </div>

                <div className={styles.layout}>
                    {/* ── Filters (plain GET form: works without JavaScript) ── */}
                    <aside className={styles.sidebar}>
                        <FilterPanel className={styles.filterBox}>
                            <summary className={styles.filterSummary}>
                                Filters {chips.length > 0 && <span className={styles.filterCount}>{chips.length}</span>}
                            </summary>
                            <form method="get" action="/properties" className={styles.filterForm}>
                                {filters.listing && <input type="hidden" name="listing" value={filters.listing} />}
                                {filters.sort !== 'newest' && <input type="hidden" name="sort" value={filters.sort} />}

                                <label className={styles.fLabel} htmlFor="f-q">Locality / project</label>
                                <input id="f-q" name="q" type="search" defaultValue={filters.q} maxLength={100} placeholder="e.g. Kamla Nagar" className={styles.fInput} />

                                <fieldset className={styles.fGroup}>
                                    <legend className={styles.fLabel}>Property type</legend>
                                    <label className={styles.fRadio}><input type="radio" name="category" value="" defaultChecked={!filters.category} /> Any</label>
                                    {types.map(t => (
                                        <label key={t} className={styles.fRadio}>
                                            <input type="radio" name="category" value={t} defaultChecked={filters.category === t} /> {t}
                                        </label>
                                    ))}
                                </fieldset>

                                <label className={styles.fLabel} htmlFor="f-budget">Budget</label>
                                <select id="f-budget" name="budget" defaultValue={filters.budget?.value ?? ''} className={styles.fInput}>
                                    <option value="">Any budget</option>
                                    {budgets.map(b => <option key={b.value} value={b.value}>{b.label}{filters.listing ? '' : b.value.startsWith('r-') ? ' (rent)' : ''}</option>)}
                                </select>

                                <fieldset className={styles.fGroup}>
                                    <legend className={styles.fLabel}>Bedrooms</legend>
                                    <div className={styles.fPills}>
                                        <label className={styles.fPill}><input type="radio" name="bhk" value="" defaultChecked={!filters.bhk} /><span>Any</span></label>
                                        {BHK_OPTIONS.map(b => (
                                            <label key={b.value} className={styles.fPill}>
                                                <input type="radio" name="bhk" value={b.value} defaultChecked={String(filters.bhk ?? '') === b.value} /><span>{b.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>

                                <label className={styles.fLabel} htmlFor="f-furnishing">Furnishing</label>
                                <select id="f-furnishing" name="furnishing" defaultValue={filters.furnishing ?? ''} className={styles.fInput}>
                                    <option value="">Any</option>
                                    {FURNISHING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>

                                <label className={styles.fLabel} htmlFor="f-possession">Possession status</label>
                                <select id="f-possession" name="possession" defaultValue={filters.possession ?? ''} className={styles.fInput}>
                                    <option value="">Any</option>
                                    {POSSESSION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>

                                <label className={styles.fCheck}>
                                    <input type="checkbox" name="verified" value="1" defaultChecked={filters.verified} /> Verified properties only
                                </label>

                                <button type="submit" className={styles.fApply}>Apply filters</button>
                                {chips.length > 0 && <Link href={propertiesHref({ listing: filters.listing })} className={styles.fClear}>Clear all</Link>}
                            </form>
                        </FilterPanel>
                    </aside>

                    {/* ── Results ── */}
                    <section className={styles.results} aria-labelledby="results-heading">
                        <div className={styles.resultsHead}>
                            <div>
                                <h1 id="results-heading" className={styles.h1}>{heading}</h1>
                                <p className={styles.count}>
                                    {total === 0 ? 'No properties found' : `Showing ${from}–${to} of ${total} ${total === 1 ? 'property' : 'properties'}`}
                                </p>
                            </div>
                            <div className={styles.sortRow} aria-label="Sort by">
                                <span>Sort:</span>
                                {SORT_OPTIONS.map(o => (
                                    <Link key={o.value} href={href({ sort: o.value })}
                                        className={`${styles.sortLink} ${filters.sort === o.value ? styles.sortActive : ''}`}
                                        aria-current={filters.sort === o.value ? 'true' : undefined}>
                                        {o.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {chips.length > 0 && (
                            <div className={styles.chips}>
                                {chips.map(c => (
                                    <Link key={c.label} href={href(c.remove)} className={styles.chip} aria-label={`Remove filter ${c.label}`}>
                                        {c.label} <span aria-hidden="true">✕</span>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {properties.length === 0 ? (
                            <div className={styles.empty}>
                                <div className={styles.emptyIcon} aria-hidden="true">🔍</div>
                                <p><b>No properties match these filters.</b></p>
                                <p>Try removing a filter, or <Link href="/contact">tell us what you need</Link> and we&apos;ll find it for you.</p>
                            </div>
                        ) : (
                            <div className={styles.list}>
                                {properties.map(p => {
                                    const ppsf = pricePerSqft(p.price, p.area_sqft, p.listing_type);
                                    const place = [p.locality, p.city].filter(Boolean).join(', ') || p.location;
                                    const facts = [
                                        p.area_size ? { k: p.property_type === 'Plot' ? 'Plot area' : 'Area', v: p.area_size } : null,
                                        p.bedrooms ? { k: 'Bedrooms', v: `${p.bedrooms} BHK${p.bathrooms ? ` · ${p.bathrooms} Bath` : ''}` } : null,
                                        p.furnishing ? { k: 'Furnishing', v: p.furnishing } : null,
                                        p.possession_status ? { k: 'Status', v: p.possession_status } : null,
                                        floorLabel(p.floor_no, p.total_floors) ? { k: 'Floor', v: floorLabel(p.floor_no, p.total_floors)! } : null,
                                    ].filter((x): x is { k: string; v: string } => x !== null).slice(0, 4);
                                    return (
                                        <article key={p.id} className={styles.card}>
                                            <Link href={`/properties/${p.id}`} className={styles.cardImg} tabIndex={-1} aria-hidden="true">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={p.images[0]?.image_url || DEFAULT_PROPERTY_IMAGE} alt="" loading="lazy" />
                                                {p._count.images > 1 && <span className={styles.photoCount}>📷 {p._count.images}</span>}
                                                {p.is_featured && <span className={styles.featured}>★ Featured</span>}
                                            </Link>
                                            <div className={styles.cardBody}>
                                                <div className={styles.cardTop}>
                                                    <span className={styles.tag}>{p.listing_type === 'Rent' ? 'For Rent' : 'For Sale'} · {p.property_type}</span>
                                                    {p.is_verified && <span className={styles.verified}>✔ Verified</span>}
                                                </div>
                                                <h2 className={styles.cardTitle}><Link href={`/properties/${p.id}`}>{p.title}</Link></h2>
                                                <p className={styles.cardPlace}>📍 {place}</p>
                                                <div className={styles.priceRow}>
                                                    <span className={styles.price}>{formatListingPrice(p.price, p.listing_type)}</span>
                                                    {ppsf && <span className={styles.ppsf}>{ppsf}</span>}
                                                </div>
                                                {facts.length > 0 && (
                                                    <dl className={styles.facts}>
                                                        {facts.map(f => (
                                                            <div key={f.k}><dt>{f.k}</dt><dd>{f.v}</dd></div>
                                                        ))}
                                                    </dl>
                                                )}
                                                <div className={styles.cardActions}>
                                                    <span className={styles.posted}>Posted {p.created_at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    <Link href={`/properties/${p.id}#enquire`} className={styles.contactBtn}>Contact</Link>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <nav className={styles.pager} aria-label="Pagination">
                                {filters.page > 1 && <Link href={href({ page: filters.page - 1 })} className={styles.pageLink}>← Previous</Link>}
                                <span className={styles.pageInfo}>Page {filters.page} of {totalPages}</span>
                                {filters.page < totalPages && <Link href={href({ page: filters.page + 1 })} className={styles.pageLink}>Next →</Link>}
                            </nav>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
