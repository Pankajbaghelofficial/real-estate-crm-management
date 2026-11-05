'use client';

import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { submitLead } from '../../actions/leads';
import { useState } from 'react';
import { formatListingPrice, pricePerSqft, splitAmenities } from '@/lib/propertySearch';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200';

export default function PropertyDetailsClient({ property }: { property: any }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Extract real images or provide a single fallback
    const hasImages = property.images && property.images.length > 0;
    const allImages = hasImages
        ? property.images.map((img: any) => img.image_url)
        : [DEFAULT_IMAGE];

    async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        const formData = new FormData(e.currentTarget);
        const result = await submitLead(formData);

        if (result.success) {
            setStatus('success');
            (e.target as HTMLFormElement).reset(); // Clear form
        } else {
            setStatus('error');
            setErrorMessage(result.error || 'Something went wrong.');
        }
    }

    const amenitiesList = splitAmenities(property.amenities);
    const isRent = property.listing_type === 'Rent';
    const ppsf = pricePerSqft(property.price, property.area_sqft, property.listing_type);
    const city = property.city || 'Agra';
    const floor = property.floor_no === null || property.floor_no === undefined ? null
        : property.floor_no === 0 ? 'Ground' : property.floor_no < 0 ? `Basement ${-property.floor_no}` : String(property.floor_no);
    const floorText = floor && property.total_floors ? `${floor} of ${property.total_floors}` : floor || (property.total_floors ? `${property.total_floors} floors` : null);
    const extraDetails: [string, string | number | null | undefined][] = [
        ['Listing For', isRent ? 'Rent' : 'Sale'],
        ['Area (sq.ft)', property.area_sqft ? Number(property.area_sqft).toLocaleString('en-IN') : null],
        ['Price per sq.ft', ppsf],
        ['Furnishing', property.furnishing],
        ['Possession', property.possession_status],
        ['Property Age', property.property_age],
        ['Floor', floorText],
        ['Facing', property.facing],
        ['Balconies', property.balconies],
        ['Ownership', property.ownership],
        ['RERA No.', property.rera_number],
    ];
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([property.location, city].join(', '))}`;

    const openLightbox = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLightboxIndex(index);
        setIsLightboxOpen(true);
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
        document.body.style.overflow = 'auto';
    };

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    return (
        <div className="detail-page-bg">
            <div className="container">
                {/* Header Section */}
                <div className="detail-header" style={{ paddingTop: '100px' }}>
                    <div className="detail-header-flex">
                        <div className="detail-title-col">
                            <span style={{ display: 'inline-block', padding: '4px 10px', background: '#e2e8f0', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>{isRent ? 'For Rent' : 'For Sale'}</span>
                            <span style={{ display: 'inline-block', marginLeft: '8px', padding: '4px 10px', background: '#1a1a2e', color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>{property.property_type}</span>
                            {property.is_verified && (
                                <span style={{ display: 'inline-block', marginLeft: '8px', padding: '4px 10px', background: '#dcfce7', color: '#15803d', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>✔ Verified</span>
                            )}
                            <h1>{property.title}</h1>
                            <p>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                {property.location}
                            </p>
                        </div>
                        <div className="detail-price-col">
                            <span className="price-text" suppressHydrationWarning>
                                {isRent ? `₹${property.price.toLocaleString('en-IN')}` : formatListingPrice(property.price, property.listing_type)}{' '}
                                <span className="price-sub">{isRent ? '/ month' : ppsf ? `· ${ppsf}` : '/ total'}</span>
                            </span>
                            <div className="action-buttons-row">
                                <button className="action-btn-pill">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                    Share
                                </button>
                                <button className="action-btn-pill">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                    Favorite
                                </button>
                                <button className="action-btn-pill">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                    Print
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Style Gallery */}
                <div className="product-gallery">
                    <div
                        className="pg-main-image"
                        style={{ backgroundImage: `url(${allImages[activeImageIndex]})` }}
                        onClick={(e) => openLightbox(activeImageIndex, e)}
                    >
                        <div className="pg-expand-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                        </div>
                    </div>

                    {allImages.length > 1 && (
                        <div className="pg-thumbnails-row">
                            {allImages.map((src: string, idx: number) => (
                                <div
                                    key={idx}
                                    className={`pg-thumbnail ${idx === activeImageIndex ? 'active' : ''}`}
                                    style={{ backgroundImage: `url(${src})` }}
                                    onClick={() => setActiveImageIndex(idx)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Overview Bar */}
                <div className="overview-bar">
                    <div className="overview-item">
                        <span className="overview-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            Updated On
                        </span>
                        <span className="overview-value" suppressHydrationWarning>{new Date(property.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="overview-item">
                        <span className="overview-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            Building
                        </span>
                        <span className="overview-value">{property.property_type}</span>
                    </div>
                    <div className="overview-item">
                        <span className="overview-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            Property ID
                        </span>
                        <span className="overview-value">{property.id}</span>
                    </div>
                    {property.bedrooms > 0 && (
                        <div className="overview-item">
                            <span className="overview-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="14" width="18" height="8" rx="2" ry="2"></rect><path d="M5 14V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7"></path></svg>
                                Bedrooms
                            </span>
                            <span className="overview-value">{property.bedrooms}</span>
                        </div>
                    )}
                    {property.bathrooms > 0 && (
                        <div className="overview-item">
                            <span className="overview-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 12H16c-.7 2-2 3-4 3s-3.3-1-4-3H2.5"></path><path d="M5.5 5.1L2 12v6c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1z"></path></svg>
                                Bathrooms
                            </span>
                            <span className="overview-value">{property.bathrooms}</span>
                        </div>
                    )}
                    {property.area_size && (
                        <div className="overview-item">
                            <span className="overview-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                                Property Size
                            </span>
                            <span className="overview-value">{property.area_size}</span>
                        </div>
                    )}
                </div>

                <div className="property-detail-grid">
                    {/* Main Content Info */}
                    <div>
                        {/* Description Box */}
                        <div className="content-card">
                            <h3>Description</h3>
                            <div className="rich-desc" dangerouslySetInnerHTML={{ __html: property.description }} />
                        </div>

                        {/* Address Box */}
                        <div className="content-card">
                            <h3>Address</h3>
                            <div className="details-inner-grid">
                                <div className="detail-row"><span>Address:</span> <span>{property.location}</span></div>
                                {property.locality && <div className="detail-row"><span>Locality:</span> <span>{property.locality}</span></div>}
                                <div className="detail-row"><span>City:</span> <span>{city}</span></div>
                                <div className="detail-row"><span>State:</span> <span>Uttar Pradesh</span></div>
                                <div className="detail-row"><span>Country:</span> <span>India</span></div>
                            </div>
                            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="action-btn-pill" style={{ marginTop: '20px', background: '#11262d', color: '#fff', borderColor: '#11262d', display: 'inline-flex' }}>Open in Google Maps</a>
                        </div>

                        {/* Details Box */}
                        <div className="content-card">
                            <h3>Details</h3>
                            <div className="details-inner-grid">
                                <div className="detail-row"><span>Property Id:</span> <span>{property.id}</span></div>
                                <div className="detail-row"><span>{isRent ? 'Rent:' : 'Price:'}</span> <span suppressHydrationWarning>₹{property.price.toLocaleString('en-IN')}{isRent ? ' / month' : ''}</span></div>
                                <div className="detail-row"><span>Property Size:</span> <span>{property.area_size}</span></div>
                                <div className="detail-row"><span>Property Type:</span> <span>{property.property_type}</span></div>
                                {extraDetails.filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => (
                                    <div key={k} className="detail-row"><span>{k}:</span> <span>{v}</span></div>
                                ))}
                            </div>
                        </div>

                        {/* Features Box */}
                        {amenitiesList.length > 0 && (
                            <div className="content-card">
                                <h3>Features</h3>
                                <div className="features-cols">
                                    {amenitiesList.map((item: string, idx: number) => (
                                        <div key={idx} className="feature-item">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contact Sidebar */}
                    <aside id="enquire" style={{ scrollMarginTop: '90px' }}>
                        <div className="sidebar-card">
                            <div className="sidebar-tabs">
                                <div className="sidebar-tab active">Request Info</div>
                                <div className="sidebar-tab">Schedule a tour</div>
                            </div>

                            <div className="agent-profile">
                                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop" alt="Agent" className="agent-avatar" />
                                <div className="agent-info">
                                    <h4>{property.agent?.name || "Sampatti Kendra Agent"}</h4>
                                    <p>Real Estate Broker</p>
                                </div>
                            </div>


                            {status === 'success' && (
                                <div style={{ padding: '12px 16px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    Message sent successfully!
                                </div>
                            )}
                            {status === 'error' && (
                                <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                                    {errorMessage}
                                </div>
                            )}

                            <form onSubmit={handleFormSubmit} className="agent-form">
                                <input type="hidden" name="property_id" value={property.id} />
                                <input type="text" name="name" placeholder="Name" required style={{ transition: 'border-color 0.2s, box-shadow 0.2s', padding: '14px 16px' }} />
                                <input type="email" name="email" placeholder="Email" style={{ transition: 'border-color 0.2s, box-shadow 0.2s', padding: '14px 16px' }} />
                                <input type="tel" name="phone" placeholder="Phone" required style={{ transition: 'border-color 0.2s, box-shadow 0.2s', padding: '14px 16px' }} />
                                <textarea name="message" placeholder={`Hello,\nI am interested in [${property.title}]`} rows={4} style={{ transition: 'border-color 0.2s, box-shadow 0.2s', padding: '14px 16px', resize: 'vertical' }}></textarea>

                                <button type="submit" disabled={status === 'loading'} className="btn-dark-send" style={{ marginTop: '8px', padding: '16px' }}>
                                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                                </button>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                    <button type="button" className="btn-outline-action" style={{ margin: 0 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                        Call
                                    </button>

                                    <a href="https://wa.me/917983804875" target="_blank" rel="noopener noreferrer" className="btn-outline-action" style={{ margin: 0 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                        WhatsApp
                                    </a>
                                </div>
                            </form>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Lightbox Overlay */}
            {isLightboxOpen && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <button className="lightbox-close" onClick={closeLightbox}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    <button className="lightbox-nav lightbox-prev" onClick={prevImage}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>

                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={allImages[lightboxIndex]} alt={`Property Image ${lightboxIndex + 1}`} className="lightbox-image" />
                    </div>

                    <button className="lightbox-nav lightbox-next" onClick={nextImage}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>

                    <div className="lightbox-thumbnails" onClick={(e) => e.stopPropagation()}>
                        {allImages.map((src: string, idx: number) => (
                            <div
                                key={idx}
                                className={`lightbox-thumb ${idx === lightboxIndex ? 'active' : ''}`}
                                style={{ backgroundImage: `url(${src})` }}
                                onClick={() => setLightboxIndex(idx)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
