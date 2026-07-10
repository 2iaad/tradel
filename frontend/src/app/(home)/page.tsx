import { AnalyticsSection } from './analytics-section';
import { CtaSection } from './cta-section';
import { Hero } from './hero';
import { HomeNav } from './home-nav';
import { JournalSection } from './journal-section';
import { MotionLayer } from './motion-layer';
import { ReviewSection } from './review-section';

// Landing page — five full-height movements over the candlestick backdrop.
export default function Home() {
    return (
        <div className="relative bg-[#07090b]">
            <MotionLayer />
            <HomeNav />
            <Hero />
            <JournalSection />
            <AnalyticsSection />
            <ReviewSection />
            <CtaSection />
        </div>
    );
}
