import { CommunitySection } from './(home)/community-section';
import { DownloadSection } from './(home)/download-section';
import { EducationSection } from './(home)/education-section';
import { Footer } from './(home)/footer';
import { Hero } from './(home)/hero';
import { HomeAnimation } from './(home)/home-animation';
import { HomeMenu, HomeNav } from './(home)/home-chrome';
import { IntroSection } from './(home)/intro-section';
import { LighthouseSection } from './(home)/lighthouse-section';
import { PartnersSection } from './(home)/partners-section';
import { PressSection } from './(home)/press-section';
import { ProcessEndSection, ProcessSection } from './(home)/process-section';
import { RatingBanner } from './(home)/rating-banner';
import { SeoSection } from './(home)/seo-section';
import { CrossDivider, SupportSection } from './(home)/support-section';

// The {' '} separators mirror the single-space text nodes of the original
// minified markup so the rendered DOM stays identical to the reference build.
export default function HomePage() {
    return (
        <>
            <div className="page-w" data-page-wrapper="">
                <main id="top" className="main-w" data-page-ns="home" data-page="true">
                    {' '}
                    <HomeNav /> <HomeMenu />
                    {'   '}
                    <Hero /> <IntroSection /> <PartnersSection /> <DownloadSection />{' '}
                    <LighthouseSection /> <ProcessSection /> <ProcessEndSection />{' '}
                    <CommunitySection /> <EducationSection /> <PressSection /> <CrossDivider />{' '}
                    <SupportSection /> <DownloadSection withHeading /> <RatingBanner />{' '}
                    <SeoSection />
                    {'  '}
                    <Footer />{' '}
                </main>
            </div>
            <HomeAnimation />
        </>
    );
}
