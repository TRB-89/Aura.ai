import { motion } from 'framer-motion'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { TrustStrip } from '@/components/landing/TrustStrip'
import { ProductIntroSection } from '@/components/landing/ProductIntroSection'
import { StatementSection } from '@/components/landing/StatementSection'
import { FeatureShowcase } from '@/components/landing/FeatureShowcase'
import { CapabilityGrid } from '@/components/landing/CapabilityGrid'
import { TestimonialSection } from '@/components/landing/TestimonialSection'
import { FinalCtaSection } from '@/components/landing/FinalCtaSection'
import { LandingFooter } from '@/components/landing/LandingFooter'

interface LandingPageProps {
  onOpenApp?: () => void
}

export function LandingPage({ onOpenApp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#07080A] text-aura-cream font-sans overflow-x-hidden selection:bg-aura-bronze/30 selection:text-aura-cream">
      {/* Top Floating Navbar */}
      <LandingNavbar onOpenApp={onOpenApp} />

      {/* Main Long-form Storytelling Page */}
      <main className="relative z-10 flex flex-col">
        {/* 1. Hero Section with Golden Neural Wave */}
        <HeroSection onLaunch={onOpenApp} />

        {/* 2. Trust Strip */}
        <TrustStrip />

        {/* 3. Product Intro Section */}
        <ProductIntroSection onLaunch={onOpenApp} />

        {/* 4. Large Transition Statement Section */}
        <StatementSection onLaunch={onOpenApp} />

        {/* 5. Feature Showcase Sections */}
        <FeatureShowcase onExplore={() => onOpenApp?.()} />

        {/* 6. Capability Bento Grid */}
        <CapabilityGrid />

        {/* 7. Testimonial / Product Quote */}
        <TestimonialSection />

        {/* 8. Final CTA Section */}
        <FinalCtaSection onLaunch={onOpenApp} />
      </main>

      {/* 9. Minimal Luxury Footer */}
      <LandingFooter />
    </div>
  )
}
