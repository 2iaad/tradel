export function IntroSection() {
    return (
        <section className="section is--intro">
            {' '}
            <div className="bg-cover">
                {' '}
                {[true, true, false, false, false].map((hasBlur, rowIndex) => (
                    <div key={rowIndex} className="grid-row">
                        {' '}
                        {Array.from({ length: 39 }, (_, cellIndex) => (
                            <div
                                key={cellIndex}
                                className={
                                    hasBlur && cellIndex >= 6 && cellIndex < 32
                                        ? 'grid-item blur'
                                        : 'grid-item'
                                }
                            />
                        ))}{' '}
                    </div>
                ))}{' '}
            </div>{' '}
            <div className="main-c p-pad">
                {' '}
                <div className="v-100" /> <div className="v-160" />{' '}
                <div className="row">
                    {' '}
                    <div className="col col-lg-6 sm--hide" />{' '}
                    <div className="col col-lg-6 col-sm-12">
                        {' '}
                        <div className="intro-w">
                            {' '}
                            <p className="p-large indent--large">
                                Traders traded. Bots followed rules. Agents think, decide, act,
                                evolve. Turn your ideas into fully independent market actors. No
                                code.
                            </p>{' '}
                            <div className="intro-cube" />{' '}
                        </div>{' '}
                    </div>{' '}
                </div>{' '}
                <div className="v-240 sm--200" />{' '}
            </div>{' '}
        </section>
    );
}
