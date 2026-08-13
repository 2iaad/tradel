export function IntroSection() {
    return (
        <section className="section is--intro">
            <div className="bg-cover">
                <div className="bg-cover__blur" />
                {Array.from({ length: 3 }, (_, rowIndex) => (
                    <div key={rowIndex} className="grid-row">
                        {Array.from({ length: 39 }, (_, cellIndex) => (
                            <div key={cellIndex} className="grid-item" />
                        ))}
                    </div>
                ))}
            </div>
            <div className="main-c p-pad">
                <div className="v-100" />
                <div className="row">
                    <div className="col col-lg-1 sm--hide" />
                    <div className="col col-lg-6 col-sm-12">
                        <div className="intro-w">
                            <div className="intro-cube" />
                            <p className="p-large indent--large">
                                Every trade tells a story. Log entries and exits, track your
                                P&amp;L, and see the patterns behind your wins and losses. Build the
                                discipline that turns guesswork into an edge.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="v-160" />
            </div>
        </section>
    );
}
