'use client';

import { useEffect, useRef } from 'react';

/** Collapsible on phones, open on wider screens. Closed (but tappable) before JS loads. */
export default function FilterPanel({ className, children }: { className?: string; children: React.ReactNode }) {
    const ref = useRef<HTMLDetailsElement>(null);
    useEffect(() => {
        if (ref.current && window.matchMedia('(min-width: 961px)').matches) ref.current.open = true;
    }, []);
    return <details ref={ref} className={className}>{children}</details>;
}
