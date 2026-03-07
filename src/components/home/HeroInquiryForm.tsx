'use client';

import { useState } from 'react';
import { submitLead } from '@/app/actions/leads';

export default function HeroInquiryForm() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setStatus('loading');

        const formData = new FormData(e.currentTarget);
        const result = await submitLead(formData);

        if (result.success) {
            setStatus('success');
            (e.target as HTMLFormElement).reset();
        } else {
            setStatus('error');
            setMessage(result.error || 'Something went wrong');
        }
    }

    if (status === 'success') {
        return (
            <div style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                maxWidth: '450px'
            }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '20px' }}>Inquiry Received!</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Our team will contact you shortly.</p>
                <button
                    onClick={() => setStatus('idle')}
                    style={{
                        marginTop: '20px',
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Send another
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            padding: '28px',
            backdropFilter: 'blur(12px)',
            maxWidth: '450px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
            <h3 style={{ color: '#fff', margin: '0 0 4px', fontSize: '20px', fontWeight: 700 }}>Quick Inquiry</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 8px', fontSize: '14px' }}>Fill details to get a call back</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                    name="name"
                    type="text"
                    placeholder="Full Name"
                    required
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '15px'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                    name="phone"
                    type="tel"
                    placeholder="Phone Number"
                    required
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '15px'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <textarea
                    name="message"
                    placeholder="I am interested in..."
                    required
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '15px',
                        minHeight: '80px',
                        resize: 'none'
                    }}
                />
            </div>

            {status === 'error' && (
                <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{message}</p>
            )}

            <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                    background: 'linear-gradient(135deg, #d4af37, #f5d060)',
                    color: '#0a0f2e',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    marginTop: '8px'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {status === 'loading' ? 'Sending...' : 'Send Inquiry →'}
            </button>
        </form>
    );
}
