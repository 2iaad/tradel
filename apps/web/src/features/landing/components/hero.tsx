import Link from 'next/link';
import { Fragment } from 'react';

import { BlurReveal } from '@/components/ui/blur-reveal';
import { Button } from '@/components/ui/button';
import { Safari } from '@/components/ui/safari';

import dashboardMockup from '../../../../public/images/landing/dashboard-mockup-0.png';

export function Hero() {
    return (
        <>
            <section className="section">
                <div className="main-c p-pad">
                    <div className="home-hero">
                        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-2 pt-12 sm:pt-20">
                            <h1 className="flex max-w-2xl flex-col items-center text-center text-4xl font-bold tracking-normal text-card-foreground normal-case sm:text-5xl">
                                <BlurReveal delay={0.1}>Journal every trade.</BlurReveal>
                                <BlurReveal delay={0.25}>Build your trading edge.</BlurReveal>
                            </h1>

                            <div className="w-full max-w-md flex-1 pt-1">
                                <BlurReveal delay={0.4} className="block">
                                    <p className="text-ui-lg text-center leading-relaxed text-white/50 normal-case">
                                        Log your trades, review clear analytics, and understand what
                                        is improving your performance, all in one place.
                                    </p>
                                </BlurReveal>

                                <div className="mt-8 flex justify-center flex-wrap gap-3">
                                    <BlurReveal delay={0.55}>
                                        <Button
                                            nativeButton={false}
                                            render={<Link href="/register" />}
                                        >
                                            Start your journal
                                        </Button>
                                    </BlurReveal>
                                    <BlurReveal delay={0.7}>
                                        <Button
                                            nativeButton={false}
                                            render={<Link href="/demo" />}
                                            variant="outline"
                                        >
                                            View live demo
                                        </Button>
                                    </BlurReveal>
                                </div>
                            </div>
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
                        <div className="home-hero__mockup">
                            <BlurReveal delay={0.05} className="block w-full">
                                <Safari
                                    className="w-full"
                                    imageAlt="Tradel dashboard showing trading performance and recent trades"
                                    imageSrc={dashboardMockup}
                                    url="www.tradel.online"
                                />
                            </BlurReveal>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
