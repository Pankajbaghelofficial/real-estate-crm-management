import HeroSection from '@/components/home/Hero';
import CategoriesSection from '@/components/home/CategoriesSection';
import FeaturedProperties from '@/components/home/FeaturedProperties';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import Testimonials from '@/components/home/Testimonials';
import CTASection from '@/components/home/CTASection';

// Rendered per request so DB content (featured properties / posts) is never a stale build-time snapshot.
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <CategoriesSection />
      <FeaturedProperties />
      <WhyChooseUs />
      <Testimonials />
      <CTASection />
    </div>
  );
}
