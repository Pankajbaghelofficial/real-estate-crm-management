import type { Prisma } from '@prisma/client';

// Shared by the admin form, the home-page search box (client) and the /properties listing (server).
// Keep this file free of server-only imports.

export const PROPERTY_TYPES = ['Residential', 'Villa', 'Commercial', 'Shop', 'Plot'] as const;
export const LISTING_TYPES = ['Sale', 'Rent'] as const;
export const FURNISHING_OPTIONS = ['Unfurnished', 'Semi-Furnished', 'Furnished'] as const;
export const POSSESSION_OPTIONS = ['Ready to Move', 'Under Construction'] as const;
export const PROPERTY_AGE_OPTIONS = ['New Construction', '0-1 Years', '1-5 Years', '5-10 Years', '10+ Years'] as const;
export const FACING_OPTIONS = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'] as const;
export const OWNERSHIP_OPTIONS = ['Freehold', 'Leasehold', 'Co-operative Society', 'Power of Attorney'] as const;
export const AMENITY_OPTIONS = [
    'Parking', 'Power Backup', 'Lift', '24x7 Security', 'CCTV', 'Gated Society', 'Park / Garden',
    'Gym', 'Swimming Pool', 'Club House', 'Water Supply', 'Gas Pipeline', 'Intercom', 'Vaastu Compliant',
] as const;

export interface BudgetOption {
    value: string; // used in the URL (?budget=...)
    label: string;
    min?: number;  // rupees, inclusive
    max?: number;  // rupees, inclusive
}

const LAKH = 100_000;
const CRORE = 10_000_000;

export const BUDGET_OPTIONS: BudgetOption[] = [
    { value: 'u25l', label: 'Under ₹25 Lac', max: 25 * LAKH },
    { value: '25l-50l', label: '₹25 – 50 Lac', min: 25 * LAKH, max: 50 * LAKH },
    { value: '50l-1cr', label: '₹50 Lac – 1 Cr', min: 50 * LAKH, max: CRORE },
    { value: '1cr-2cr', label: '₹1 – 2 Cr', min: CRORE, max: 2 * CRORE },
    { value: 'a2cr', label: 'Above ₹2 Cr', min: 2 * CRORE },
];

export const RENT_BUDGET_OPTIONS: BudgetOption[] = [
    { value: 'r-u10k', label: 'Under ₹10,000', max: 10_000 },
    { value: 'r-10k-20k', label: '₹10,000 – 20,000', min: 10_000, max: 20_000 },
    { value: 'r-20k-40k', label: '₹20,000 – 40,000', min: 20_000, max: 40_000 },
    { value: 'r-a40k', label: 'Above ₹40,000', min: 40_000 },
];

export const BHK_OPTIONS = [
    { value: '1', label: '1 BHK' },
    { value: '2', label: '2 BHK' },
    { value: '3', label: '3 BHK' },
    { value: '4', label: '4+ BHK' },
];

export const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'area_desc', label: 'Area: Largest first' },
] as const;

export const PAGE_SIZE = 24;

export type Listing = 'buy' | 'rent';

export interface PropertyFilters {
    listing?: Listing;
    q?: string;
    category?: string;
    budget?: BudgetOption;
    bhk?: number;
    furnishing?: string;
    possession?: string;
    verified?: boolean;
    sort: (typeof SORT_OPTIONS)[number]['value'];
    page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
    return (Array.isArray(v) ? v[0] : v ?? '').trim();
}

function oneOf<T extends string>(list: readonly T[], v: string): T | undefined {
    return list.find(x => x === v);
}

/** Validates untrusted query-string values; anything unknown is dropped. */
export function parsePropertyFilters(params: RawParams): PropertyFilters {
    const q = first(params.q).replace(/\s+/g, ' ').slice(0, 100);
    const category = first(params.category).slice(0, 50);
    const listingRaw = first(params.listing);
    const listing: Listing | undefined = listingRaw === 'rent' ? 'rent' : listingRaw === 'buy' ? 'buy' : undefined;
    const budgetRaw = first(params.budget);
    const budgets = listing === 'rent' ? RENT_BUDGET_OPTIONS : listing === 'buy' ? BUDGET_OPTIONS : [...BUDGET_OPTIONS, ...RENT_BUDGET_OPTIONS];
    const budget = budgets.find(b => b.value === budgetRaw);
    const bhkRaw = first(params.bhk);
    const bhk = BHK_OPTIONS.some(o => o.value === bhkRaw) ? Number(bhkRaw) : undefined;
    const sort = SORT_OPTIONS.find(s => s.value === first(params.sort))?.value ?? 'newest';
    const pageNum = parseInt(first(params.page), 10);
    const page = Number.isInteger(pageNum) && pageNum > 0 && pageNum <= 1000 ? pageNum : 1;

    return {
        listing,
        q: q || undefined,
        category: category && category !== 'All' ? category : undefined,
        budget,
        bhk,
        furnishing: oneOf(FURNISHING_OPTIONS, first(params.furnishing)),
        possession: oneOf(POSSESSION_OPTIONS, first(params.possession)),
        verified: first(params.verified) === '1' || undefined,
        sort,
        page,
    };
}

export function buildPropertyWhere(f: PropertyFilters): Prisma.PropertyWhereInput {
    const where: Prisma.PropertyWhereInput = { status: 'Published' };
    if (f.listing) where.listing_type = f.listing === 'rent' ? 'Rent' : 'Sale';
    if (f.category) where.property_type = f.category;
    if (f.q) {
        where.OR = [
            { location: { contains: f.q, mode: 'insensitive' } },
            { locality: { contains: f.q, mode: 'insensitive' } },
            { city: { contains: f.q, mode: 'insensitive' } },
            { title: { contains: f.q, mode: 'insensitive' } },
        ];
    }
    if (f.budget) {
        where.price = {
            ...(f.budget.min !== undefined ? { gte: f.budget.min } : {}),
            ...(f.budget.max !== undefined ? { lte: f.budget.max } : {}),
        };
    }
    if (f.bhk) where.bedrooms = f.bhk >= 4 ? { gte: 4 } : f.bhk;
    if (f.furnishing) where.furnishing = f.furnishing;
    if (f.possession) where.possession_status = f.possession;
    if (f.verified) where.is_verified = true;
    return where;
}

export function buildPropertyOrderBy(sort: PropertyFilters['sort']): Prisma.PropertyOrderByWithRelationInput[] {
    switch (sort) {
        case 'price_asc': return [{ price: 'asc' }, { id: 'desc' }];
        case 'price_desc': return [{ price: 'desc' }, { id: 'desc' }];
        case 'area_desc': return [{ area_sqft: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }];
        default: return [{ is_featured: 'desc' }, { created_at: 'desc' }, { id: 'desc' }];
    }
}

export interface HrefParams {
    listing?: string; q?: string; category?: string; budget?: string; bhk?: string | number;
    furnishing?: string; possession?: string; verified?: boolean; sort?: string; page?: number;
}

/** Query string for /properties with the given filters (empty/default values omitted). */
export function propertiesHref(f: HrefParams): string {
    const sp = new URLSearchParams();
    if (f.listing) sp.set('listing', f.listing);
    if (f.q) sp.set('q', f.q);
    if (f.category && f.category !== 'All') sp.set('category', f.category);
    if (f.budget) sp.set('budget', f.budget);
    if (f.bhk) sp.set('bhk', String(f.bhk));
    if (f.furnishing) sp.set('furnishing', f.furnishing);
    if (f.possession) sp.set('possession', f.possession);
    if (f.verified) sp.set('verified', '1');
    if (f.sort && f.sort !== 'newest') sp.set('sort', f.sort);
    if (f.page && f.page > 1) sp.set('page', String(f.page));
    const qs = sp.toString();
    return qs ? `/properties?${qs}` : '/properties';
}

/** The filters as plain href params (for building links that change one value). */
export function filtersToHref(f: PropertyFilters): HrefParams {
    return {
        listing: f.listing, q: f.q, category: f.category, budget: f.budget?.value, bhk: f.bhk,
        furnishing: f.furnishing, possession: f.possession, verified: f.verified, sort: f.sort,
    };
}

export function formatPrice(price: number): string {
    if (price >= CRORE) return `₹${(price / CRORE).toFixed(2).replace(/\.?0+$/, '')} Cr`;
    if (price >= LAKH) return `₹${(price / LAKH).toFixed(1).replace(/\.0$/, '')} Lac`;
    return `₹${price.toLocaleString('en-IN')}`;
}

export function formatListingPrice(price: number, listingType?: string | null): string {
    return listingType === 'Rent' ? `₹${price.toLocaleString('en-IN')}/month` : formatPrice(price);
}

export function pricePerSqft(price: number, areaSqft?: number | null, listingType?: string | null): string | null {
    if (listingType === 'Rent' || !areaSqft || areaSqft <= 0 || price <= 0) return null;
    return `₹${Math.round(price / areaSqft).toLocaleString('en-IN')}/sq.ft`;
}

/** Amenities are stored as a comma-separated string. */
export function splitAmenities(raw?: string | null): string[] {
    return (raw ?? '').split(',').map(a => a.trim()).filter(Boolean);
}
