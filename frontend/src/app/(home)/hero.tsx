import { Fragment } from 'react';

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
                        <img
                            id="hero-img"
                            alt="Tradel trading journal"
                            className="home-hero__img"
                            fetchPriority="high"
                            loading="eager"
                            src="/images/tradel.webp"
                        />
                    </div>
                </div>
            </section>
            <div className="hero-bottom__wrap">
                <div className="home-hero__bottom">
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
