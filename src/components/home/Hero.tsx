import Link from 'next/link';
import { getSiteSettings } from '@/lib/siteSettings';
import HomeHeroSlider from './HomeHeroSlider';
import HeroInquiryForm from './HeroInquiryForm';

export default async function HeroSection() {
    const settings = await getSiteSettings();
    const slides = settings.heroSlides || [];

    return (
        <section style={{
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            background: '#0a0f2e', // Fallback
            overflow: 'hidden',
        }}>
            {/* Dynamic Slider Background */}
            <HomeHeroSlider slides={slides} />

            {/* Animated background orbs */}
            <div style={{
                position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
                zIndex: 1,
            }}>
                <div style={{
                    position: 'absolute', top: '10%', right: '10%',
                    width: '500px', height: '500px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
                }} />
                {/* Grid pattern overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                }} />
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '140px 24px 80px', position: 'relative', zIndex: 2, width: '100%' }}>
                <div className="rg-2" style={{ gap: '60px', alignItems: 'center', display: 'grid', gridTemplateColumns: '1.2fr 1fr' }}>
                    {/* Left: Content */}
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)',
                            borderRadius: '50px', padding: '6px 16px', marginBottom: '28px',
                        }}>
                            <span style={{ fontSize: '12px', color: '#d4af37', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                                🏆 Agra's #1 Real Estate Platform
                            </span>
                        </div>

                        <h1 style={{
                            fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
                            fontWeight: 800,
                            lineHeight: 1.15,
                            color: '#ffffff',
                            margin: '0 0 24px',
                            fontFamily: 'Georgia, "Times New Roman", serif',
                        }}>
                            Your Path to a{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #d4af37, #f5d060)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                Perfect Home
                            </span>{' '}
                            Starts Here
                        </h1>

                        <p style={{
                            fontSize: '18px', color: 'rgba(255,255,255,0.85)',
                            lineHeight: 1.8, margin: '0 0 40px', maxWidth: '520px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}>
                            Expert guidance for residential plots, luxury villas, and commercial spaces in Agra. Trusted by thousands of happy families.
                        </p>

                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', fontSize: '20px' }}>✓</div>
                                <span style={{ color: '#fff', fontWeight: 500 }}>Verified Listings</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', fontSize: '20px' }}>✓</div>
                                <span style={{ color: '#fff', fontWeight: 500 }}>Expert Advice</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
                            <Link href="/properties" style={{
                                background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                                padding: '14px 28px', borderRadius: '12px', fontWeight: 600, fontSize: '15px', textDecoration: 'none',
                            }}>
                                Explore Properties →
                            </Link>
                        </div>
                    </div>

                    {/* Right: Inquiry Form */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <HeroInquiryForm />
                    </div>
                </div>

                {/* Stats row below */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px',
                    marginTop: '80px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px'
                }}>
                    {[
                        { number: '500+', label: 'Happy Families', icon: '🏠' },
                        { number: '12+', label: 'Years Experience', icon: '📅' },
                        { number: '98%', label: 'Success Rate', icon: '⭐' },
                        { number: '50+', label: 'Expert Agents', icon: '👥' },
                    ].map((stat, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '1.8rem', fontWeight: 800, color: '#d4af37',
                                marginBottom: '4px',
                            }}>
                                {stat.number}
                            </div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Scroll indicator */}
                <div style={{ textAlign: 'center', marginTop: '60px' }}>
                    <div style={{
                        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                        color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '1px',
                        textTransform: 'uppercase',
                    }}>
                        <span>Scroll to explore</span>
                        <div style={{
                            width: '2px', height: '30px',
                            background: 'linear-gradient(to bottom, rgba(212,175,55,0.8), transparent)',
                            borderRadius: '2px',
                        }} />
                    </div>
                </div>
            </div>
        </section>
    );
}
