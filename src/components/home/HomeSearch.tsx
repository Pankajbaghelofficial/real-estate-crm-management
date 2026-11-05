'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BHK_OPTIONS, BUDGET_OPTIONS, propertiesHref } from '@/lib/propertySearch';
import styles from './home.module.css';

const TABS = [
    { label: 'Buy', category: '' },
    { label: 'Residential', category: 'Residential' },
    { label: 'Villas', category: 'Villa' },
    { label: 'Plots / Land', category: 'Plot' },
    { label: 'Commercial', category: 'Commercial' },
    { label: 'Shops', category: 'Shop' },
];

export default function HomeSearch({ localities }: { localities: string[] }) {
    const router = useRouter();
    const [tab, setTab] = useState(0);
    const [q, setQ] = useState('');
    const [budget, setBudget] = useState('');
    const [bhk, setBhk] = useState('');

    const category = TABS[tab].category;
    const showBhk = category === '' || category === 'Residential' || category === 'Villa';

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        router.push(propertiesHref({ q: q.trim(), category, budget, bhk: showBhk ? bhk : '' }));
    }

    return (
        <div className={styles.searchCard}>
            <div className={styles.tabs} role="tablist" aria-label="Property type">
                {TABS.map((t, i) => (
                    <button
                        key={t.label}
                        type="button"
                        role="tab"
                        aria-selected={tab === i}
                        className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`}
                        onClick={() => setTab(i)}
                    >
                        {t.label}
                    </button>
                ))}
                <Link href="/contact" className={styles.tabPost}>
                    Sell Property <span className={styles.freeBadge}>FREE</span>
                </Link>
            </div>

            {/* Plain GET form: still works before JS loads */}
            <form action="/properties" method="get" onSubmit={onSubmit} className={styles.searchForm}>
                {category && <input type="hidden" name="category" value={category} />}
                <div className={styles.searchInputWrap}>
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                    <input
                        name="q"
                        type="search"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        maxLength={100}
                        list="home-localities"
                        placeholder='Search "locality, project or landmark"'
                        aria-label="Search locality, project or landmark"
                        className={styles.searchInput}
                    />
                    <datalist id="home-localities">
                        {localities.map(l => <option key={l} value={l} />)}
                    </datalist>
                </div>
                <select name="budget" value={budget} onChange={e => setBudget(e.target.value)} aria-label="Budget" className={styles.searchSelect}>
                    <option value="">Any Budget</option>
                    {BUDGET_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
                {showBhk && (
                    <select name="bhk" value={bhk} onChange={e => setBhk(e.target.value)} aria-label="Bedrooms" className={styles.searchSelect}>
                        <option value="">Any BHK</option>
                        {BHK_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                )}
                <button type="submit" className={styles.searchBtn}>Search</button>
            </form>

            {localities.length > 0 && (
                <div className={styles.quickLinks}>
                    <span>Popular:</span>
                    {localities.slice(0, 5).map(l => (
                        <Link key={l} href={propertiesHref({ q: l, category })}>{l}</Link>
                    ))}
                </div>
            )}
        </div>
    );
}
