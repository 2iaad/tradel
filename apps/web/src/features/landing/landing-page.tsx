import { CinematicFooter } from '@/features/landing/components/motion-footer';
import TestimonialMarqueeDemo from '@/features/landing/components/testimonial-marquee';

import { FaqSection } from '@/features/landing/components/faq-section';
import { Hero } from '@/features/landing/components/hero';
import { HomeAnimation } from '@/features/landing/components/home-animation';
import { HomeNav } from '@/features/landing/components/home-chrome';
import { IntroSection } from '@/features/landing/components/intro-section';
import { LighthouseSection } from '@/features/landing/components/lighthouse-section';
import { PartnersSection } from '@/features/landing/components/partners-section';
import { ProductStorySections } from '@/features/landing/components/product-story-sections';

export default function Home() {
    return (
        <>
            <div className="page-w" data-page-wrapper="">
                <main
                    id="top"
                    className="main-w overflow-clip"
                    data-page-ns="home"
                    data-page="true"
                >
                    <HomeAnimation />
                    <HomeNav />
                    <Hero />
                    <IntroSection />
                    <PartnersSection />
                    <ProductStorySections />
                    <TestimonialMarqueeDemo />
                    <FaqSection />
                    <LighthouseSection />
                </main>
            </div>
            <CinematicFooter />
        </>
    );
}
