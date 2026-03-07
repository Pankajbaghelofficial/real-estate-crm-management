'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await signIn('credentials', { redirect: false, email, password });
            if (res?.error) {
                setError('Invalid email or password. Please try again.');
            } else {
                router.push('/admin/dashboard');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', background: '#0a0f2e',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
            {/* ── Left Panel — Branding ── */}
            <div className="admin-login-left" style={{
                flex: 1, position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                padding: '48px',
                background: 'linear-gradient(135deg, #0a0f2e 0%, #0d1b4b 40%, #1a2d6b 100%)',
            }}>
                {/* Background image with overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200)',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    opacity: 0.15,
                }} />
                {/* Grid pattern */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                }} />
                {/* Gold orb */}
                <div style={{
                    position: 'absolute', top: '20%', right: '-80px',
                    width: '400px', height: '400px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                {/* Bottom text */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)',
                        borderRadius: '50px', padding: '6px 16px', marginBottom: '24px',
                    }}>
                        <span style={{ fontSize: '12px', color: '#d4af37', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                            🔐 Secure Admin Portal
                        </span>
                    </div>
                    <h2 style={{
                        fontSize: '2.4rem', fontWeight: 800, color: '#fff',
                        fontFamily: 'Georgia, serif', lineHeight: 1.2, margin: '0 0 16px',
                    }}>
                        Manage Your
                        <br />
                        <span style={{
                            background: 'linear-gradient(135deg, #d4af37, #f5d060)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>Real Estate Empire</span>
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '16px', lineHeight: 1.7, maxWidth: '380px' }}>
                        Full control over properties, blogs, leads, and settings — all in one elegant dashboard.
                    </p>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: '32px', marginTop: '40px' }}>
                        {[
                            { n: '500+', label: 'Properties' },
                            { n: '12+', label: 'Years Active' },
                            { n: '98%', label: 'Satisfaction' },
                        ].map((s, i) => (
                            <div key={i}>
                                <div style={{ fontSize: '22px', fontWeight: 800, color: '#d4af37', lineHeight: 1 }}>{s.n}</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '4px', fontWeight: 500 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Divider line at bottom */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
                }} />
            </div>

            {/* ── Right Panel — Login Form ── */}
            <div className="admin-login-right" style={{
                width: '480px', minWidth: '420px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f8f9ff', padding: '40px 48px',
                position: 'relative',
            }}>
                {/* Corner accent */}
                <div style={{
                    position: 'absolute', top: 0, right: 0,
                    width: '120px', height: '120px',
                    background: 'linear-gradient(135deg, transparent 50%, rgba(212,175,55,0.1) 50%)',
                }} />

                <div style={{ width: '100%', maxWidth: '380px' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '36px' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '16px',
                            background: 'linear-gradient(135deg, #0a0f2e, #1a2d6b)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '22px', marginBottom: '20px',
                            boxShadow: '0 8px 24px rgba(10,15,46,0.2)',
                        }}>
                            🏢
                        </div>
                        <h1 style={{
                            fontSize: '26px', fontWeight: 800, color: '#0a0f2e',
                            margin: '0 0 8px', fontFamily: 'Georgia, serif',
                        }}>
                            Welcome back
                        </h1>
                        <p style={{ fontSize: '15px', color: '#6b7280', margin: 0 }}>
                            Sign in to your admin dashboard
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '12px', padding: '12px 16px',
                            marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                            <span style={{ fontSize: '16px' }}>⚠️</span>
                            <p style={{ color: '#dc2626', fontSize: '14px', margin: 0, fontWeight: 500 }}>{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block', fontSize: '13px', fontWeight: 700,
                                color: '#374151', marginBottom: '8px', letterSpacing: '0.3px',
                            }}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                                    fontSize: '16px', pointerEvents: 'none',
                                }}>📧</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="Email"
                                    required
                                    style={{
                                        width: '100%', padding: '13px 14px 13px 42px',
                                        border: '1.5px solid #e5e7eb', borderRadius: '12px',
                                        fontSize: '14px', color: '#0a0f2e',
                                        background: '#fff', outline: 'none',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => {
                                        e.target.style.borderColor = '#d4af37';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '28px' }}>
                            <label style={{
                                display: 'block', fontSize: '13px', fontWeight: 700,
                                color: '#374151', marginBottom: '8px', letterSpacing: '0.3px',
                            }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                                    fontSize: '16px', pointerEvents: 'none',
                                }}>🔑</span>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    style={{
                                        width: '100%', padding: '13px 44px 13px 42px',
                                        border: '1.5px solid #e5e7eb', borderRadius: '12px',
                                        fontSize: '14px', color: '#0a0f2e',
                                        background: '#fff', outline: 'none',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => {
                                        e.target.style.borderColor = '#d4af37';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(p => !p)}
                                    style={{
                                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: '16px', color: '#9ca3af', padding: '2px',
                                    }}
                                    title={showPass ? 'Hide password' : 'Show password'}
                                >
                                    {showPass ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '15px',
                                background: loading
                                    ? 'rgba(10,15,46,0.5)'
                                    : 'linear-gradient(135deg, #0a0f2e 0%, #1a2d6b 100%)',
                                color: '#fff', border: 'none', borderRadius: '14px',
                                fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s', letterSpacing: '0.3px',
                                boxShadow: loading ? 'none' : '0 8px 24px rgba(10,15,46,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            }}
                        >
                            {loading ? (
                                <>
                                    <span style={{
                                        display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff', borderRadius: '50%',
                                        animation: 'spin 0.7s linear infinite',
                                    }} />
                                    Signing in…
                                </>
                            ) : (
                                <>🚀 Sign In to Dashboard</>
                            )}
                        </button>
                    </form>

                    {/* Footer note */}
                    <div style={{ marginTop: '28px', textAlign: 'center' }}>
                        <Link href="/" style={{
                            fontSize: '13px', color: '#9ca3af', textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                        }}>
                            ← Back to website
                        </Link>
                    </div>

                    {/* Security badge */}
                    <div style={{
                        marginTop: '28px', padding: '14px 16px',
                        background: '#fff', border: '1px solid #e5e7eb',
                        borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        <span style={{ fontSize: '20px' }}>🛡️</span>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0a0f2e' }}>Secure Connection</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Protected by NextAuth.js encryption</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @media (max-width: 768px) {
                    .admin-login-left { display: none !important; }
                    .admin-login-right { width: 100% !important; min-width: 0 !important; }
                }
            `}</style>
        </div>
    );
}
