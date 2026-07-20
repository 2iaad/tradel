export function CrossDivider() {
    return (
        <section className="cross-w">
            {' '}
            <div className="cross-row">
                {' '}
                <svg
                    className="icon-med"
                    fill="none"
                    viewBox="0 0 24 24"
                    width="100%"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {' '}
                    <path
                        d="M12 0V8M12 8C12 10.2091 10.1038 12 7.76471 12M12 8C12 10.2091 13.8962 12 16.2353 12M7.76471 12H0M7.76471 12C10.1038 12 12 13.7909 12 16M12 24V16M12 16C12 13.7909 13.8962 12 16.2353 12M16.2353 12H24"
                        stroke="currentColor"
                    />{' '}
                </svg>
                <svg
                    className="icon-med"
                    fill="none"
                    viewBox="0 0 24 24"
                    width="100%"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {' '}
                    <path
                        d="M12 0V8M12 8C12 10.2091 10.1038 12 7.76471 12M12 8C12 10.2091 13.8962 12 16.2353 12M7.76471 12H0M7.76471 12C10.1038 12 12 13.7909 12 16M12 24V16M12 16C12 13.7909 13.8962 12 16.2353 12M16.2353 12H24"
                        stroke="currentColor"
                    />{' '}
                </svg>{' '}
            </div>{' '}
            <div className="cross-row">
                {' '}
                <svg
                    className="icon-med"
                    fill="none"
                    viewBox="0 0 24 24"
                    width="100%"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {' '}
                    <path
                        d="M12 0V8M12 8C12 10.2091 10.1038 12 7.76471 12M12 8C12 10.2091 13.8962 12 16.2353 12M7.76471 12H0M7.76471 12C10.1038 12 12 13.7909 12 16M12 24V16M12 16C12 13.7909 13.8962 12 16.2353 12M16.2353 12H24"
                        stroke="currentColor"
                    />{' '}
                </svg>
                <svg
                    className="icon-med"
                    fill="none"
                    viewBox="0 0 24 24"
                    width="100%"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {' '}
                    <path
                        d="M12 0V8M12 8C12 10.2091 10.1038 12 7.76471 12M12 8C12 10.2091 13.8962 12 16.2353 12M7.76471 12H0M7.76471 12C10.1038 12 12 13.7909 12 16M12 24V16M12 16C12 13.7909 13.8962 12 16.2353 12M16.2353 12H24"
                        stroke="currentColor"
                    />{' '}
                </svg>{' '}
            </div>{' '}
        </section>
    );
}

export function SupportSection() {
    return (
        <section className="section">
            {' '}
            <div className="main-c p-pad">
                {' '}
                <div className="support-w">
                    {' '}
                    <div className="flex-v gap--med text-align-center">
                        {' '}
                        <h4 className="h-med">Support</h4>{' '}
                        <div className="p-reg">Get help</div>{' '}
                    </div>{' '}
                    <div
                        className="support-visual"
                        data-autoplay-section=""
                        floating-zeros="3"
                        total-frames="199"
                        url-end=".webp"
                        url-start="/images/seq-support/"
                    >
                        {' '}
                        <div className="embed w-embed">
                            <canvas />
                        </div>{' '}
                    </div>{' '}
                    <div className="support-button">
                        {' '}
                        <a
                            className="button is--large w-inline-block"
                            data-wf--bigbutton--variant="base"
                            href="#"
                            scramble-link=""
                        >
                            {' '}
                            <div className="button-bg" />{' '}
                            <div className="new-button_label is--large" scramble-text="">
                                write to us
                            </div>{' '}
                        </a>{' '}
                    </div>{' '}
                </div>{' '}
                <div className="v-100" />{' '}
            </div>{' '}
        </section>
    );
}
