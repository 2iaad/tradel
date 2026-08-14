import { CinematicFooter } from '@/components/ui/motion-footer';
import TestimonialMarqueeDemo from '@/components/shadcn-space/marquee/marquee-01';

import { FaqSection } from './faq-section';
import { Hero } from './hero';
import { HomeAnimation } from './home-animation';
import { HomeNav } from './home-chrome';
import { IntroSection } from './intro-section';
import { LighthouseSection } from './lighthouse-section';
import { PartnersSection } from './partners-section';
import { ProductStorySections } from './product-story-sections';

export default function Home() {
    return (
        <>
            <div className="page-w" data-page-wrapper="">
                <main id="top" className="main-w overflow-clip rounded-b-4xl border-b border-white/10" data-page-ns="home" data-page="true">
                    <HomeAnimation />
                    <HomeNav />
                    <Hero />
                    <IntroSection />
                    <PartnersSection />
                    <ProductStorySections />
                    <LighthouseSection />
                    <TestimonialMarqueeDemo />
                    <FaqSection />
                </main>
            </div>
            <CinematicFooter />
        </>
    );
}
