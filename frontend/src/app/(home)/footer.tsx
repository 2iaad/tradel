import { Fragment } from 'react';

import { FOOTER_LINK_COLUMNS, type FooterLink } from './home.data';

function FooterColumn({ links }: { links: FooterLink[] }) {
    return (
        <div className="col col-lg-3 col-md-6 col-sm-12">
            <div className="footer-list">
                {links.map((link) => (
                    <Fragment key={link.label}>
                        <a
                            {...(link.current ? { 'aria-current': 'page' as const } : {})}
                            className={link.current ? 'footer-link w--current' : 'footer-link'}
                            data-nav-item=""
                            href={link.href}
                        >
                            {link.label}
                        </a>
                    </Fragment>
                ))}
            </div>
        </div>
    );
}

export function Footer() {
    return (
        <footer className="section">
            <div className="main-c p-pad">
                <div className="full-logo tradel-logo tradel-logo--full" aria-label="Tradel">
                    tradel
                </div>
                <div className="v-32" />
                <div className="row footer">
                    {FOOTER_LINK_COLUMNS.map((links, index) => (
                        <Fragment key={index}>
                            <FooterColumn links={links} />
                        </Fragment>
                    ))}
                </div>
                <div className="v-40" />
                <p className="p-xsmall o--60">
                    Trading cryptocurrencies involves significant risks, and you should carefully
                    consider your investment objectives and risk tolerance before trading. The
                    cryptocurrency market is highly volatile and can be subject to sudden price
                    fluctuations. We do not provide financial advice, and you are solely responsible
                    for your trading decisions. It is important to conduct your own research and
                    understand the risks involved before trading cryptocurrencies on our platform.
                    We are not responsible for any losses incurred as a result of trading
                    cryptocurrencies on our platform. By using our platform, you acknowledge and
                    accept the risks associated with trading cryptocurrencies. Please read our terms
                    of use and privacy policy carefully before using our platform. If you have any
                    questions, please contact our customer support team.
                </p>
                <div className="v-32" />
            </div>
        </footer>
    );
}
