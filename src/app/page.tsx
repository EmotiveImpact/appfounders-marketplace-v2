import HeroSection from '@/components/ui/hero-section';
import TrendingApps from '@/components/marketplace/trending-apps';
import Testimonials from '@/components/ui/testimonials';
import FAQSection from '@/components/ui/faq-section';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />
        <TrendingApps />
        <Testimonials />
        <FAQSection />
      </main>
    </div>
  );
}
