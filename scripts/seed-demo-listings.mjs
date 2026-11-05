#!/usr/bin/env node
/*
 * Demo property listings for Agra (sample data for showing the site).
 *
 *   node scripts/seed-demo-listings.mjs            # add demo listings (only if none exist yet)
 *   node scripts/seed-demo-listings.mjs --remove   # delete every demo listing (is_demo = true)
 *
 * During `npm run vercel-build` it is called with --build: then it does nothing unless the
 * SEED_DEMO_LISTINGS environment variable is "1". It never touches real listings
 * (is_demo = false), never creates duplicates, and is safe to run repeatedly.
 * Admins can also remove all demo listings from Admin → Properties.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
try { require('dotenv/config'); } catch { /* optional */ }
const { PrismaClient } = require('@prisma/client');

const REMOVE = process.argv.includes('--remove');
const BUILD = process.argv.includes('--build');
const COUNT = 54;

// Property photos already committed in public/uploads.
const IMG = {
    shops: '/uploads/upload_1772177963149_ppia48bq5pk.png',
    house: '/uploads/upload_1772273648679_9tbbojcjpec.png',
    modern: '/uploads/upload_1772273681739_xvpe7j0ixoe.webp',
    park: '/uploads/upload_1772294874052_2tb8if8jsyn.jpg',
    villas: '/uploads/upload_1772294916292_5ywem5a2a34.jpg',
    gate: '/uploads/upload_1772294960280_ieevgxz7qxr.jpg',
};
const IMAGES_BY_TYPE = {
    Residential: [IMG.house, IMG.modern, IMG.park, IMG.villas],
    Villa: [IMG.modern, IMG.villas, IMG.gate, IMG.park],
    Plot: [IMG.gate, IMG.park, IMG.villas],
    Commercial: [IMG.shops, IMG.modern, IMG.gate],
    Shop: [IMG.shops, IMG.gate],
};

// Locality, sale price per sq.ft (₹) and monthly rent per sq.ft (₹), roughly realistic.
const LOCALITIES = [
    ['Kamla Nagar', 5200, 14], ['Dayal Bagh', 4800, 12], ['Sikandra', 3800, 10], ['Fatehabad Road', 5600, 15],
    ['Tajganj', 4500, 12], ['Shastripuram', 3400, 9], ['Sanjay Place', 9000, 45], ['Civil Lines', 6500, 18],
    ['Khandari', 4200, 11], ['Gailana', 3000, 8], ['Bodla', 3600, 9], ['Kalindi Vihar', 3200, 9],
    ['Shamshabad Road', 2800, 8], ['Agra Cantt', 6000, 16], ['Balkeshwar', 4600, 12], ['Kargil Chauraha', 3500, 9],
];

const AMENITY_SETS = {
    Residential: ['Parking', 'Power Backup', 'Lift', '24x7 Security', 'CCTV', 'Water Supply', 'Gated Society', 'Park / Garden', 'Intercom'],
    Villa: ['Parking', 'Power Backup', '24x7 Security', 'CCTV', 'Park / Garden', 'Gated Society', 'Club House', 'Swimming Pool', 'Vaastu Compliant'],
    Plot: ['Gated Society', 'Park / Garden', 'Water Supply', '24x7 Security', 'Vaastu Compliant'],
    Commercial: ['Parking', 'Power Backup', 'Lift', 'CCTV', '24x7 Security', 'Water Supply'],
    Shop: ['Parking', 'Power Backup', 'CCTV', 'Water Supply'],
};

// [type, listing, count]
const PLAN = [
    ['Residential', 'Sale', 16], ['Residential', 'Rent', 10], ['Villa', 'Sale', 7], ['Plot', 'Sale', 8],
    ['Commercial', 'Sale', 3], ['Commercial', 'Rent', 3], ['Shop', 'Sale', 4], ['Shop', 'Rent', 3],
];

// Small deterministic PRNG so every run produces the same data.
function mulberry32(seed) {
    return () => {
        seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const rand = mulberry32(20261105);
const pick = arr => arr[Math.floor(rand() * arr.length)];
const between = (a, b) => a + Math.floor(rand() * (b - a + 1));
const roundTo = (n, step) => Math.max(step, Math.round(n / step) * step);
const sample = (arr, n) => [...arr].sort(() => rand() - 0.5).slice(0, n);

function buildListing(type, listing, i) {
    const [locality, ppsf, rentPsf] = LOCALITIES[i % LOCALITIES.length];
    const isRent = listing === 'Rent';
    const furnishing = pick(['Unfurnished', 'Semi-Furnished', 'Furnished']);
    const facing = pick(['North', 'East', 'North-East', 'West', 'South', 'North-West']);
    const age = pick(['New Construction', '0-1 Years', '1-5 Years', '5-10 Years']);
    const p = {
        property_type: type, listing_type: listing, city: 'Agra', locality,
        location: `${pick(['Sector', 'Block', 'Phase'])} ${pick(['A', 'B', 'C', 'D', '2', '4', '7'])}, ${locality}, Agra`,
        bedrooms: 0, bathrooms: 0, balconies: null, floor_no: null, total_floors: null,
        furnishing: null, possession_status: 'Ready to Move', property_age: age, facing,
        ownership: 'Freehold', rera_number: null,
    };
    let title; let sqft;

    if (type === 'Residential') {
        const bhk = isRent ? between(1, 3) : between(1, 4);
        const kind = bhk >= 3 && rand() < 0.4 ? 'Independent House' : 'Apartment';
        sqft = roundTo(bhk * between(380, 520) + 150, 25);
        p.bedrooms = bhk; p.bathrooms = Math.max(1, bhk - (rand() < 0.5 ? 1 : 0)); p.balconies = between(1, 3);
        p.total_floors = kind === 'Apartment' ? between(4, 14) : between(2, 3);
        p.floor_no = kind === 'Apartment' ? between(0, p.total_floors) : 0;
        p.furnishing = furnishing;
        if (!isRent && rand() < 0.25) { p.possession_status = 'Under Construction'; p.property_age = 'New Construction'; }
        title = `${bhk} BHK ${kind} ${isRent ? 'for Rent' : 'for Sale'} in ${locality}`;
    } else if (type === 'Villa') {
        const bhk = between(3, 5);
        sqft = roundTo(between(2000, 4500), 50);
        p.bedrooms = bhk; p.bathrooms = bhk; p.balconies = between(2, 4); p.floor_no = 0; p.total_floors = between(2, 3);
        p.furnishing = pick(['Semi-Furnished', 'Furnished', 'Unfurnished']);
        if (rand() < 0.3) { p.possession_status = 'Under Construction'; p.property_age = 'New Construction'; }
        title = `${bhk} BHK ${pick(['Luxury', 'Independent', 'Duplex', 'Corner'])} Villa in ${locality}`;
    } else if (type === 'Plot') {
        const yards = roundTo(between(100, 500), 10);
        sqft = yards * 9;
        p.property_age = null; p.possession_status = 'Ready to Move';
        title = `${yards} Sq.Yd ${pick(['Residential', 'Corner', 'Park Facing', 'East Facing'])} Plot in ${locality}`;
        p.area_size = `${yards} sq.yd (${sqft.toLocaleString('en-IN')} sq.ft)`;
    } else if (type === 'Commercial') {
        sqft = roundTo(between(400, 3000), 50);
        p.floor_no = between(0, 4); p.total_floors = between(p.floor_no + 1, 6); p.bathrooms = between(1, 3);
        p.furnishing = pick(['Unfurnished', 'Semi-Furnished', 'Furnished']);
        title = `${pick(['Office Space', 'Commercial Space', 'Showroom Space'])} ${isRent ? 'on Rent' : 'for Sale'} in ${locality}`;
    } else {
        sqft = roundTo(between(150, 800), 10);
        p.floor_no = 0; p.total_floors = between(1, 4); p.bathrooms = rand() < 0.5 ? 1 : 0;
        title = `${pick(['Retail Shop', 'Main Road Shop', 'Corner Shop', 'Shop'])} ${isRent ? 'on Rent' : 'for Sale'} in ${locality}`;
    }

    // Rough price multipliers on the locality rate: land is cheaper, villas/shops/offices cost more.
    const sale = type === 'Plot' ? sqft * ppsf * 0.7 : type === 'Villa' ? sqft * ppsf * 1.15 : type === 'Shop' ? sqft * ppsf * 2.2 : type === 'Commercial' ? sqft * ppsf * 1.4 : sqft * ppsf;
    const rent = sqft * rentPsf * (type === 'Shop' ? 3 : type === 'Commercial' ? 1.6 : 1);
    const price = isRent ? roundTo(rent * (0.9 + rand() * 0.25), 500) : roundTo(sale * (0.9 + rand() * 0.25), 50_000);

    const amenities = sample(AMENITY_SETS[type], between(3, Math.min(7, AMENITY_SETS[type].length)));
    const imgs = sample(IMAGES_BY_TYPE[type], between(2, 3));
    const intro = {
        Residential: `Well-planned ${p.bedrooms} BHK ${title.includes('House') ? 'independent house' : 'apartment'} in ${locality}, one of Agra's sought-after neighbourhoods.`,
        Villa: `Spacious ${p.bedrooms} BHK villa with private parking and open green surroundings in ${locality}.`,
        Plot: `Clear-title plot in ${locality} with wide approach road, ideal for building your home or as an investment.`,
        Commercial: `Ready commercial space in ${locality} with good visibility and easy access, suitable for offices, clinics or coaching.`,
        Shop: `Shop on a busy stretch of ${locality} with steady footfall, suitable for retail, pharmacy or services.`,
    }[type];

    return {
        title,
        description:
            `<p>${intro}</p><ul>` +
            `<li>Area: ${sqft.toLocaleString('en-IN')} sq.ft</li>` +
            (p.furnishing ? `<li>${p.furnishing}</li>` : '') +
            `<li>${p.possession_status}</li><li>${facing} facing</li></ul>` +
            `<p><em>Demo listing: sample data for showcasing the website.</em></p>`,
        price,
        area_size: p.area_size ?? `${sqft.toLocaleString('en-IN')} sq.ft`,
        area_sqft: sqft,
        amenities: amenities.join(', '),
        is_featured: false,
        is_verified: false, // demo data is never marked verified
        is_demo: true,
        status: 'Published',
        created_at: new Date(Date.now() - between(0, 60) * 86_400_000 - between(0, 86_399) * 1000),
        images: imgs,
        ...Object.fromEntries(Object.entries(p).filter(([k]) => k !== 'area_size')),
    };
}

function buildAll() {
    const out = [];
    let i = 0;
    for (const [type, listing, n] of PLAN) {
        for (let k = 0; k < n; k++) out.push(buildListing(type, listing, i++));
    }
    // A handful of featured ones across types, so the home page carousel has variety.
    for (const idx of [0, 5, 16, 26, 28, 33, 41, 45]) if (out[idx]) out[idx].is_featured = true;
    return out.slice(0, COUNT);
}

async function main() {
    if (BUILD && process.env.SEED_DEMO_LISTINGS !== '1') {
        console.log('Demo listings: skipped (SEED_DEMO_LISTINGS is not "1").');
        return;
    }
    const prisma = new PrismaClient();
    try {
        if (REMOVE) {
            const { count } = await prisma.property.deleteMany({ where: { is_demo: true } });
            console.log(`Demo listings: removed ${count}.`);
            return;
        }
        const existing = await prisma.property.count({ where: { is_demo: true } });
        if (existing > 0) {
            console.log(`Demo listings: skipped (${existing} already exist).`);
            return;
        }
        const listings = buildAll();
        await prisma.$transaction(
            listings.map(({ images, ...data }) => prisma.property.create({
                data: { ...data, images: { create: images.map(image_url => ({ image_url })) } },
            })),
        );
        console.log(`Demo listings: created ${listings.length} Agra listings.`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(err => {
    console.error('Demo listings failed:', err.message);
    // Never fail a deployment because of demo data.
    process.exit(BUILD ? 0 : 1);
});
