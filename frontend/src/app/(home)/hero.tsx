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
                        <div className="relative z-4 mx-auto flex max-w-6xl items-start justify-between gap-24 pt-20">
                            <h1 className="m-0 max-w-4xl flex-1 font-heading text-5xl leading-none font-semibold tracking-tight text-card-foreground normal-case">
                                <span className="block">Journal every trade.</span>
                                <span className="block">Build your trading edge.</span>
                            </h1>

                            <div className="max-w-md flex-1 pt-1">
                                <p className="font-sans text-ui-lg leading-relaxed text-content-faint normal-case">
                                    Log your trades, review clear analytics, and understand what is
                                    improving your performance, all in one place.
                                </p>

                                <div className="mt-8 flex justify-center flex-wrap gap-3">
                                    <Button
                                        nativeButton={false}
                                        render={<Link href="/register" />}
                                    >
                                        Start your journal
                                    </Button>
                                    <Button
                                        nativeButton={false}
                                        render={<Link href="/demo" />}
                                        variant="outline"
                                    >
                                        View live demo
                                    </Button>
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
                        <Safari
                            className="home-hero__mockup"
                            imageAlt="Tradel dashboard showing trading performance and recent trades"
                            imageSrc={dashboardMockup}
                            url="www.tradel.online"
                        />
                    </div>
                </div>
            </section>
        </>
    );
}
