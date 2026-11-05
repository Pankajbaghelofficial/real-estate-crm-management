import type { Prisma } from '@prisma/client';

// Shared by the home-page search box (client) and the /properties listing (server).
// Keep this file free of server-only imports.

export const PROPERTY_TYPES = ['Residential', 'Villa', 'Commercial', 'Shop', 'Plot'] as const;

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

export const BHK_OPTIONS = [
    { value: '1', label: '1 BHK' },
    { value: '2', label: '2 BHK' },
    { value: '3', label: '3 BHK' },
    { value: '4', label: '4+ BHK' },
];

export interface PropertyFilters {
    q?: string;
    category?: string;
    budget?: BudgetOption;
    bhk?: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
    return (Array.isArray(v) ? v[0] : v ?? '').trim();
}

/** Validates untrusted query-string values; anything unknown is dropped. */
export function parsePropertyFilters(params: RawParams): PropertyFilters {
    const q = first(params.q).replace(/\s+/g, ' ').slice(0, 100);
    const category = first(params.category).slice(0, 50);
    const budget = BUDGET_OPTIONS.find(b => b.value === first(params.budget));
    const bhkRaw = first(params.bhk);
    const bhk = BHK_OPTIONS.some(o => o.value === bhkRaw) ? Number(bhkRaw) : undefined;

    return {
        q: q || undefined,
        category: category && category !== 'All' ? category : undefined,
        budget,
        bhk,
    };
}

export function buildPropertyWhere(f: PropertyFilters): Prisma.PropertyWhereInput {
    const where: Prisma.PropertyWhereInput = { status: 'Published' };
    if (f.category) where.property_type = f.category;
    if (f.q) {
        where.OR = [
            { location: { contains: f.q, mode: 'insensitive' } },
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
    return where;
}

/** Query string for /properties with the given filters (empty values omitted). */
export function propertiesHref(f: { q?: string; category?: string; budget?: string; bhk?: string | number }): string {
    const sp = new URLSearchParams();
    if (f.q) sp.set('q', f.q);
    if (f.category && f.category !== 'All') sp.set('category', f.category);
    if (f.budget) sp.set('budget', f.budget);
    if (f.bhk) sp.set('bhk', String(f.bhk));
    const qs = sp.toString();
    return qs ? `/properties?${qs}` : '/properties';
}

export function formatPrice(price: number): string {
    if (price >= CRORE) return `₹${(price / CRORE).toFixed(2).replace(/\.?0+$/, '')} Cr`;
    if (price >= LAKH) return `₹${(price / LAKH).toFixed(1).replace(/\.0$/, '')} Lac`;
    return `₹${price.toLocaleString('en-IN')}`;
}
