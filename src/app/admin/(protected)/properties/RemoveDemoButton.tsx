'use client';

import { useState } from 'react';
import { removeDemoListings } from './actions';

export default function RemoveDemoButton({ count }: { count: number }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    async function onClick() {
        if (!window.confirm(`Delete all ${count} demo listings? Real listings are not affected. This cannot be undone.`)) return;
        setBusy(true);
        setError('');
        try {
            await removeDemoListings();
        } catch {
            setError('Could not remove demo listings. Please try again.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" onClick={onClick} disabled={busy} style={{
                padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca', cursor: busy ? 'wait' : 'pointer',
            }}>
                {busy ? 'Removing…' : `🧹 Remove ${count} demo listings`}
            </button>
            {error && <span role="alert" style={{ color: '#dc2626', fontSize: '12px' }}>{error}</span>}
        </span>
    );
}
