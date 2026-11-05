import Link from 'next/link';
import { formatPrice } from '@/lib/propertySearch';
import styles from './home.module.css';

export const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800';

export interface PropertyCardData {
    id: number;
    title: string;
    price: number;
    location: string;
    area_size: string;
    property_type: string;
    bedrooms: number | null;
    is_featured: boolean;
    images: { image_url: string }[];
}

export default function PropertyCard({ p }: { p: PropertyCardData }) {
    const img = p.images[0]?.image_url || DEFAULT_PROPERTY_IMAGE;
    const specs = [
        p.bedrooms ? `${p.bedrooms} BHK` : null,
        p.area_size || null,
    ].filter(Boolean);

    return (
        <Link href={`/properties/${p.id}`} className={styles.pCard}>
            <div className={styles.pImg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={p.title} loading="lazy" />
                <span className={styles.pType}>{p.property_type}</span>
                {p.is_featured && <span className={styles.pFeatured}>★ Featured</span>}
            </div>
            <div className={styles.pBody}>
                <div className={styles.pPrice}>{formatPrice(p.price)}</div>
                <h3 className={styles.pTitle}>{p.title}</h3>
                {specs.length > 0 && <div className={styles.pSpecs}>{specs.join(' · ')}</div>}
                <div className={styles.pLoc}>📍 {p.location}</div>
            </div>
        </Link>
    );
}
