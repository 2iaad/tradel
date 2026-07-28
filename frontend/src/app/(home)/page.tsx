import { Hero } from './hero';
import { HomeAnimation } from './home-animation';
import { HomeNav } from './home-chrome';
import { IntroSection } from './intro-section';
import { LighthouseSection } from './lighthouse-section';
import { PartnersSection } from './partners-section';

const STATS = [
    { value: '128K+', label: 'Trades journaled' },
    { value: '4,200+', label: 'Active traders' },
    { value: '40+', label: 'Metrics per account' },
    { value: '4.9', label: 'Rated by traders', stars: true },
];

// Divider-separated proof strip between the marquee and the lighthouse story.
function StatsStrip() {
    return (
        <section className="section">
            <div className="main-c p-pad">
                <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-border-subtle">
                    {STATS.map((stat, i) => (
                        <div
                            key={stat.label}
                            className={`flex flex-col gap-2 px-6 py-10 lg:px-10 ${i > 0 ? 'lg:border-l lg:border-border-subtle' : ''} ${i % 2 === 1 ? 'border-l border-border-subtle lg:border-l' : ''}`}
                        >
                            <div className="flex items-baseline gap-2.5">
                                <span className="text-[clamp(30px,3vw,46px)] font-semibold leading-none tracking-[-0.02em] text-card-foreground">
                                    {stat.value}
                                </span>
                                {stat.stars && (
                                    <span className="text-ui-md tracking-[0.1em] text-primary">
                                        ★★★★★
                                    </span>
                                )}
                            </div>
                            <span className="font-mono text-ui-xs font-medium tracking-[0.16em] text-content-faint uppercase">
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function Home() {
    return (
        <>
            <div className="page-w" data-page-wrapper="">
                <main id="top" className="main-w" data-page-ns="home" data-page="true">
                    <HomeNav />
                    <Hero />
                    <IntroSection />
                    <PartnersSection />
                    <StatsStrip />
                    <LighthouseSection />
                </main>
            </div>
            <HomeAnimation />
        </>
    );
}
