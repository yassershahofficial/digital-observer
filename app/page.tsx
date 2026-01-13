import HeroSection from '@/components/HeroSection';
import VCRStation from '@/components/VCRStation';

export default function Home() {
  return (
    <main className="relative">
      {/* Hero Section - Starry Night Background */}
      <HeroSection />
      
      {/* VCR Station Section */}
      <VCRStation />
    </main>
  );
}
