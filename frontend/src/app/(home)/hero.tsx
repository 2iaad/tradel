import { Fragment } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Safari } from '@/components/ui/safari';

import dashboardMockup from '../../../public/images/landing/dashboard-mockup-0.png';

export function Hero() {
    return (
        <>
            <section className="section">
                <div className="main-c p-pad">
                    <div className="home-hero">
                        <div className="home-hero__top">
                            {/* <div
                                id="hero-logo"
                                className="full-logo is--home__hero tradel-logo tradel-logo--hero"
                                aria-label="Tradel"
                            >
                                tradel
                            </div> */}
                            {/* <div id="hero-top" className="flex-h a--top j--between">
                                <h1 className="p-reg h-1 fw--reg">JOURNAL EVERY TRADE YOU TAKE</h1>
                                <p className="p-reg fw--reg">LOG TRADES / SEE THE ANALYTICS</p>
                            </div> */}
                        </div>
                        <div className="bg">
                            {['var-4', 'var-2', 'var-5', 'var-6'].map((variant) => (
                                <Fragment key={variant}>
                                    <div className={`cell-col ${variant}`}>
                                        {Array.from({ length: 30 }, (_, cellIndex) => (
                                            <Fragment key={cellIndex}>
                                                <div className="cell" />
                                            </Fragment>
                                        ))}
                                    </div>
                                </Fragment>
                            ))}
                        </div>
                        <Safari
                            className="home-hero__mockup"
                            imageAlt="Tradel dashboard showing trading performance and recent trades"
                            imageSrc={dashboardMockup}
                            url="www.tradel.online"
                        />
                    </div>
                </div>
            </section>
            <div className="hero-bottom__wrap">
                {/* Keep both entry points centered above the theme's clipped edge. */}
                <div className="home-hero__bottom justify-center gap-3 bottom-16 max-[479px]:flex-col max-[479px]:gap-2">
                    <Button
                        className="bg-white/5 text-white backdrop-blur-md hover:bg-white/5 hover:text-white dark: dark:bg-white/5 dark:hover:bg-white/5"
                        data-nav-item=""
                        nativeButton={false}
                        render={<Link href="/demo" />}
                        variant="outline"
                    >
                        <div className="new-button_label w-variant-0a89d460-1aa3-4899-fcc8-04678a30ad80">
                            {' VIEW LIVE DEMO '}
                        </div>
                    </Button>
                    <a
                        className="new-button w-variant-0a89d460-1aa3-4899-fcc8-04678a30ad80 w-inline-block"
                        data-nav-item=""
                        data-wf--button--variant="green"
                        href="/register"
                        scramble-link=""
                    >
                        <div
                            className="new-button_label w-variant-0a89d460-1aa3-4899-fcc8-04678a30ad80"
                            scramble-text=""
                        >
                            {' START YOUR JOURNAL '}
                        </div>
                    </a>
                </div>
            </div>
        </>
    );
}
