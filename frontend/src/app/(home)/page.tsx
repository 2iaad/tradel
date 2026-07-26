import { Footer } from './footer';
import { Hero } from './hero';
import { HomeAnimation } from './home-animation';
import { HomeNav } from './home-chrome';
import { IntroSection } from './intro-section';
import { LighthouseSection } from './lighthouse-section';
import { PartnersSection } from './partners-section';
import { SeoSection } from './seo-section';
import { CrossDivider } from './support-section';

// Recreate the homepage composition from experiment/ui.
export default function Home() {
    return (
        <>
            <div className="page-w" data-page-wrapper="">
                <main id="top" className="main-w" data-page-ns="home" data-page="true">
                    <HomeNav />
                    <Hero />
                    <IntroSection />
                    <PartnersSection />
                    <LighthouseSection />
                    {/* <CrossDivider /> */}
                    {/* <SeoSection /> */}
                    {/* <Footer /> */}
                </main>
            </div>
            <HomeAnimation />
        </>
    );
}
