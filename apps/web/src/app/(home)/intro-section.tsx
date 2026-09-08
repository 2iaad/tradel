export function IntroSection() {
    return (
        <section
            id="ai"
            className="relative z-[2] -mt-23"
        >
            <div className="pointer-events-none absolute inset-0 z-0 backdrop-blur-lg max-[991px]:flex max-[991px]:flex-col max-[991px]:items-center">
                {Array.from({ length: 3 }, (_, rowIndex) => (
                    <div
                        key={rowIndex}
                        className={`flex shrink-0 ${rowIndex === 1 ? '-translate-x-[1.1vw]' : ''}`}
                    >
                        {Array.from({ length: 39 }, (_, cellIndex) => (
                            <div
                                key={cellIndex}
                                className={`relative aspect-[1/3.125] max-h-[9.375rem] w-[11.1111vw] shrink-0 border-t border-[#8c8c8c29] bg-[#5d5d5d14] p-px after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-gradient-to-b after:from-gray-500/15 after:to-primary/5 after:content-[''] min-[480px]:w-[5.26316vw] min-[992px]:w-[2.63158vw] ${rowIndex === 2 ? 'border-b' : ''}`}
                            />
                        ))}
                    </div>
                ))}
            </div>

            <div className="relative z-[1] mx-auto w-full max-w-[120rem] px-4 pb-[10em] pt-[6.25em] md:px-6">
                <div className="relative w-full md:ml-[8.333%] md:w-1/2 min-[992px]:pr-[3em]">
                    <span className="absolute left-0 top-0 h-[1.5em] min-h-6 w-[0.3125em] min-w-[0.3125rem] rounded-[0.5px] bg-primary shadow-lg shadow-primary/30 min-[992px]:top-[0.15em]" />
                    <p className="indent-[3.75em] text-xl font-semibold uppercase leading-[1.1] tracking-[-0.02em] sm:text-2xl md:text-[min(2em,1.75rem)]">
                        Every trade tells a story. Log entries and exits, track your P&amp;L, and see
                        the patterns behind your wins and losses. Build the discipline that turns
                        guesswork into an edge.
                    </p>
                </div>
            </div>
        </section>
    );
}
