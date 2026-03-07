'use client';

import { useState } from 'react';
import { submitLead } from '../actions/leads';

const INFO_CARDS = [
    {
        icon: '📍',
        title: 'Our Office',
        lines: ['Sampatti Kendra HQ', 'Tajganj, Agra', 'Uttar Pradesh 282001, India'],
        color: '#2563eb', bg: '#eff6ff',
    },
    {
        icon: '📞',
        title: 'Phone & WhatsApp',
        lines: ['+91 79838 04875', 'Available Mon–Sat'],
        color: '#059669', bg: '#ecfdf5',
    },
    {
        icon: '✉️',
        title: 'Email Us',
        lines: ['info@sampattikendra.com', 'Reply within 24 hours'],
        color: '#7c3aed', bg: '#f5f3ff',
    },
    {
        icon: '🕐',
        title: 'Business Hours',
        lines: ['Mon – Sat: 9:00 AM – 7:00 PM', 'Sunday: Closed'],
        color: '#d97706', bg: '#fffbeb',
    },
];

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid #e8e8f0',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#f8f9ff',
    color: '#1a1a2e',
    transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 700,
    color: '#374151',
    display: 'block',
    marginBottom: '8px',
};

export default function ContactPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');
        const formData = new FormData(e.currentTarget);
        const result = await submitLead(formData);
        if (result.success) {
            setStatus('success');
            (e.target as HTMLFormElement).reset();
        } else {
            setStatus('error');
            setErrorMessage(result.error || 'Something went wrong.');
        }
    }

    return (
        <div>
            {/* ── Hero Banner ───────────────────────────── */}
            <section style={{
                background: 'linear-gradient(135deg, #0a0f2e 0%, #0d1b4b 50%, #1a2d6b 100%)',
                padding: '140px 24px 80px',
                position: 'relative', overflow: 'hidden', textAlign: 'center',
            }}>
                {/* Decorative orbs */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <div style={{
                        position: 'absolute', top: '-60px', right: '-80px',
                        width: '400px', height: '400px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-40px', left: '-60px',
                        width: '350px', height: '350px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
                    }} />
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }} />
                </div>

                <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
                    <span style={{
                        display: 'inline-block',
                        background: 'rgba(212,175,55,0.12)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: '#d4af37', fontWeight: 700,
                        fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
                        padding: '6px 16px', borderRadius: '50px', marginBottom: '20px',
                    }}>
                        📩 Get In Touch
                    </span>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3rem)',
                        fontWeight: 800, color: '#fff',
                        margin: '0 0 16px',
                        fontFamily: 'Georgia, serif', lineHeight: 1.2,
                    }}>
                        Let's Find Your{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #d4af37, #f5d060)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Perfect Property
                        </span>
                    </h1>
                    <p style={{
                        fontSize: '17px', color: 'rgba(255,255,255,0.65)',
                        lineHeight: 1.75, margin: 0,
                    }}>
                        Our Agra property experts are ready to help. Reach out for a free, no-obligation consultation today.
                    </p>
                </div>
            </section>

            {/* ── Info Cards ─────────────────────────────── */}
            <section style={{ background: '#f8f9ff', padding: '0 24px' }}>
                <div className="contact-info-cards" style={{
                    maxWidth: '1100px', margin: '0 auto',
                    gap: '20px',
                    transform: 'translateY(-48px)',
                }}>
                    {INFO_CARDS.map((card, i) => (
                        <div key={i} style={{
                            background: '#fff',
                            border: '1.5px solid #eef0f8',
                            borderRadius: '20px', padding: '28px 22px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.07)',
                            textAlign: 'center',
                        }}>
                            <div style={{
                                width: '56px', height: '56px',
                                background: card.bg, borderRadius: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '26px', margin: '0 auto 16px',
                            }}>
                                {card.icon}
                            </div>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0a0f2e', margin: '0 0 10px' }}>
                                {card.title}
                            </h3>
                            {card.lines.map((line, li) => (
                                <p key={li} style={{
                                    fontSize: '13px', color: li === 0 ? '#374151' : '#9ca3af',
                                    fontWeight: li === 0 ? 600 : 400, margin: '2px 0',
                                }}>
                                    {line}
                                </p>
                            ))}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Main Section: Form + Map ──────────────── */}
            <section style={{ background: '#f8f9ff', padding: '0 24px 100px' }}>

                <div className="contact-main-grid" style={{
                    maxWidth: '1100px', margin: '0 auto',
                    gap: '32px',
                }}>
                    {/* Contact Form */}
                    <div style={{
                        background: '#fff',
                        border: '1.5px solid #eef0f8',
                        borderRadius: '24px', padding: '40px 36px',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
                    }}>
                        <div style={{ marginBottom: '28px' }}>
                            <h2 style={{
                                fontSize: '22px', fontWeight: 800, color: '#0a0f2e',
                                margin: '0 0 6px', fontFamily: 'Georgia, serif',
                            }}>
                                Send a Message
                            </h2>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                                Fill in the form and we'll respond within a few hours.
                            </p>
                        </div>

                        {status === 'success' && (
                            <div style={{
                                background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                                borderRadius: '12px', padding: '16px 20px',
                                marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start',
                            }}>
                                <span style={{ fontSize: '20px' }}>✅</span>
                                <div>
                                    <p style={{ fontWeight: 700, color: '#15803d', margin: '0 0 2px', fontSize: '14px' }}>
                                        Message Sent Successfully!
                                    </p>
                                    <p style={{ color: '#16a34a', margin: 0, fontSize: '13px' }}>
                                        Our team will get back to you within 24 hours.
                                    </p>
                                </div>
                            </div>
                        )}

                        {status === 'error' && (
                            <div style={{
                                background: '#fef2f2', border: '1.5px solid #fecaca',
                                borderRadius: '12px', padding: '16px 20px', marginBottom: '24px',
                            }}>
                                <p style={{ color: '#dc2626', margin: 0, fontSize: '14px', fontWeight: 600 }}>
                                    ❌ {errorMessage}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gap: '18px' }}>
                                <div>
                                    <label style={labelStyle}>Full Name *</label>
                                    <input
                                        type="text" name="name" required
                                        placeholder="Rahul Sharma"
                                        style={inputStyle}
                                    />
                                </div>

                                <div className="rg-2" style={{ gap: '16px' }}>

                                    <div>
                                        <label style={labelStyle}>Phone Number *</label>
                                        <input
                                            type="tel" name="phone" required
                                            placeholder="+91 90000 00000"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Email Address</label>
                                        <input
                                            type="email" name="email"
                                            placeholder="you@email.com"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Property Interest</label>
                                    <select name="propertyType" style={{ ...inputStyle, cursor: 'pointer' }}>
                                        <option value="">Select type...</option>
                                        <option value="Residential Plot">Residential Plot</option>
                                        <option value="Villa">Villa / Bungalow</option>
                                        <option value="Commercial">Commercial Space</option>
                                        <option value="Shop">Shop</option>
                                        <option value="Other">Just Exploring</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={labelStyle}>Your Message *</label>
                                    <textarea
                                        name="message" required rows={5}
                                        placeholder="Tell us about your requirements, budget, preferred location..."
                                        style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    style={{
                                        width: '100%', padding: '16px',
                                        background: status === 'loading'
                                            ? '#93a8d0'
                                            : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                                        color: '#fff', border: 'none',
                                        borderRadius: '12px', fontSize: '16px',
                                        fontWeight: 700, cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {status === 'loading' ? '⏳ Sending…' : '📨 Send Message'}
                                </button>

                                <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                                    🔒 Your information is secure and will not be shared.
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Right: Map + Extra info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Google Map Embed */}
                        <div style={{
                            borderRadius: '24px', overflow: 'hidden',
                            border: '1.5px solid #eef0f8',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
                            height: '340px',
                        }}>
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3549.6!2d78.0081!3d27.1767!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x397471f!2sAgra%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1234567890"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Sampatti Kendra Office Location"
                            />
                        </div>

                        {/* Quick Contact Options */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0a0f2e, #1a2d6b)',
                            borderRadius: '24px', padding: '32px 28px',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                        }}>
                            <h3 style={{
                                fontSize: '18px', fontWeight: 800, color: '#fff',
                                margin: '0 0 20px', fontFamily: 'Georgia, serif',
                            }}>
                                Quick Connect
                            </h3>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                <a
                                    href="https://wa.me/917983804875?text=Hello%20Sampatti%20Kendra%2C%20I%20am%20interested%20in%20a%20property.%20Please%20help%20me."
                                    target="_blank" rel="noopener noreferrer"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        background: 'rgba(37,211,102,0.12)',
                                        border: '1px solid rgba(37,211,102,0.3)',
                                        borderRadius: '14px', padding: '16px 18px',
                                        textDecoration: 'none', color: '#fff',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '12px',
                                        background: '#25D366',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                                        flexShrink: 0,
                                    }}>💬</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '14px' }}>WhatsApp</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Instant reply on WhatsApp</div>
                                    </div>
                                </a>

                                <a
                                    href="tel:+917983804875"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        background: 'rgba(37,99,235,0.12)',
                                        border: '1px solid rgba(37,99,235,0.3)',
                                        borderRadius: '14px', padding: '16px 18px',
                                        textDecoration: 'none', color: '#fff',
                                    }}
                                >
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '12px',
                                        background: '#2563eb',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                                        flexShrink: 0,
                                    }}>📞</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '14px' }}>Call Us</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>+91 79838 04875</div>
                                    </div>
                                </a>

                                <a
                                    href="mailto:info@sampattikendra.com"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        background: 'rgba(124,58,237,0.12)',
                                        border: '1px solid rgba(124,58,237,0.3)',
                                        borderRadius: '14px', padding: '16px 18px',
                                        textDecoration: 'none', color: '#fff',
                                    }}
                                >
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '12px',
                                        background: '#7c3aed',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                                        flexShrink: 0,
                                    }}>✉️</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '14px' }}>Email</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>info@sampattikendra.com</div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section >
        </div >
    );
}
