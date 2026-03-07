import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import { getSiteSettings } from '@/lib/siteSettings';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

// Dynamic metadata based on site settings
export async function generateMetadata(): Promise<Metadata> {
  const s = getSiteSettings();
  return {
    title: `${s.siteName} | Luxury Real Estate in Agra`,
    description: `Buy trusted residential and commercial properties, villas, and shops in Agra with ${s.siteName}. ${s.tagline}.`,
    openGraph: {
      title: `${s.siteName} | Luxury Real Estate`,
      description: `Find trusted real estate investments in Agra. ${s.tagline}`,
      url: 'https://sampattikendra.com',
      siteName: s.siteName,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: s.siteName,
      description: s.tagline,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = getSiteSettings();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: settings.siteName,
    '@id': 'https://sampattikendra.com',
    url: 'https://sampattikendra.com',
    telephone: settings.whatsapp,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address,
      addressLocality: 'Agra',
      addressRegion: 'UP',
      addressCountry: 'IN',
    },
  };

  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header settings={settings} />
        <main className="main-content">
          {children}
        </main>
        <Footer settings={settings} />
        <WhatsAppButton settings={settings} />
      </body>
    </html>
  );
}
