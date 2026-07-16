import { AnalyticsSection } from './analytics-section';
import { CtaSection } from './cta-section';
import { Hero } from './hero';
import { HomeNav, MotionLayer } from './home-chrome';
import { JournalSection } from './journal-section';
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
