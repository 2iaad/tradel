import {
    BarChart3,
    CalendarDays,
    Check,
    Link2,
    NotebookPen,
    Target,
    TrendingUp,
} from 'lucide-react';

import {
    landingSectionBodyClass,
    LandingSection,
    LandingSectionHeading,
} from './landing-section';

const panelClass =
    'border border-border-subtle bg-card shadow-[0_32px_90px_rgba(0,0,0,0.58)]';

function TinyAvatar({ label, tone = 'yellow' }: { label: string; tone?: 'yellow' | 'gray' }) {
    return (
        <span
            className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.625rem] font-semibold sm:size-8 sm:text-xs ${
                tone === 'yellow'
                    ? 'border-primary/25 bg-primary/15 text-primary'
                    : 'border-white/10 bg-white/10 text-white/60'
            }`}
        >
            {label}
        </span>
    );
}

function TradeContextVisual() {
    return (
        <div
            className="relative mx-auto h-[570px] w-full max-w-[760px] sm:h-[420px] lg:h-[470px]"
            aria-label="A trade linked to its journal context"
        >
            <div className="absolute left-[-7%] top-[180px] hidden w-[110px] -rotate-12 text-right font-mono text-[0.6875rem] italic leading-tight text-white/35 lg:block">
                automatic
                <br />
                trade context
                <svg className="ml-auto mt-2 h-10 w-20 translate-x-5" viewBox="0 0 64 32" fill="none" aria-hidden="true">
                    <path d="M2 5C19 6 18 25 50 20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M44 16L51 20L45 24" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            <div className="absolute left-1/2 top-[220px] z-10 w-[92%] max-w-[520px] -translate-x-1/2 -rotate-[1.5deg] transition-transform duration-500 hover:-rotate-[0.5deg] sm:top-[78px] sm:w-[80%] lg:left-[44%] lg:top-[90px]">
                <div className={`${panelClass} overflow-hidden rounded-xl`}>
                    <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-6 sm:py-5">
                        <TinyAvatar label="ZT" />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-white/75 sm:text-base">
                                NQ long <span className="text-white/25">· 2m ago</span>
                            </div>
                            <div className="mt-1 font-mono text-[0.5625rem] tracking-[0.1em] text-white/30 sm:text-xs">
                                ENTRY 20,042 · EXIT 20,095 · 1 LOT
                            </div>
                        </div>
                        <span className="rounded-md bg-profit/10 px-2 py-1 font-mono text-[0.625rem] font-semibold text-profit sm:px-3 sm:text-sm">
                            +2.3R
                        </span>
                    </div>
                    <div className="space-y-3 px-4 py-4 sm:space-y-5 sm:px-7 sm:py-6">
                        <p className="max-w-[650px] text-xs leading-relaxed text-white/55 sm:text-base">
                            Waited for the opening range retest, entered after the reclaim, and respected the planned stop.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {['A+ setup', 'Rule followed', 'London close'].map((label) => (
                                <span key={label} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.5625rem] text-white/45 sm:px-3 sm:py-1.5 sm:text-xs">
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 border-t border-white/[0.07] px-4 py-3 text-[0.625rem] text-white/35 sm:px-6 sm:py-4 sm:text-sm">
                        <Link2 className="size-3.5 text-primary/70 sm:size-4" aria-hidden="true" />
                        Linked to <span className="font-medium text-white/55">Pre-market plan · Jul 24</span>
                    </div>
                    <div className="border-t border-white/[0.07] px-4 py-3 text-[0.625rem] text-white/25 sm:px-6 sm:py-4 sm:text-sm">
                        Add a review note…
                    </div>
                </div>
            </div>

            <div className="absolute right-0 top-0 z-20 w-[44%] max-w-[190px] rotate-[6deg] transition-transform duration-500 hover:rotate-[3deg] sm:top-[30px] sm:w-[34%] lg:right-[-3%]">
                <div className={`${panelClass} rounded-xl p-4 sm:p-6`}>
                    <div className="mb-3 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-white/25 sm:mb-4 sm:text-xs">Journal</div>
                    <div className="space-y-2.5 sm:space-y-4">
                        {[
                            { label: 'Pre-market plan', icon: NotebookPen },
                            { label: 'NQ setup review', icon: Target },
                            { label: 'Weekly recap', icon: CalendarDays },
                        ].map(({ label, icon: Icon }) => (
                            <div key={label} className="flex items-center gap-2 text-[0.625rem] text-white/55 sm:gap-3 sm:text-sm">
                                <Icon className="size-3.5 text-white/35 sm:size-4" aria-hidden="true" />
                                <span className="truncate">{label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="my-3 h-px bg-white/[0.07] sm:my-5" />
                    <div className="mb-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-white/25 sm:text-xs">Trade</div>
                    <div className="flex items-center gap-2 text-[0.625rem] text-white/55 sm:gap-3 sm:text-sm">
                        <TrendingUp className="size-3.5 text-profit sm:size-4" aria-hidden="true" />
                        NQ · +$610.00
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 right-0 z-30 w-[52%] max-w-[220px] rotate-[5deg] sm:w-[36%] lg:right-[1%]">
                <div className={`${panelClass} flex items-center gap-3 rounded-lg px-4 py-3 sm:px-5 sm:py-4`}>
                    <span className="font-mono text-sm text-primary sm:text-lg">@</span>
                    <span className="text-[0.625rem] text-white/30 sm:text-sm">Link a note or setup…</span>
                </div>
            </div>
        </div>
    );
}

function AnalyticsVisual() {
    return (
        <div
            className="relative mx-auto h-[340px] w-full max-w-[760px] sm:h-[400px] lg:h-[450px]"
            aria-label="Trading performance dashboard cards"
        >
            <div className="absolute left-[3%] top-[72px] w-[34%] max-w-[255px] -rotate-[5deg] transition-transform duration-500 hover:-rotate-[2deg] sm:left-[6%] sm:top-[90px]">
                <div className={`${panelClass} rounded-xl p-4 sm:p-6`}>
                    <div className="mb-4 flex items-center gap-2 text-[0.6875rem] font-medium text-white/60 sm:mb-6 sm:gap-3 sm:text-base">
                        <BarChart3 className="size-4 text-primary sm:size-5" aria-hidden="true" />
                        Symbols
                    </div>
                    <div className="space-y-3 sm:space-y-5">
                        {[
                            ['NQ', '63%'],
                            ['EURUSD', '58%'],
                            ['NVDA', '52%'],
                            ['XAUUSD', '41%'],
                        ].map(([label, value], index) => (
                            <div key={label} className={`flex items-center justify-between gap-2 text-[0.625rem] sm:text-sm ${index === 0 ? 'text-white/70' : 'text-white/35'}`}>
                                <span className="truncate">{label}</span>
                                <span className="font-mono">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute left-1/2 top-[46px] z-10 w-[42%] max-w-[315px] -translate-x-1/2 rotate-[2deg] transition-transform duration-500 hover:rotate-0 sm:top-[57px]">
                <div className={`${panelClass} rounded-xl p-4 sm:p-7`}>
                    <div className="mb-1 flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary sm:size-11">
                            <Target className="size-4 sm:size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <div className="text-[0.6875rem] font-semibold text-white/75 sm:text-base">NQ performance</div>
                            <div className="text-[0.5625rem] text-white/25 sm:text-xs">Last 30 trades</div>
                        </div>
                    </div>
                    <div className="my-4 h-px bg-white/[0.07] sm:my-6" />
                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <div className="font-mono text-[0.5rem] uppercase tracking-wider text-white/25 sm:text-xs">Win rate</div>
                            <div className="mt-1 text-lg font-semibold text-profit sm:text-2xl">63%</div>
                        </div>
                        <div>
                            <div className="font-mono text-[0.5rem] uppercase tracking-wider text-white/25 sm:text-xs">Net P&amp;L</div>
                            <div className="mt-1 text-lg font-semibold text-profit sm:text-2xl">+$1,321</div>
                        </div>
                    </div>
                    <div className="mt-4 flex h-14 items-end gap-1.5 sm:mt-6 sm:h-20 sm:gap-2">
                        {[35, 58, 43, 72, 54, 83, 68, 92].map((height, index) => (
                            <span
                                key={index}
                                className={`flex-1 rounded-[2px] ${index === 2 || index === 6 ? 'bg-loss/55' : 'bg-profit/65'}`}
                                style={{ height: `${height}%` }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute right-[2%] top-[59px] w-[35%] max-w-[280px] -rotate-[3deg] transition-transform duration-500 hover:-rotate-[1deg] sm:right-[4%] sm:top-[74px]">
                <div className={`${panelClass} rounded-xl p-4 sm:p-6`}>
                    <div className="mb-4 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-white/25 sm:mb-6 sm:text-xs">Account summary</div>
                    <div className="space-y-3.5 sm:space-y-5">
                        {[
                            ['Average R', '+0.49R', 'profit'],
                            ['Profit factor', '2.07x', 'profit'],
                            ['Closed trades', '30', 'neutral'],
                        ].map(([label, value, tone]) => (
                            <div key={label} className="flex items-center gap-2">
                                <TinyAvatar label={label.slice(0, 1)} tone={tone === 'profit' ? 'yellow' : 'gray'} />
                                <div className="min-w-0 flex-1">
                                    <div className="text-[0.625rem] text-white/55 sm:text-sm">{label}</div>
                                    <div className="mt-1.5 h-1 rounded-full bg-white/[0.06]">
                                        <div className="h-full w-2/3 rounded-full bg-white/10" />
                                    </div>
                                </div>
                                <span className={`text-[0.625rem] font-medium sm:text-sm ${tone === 'profit' ? 'text-profit' : 'text-white/40'}`}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-[32px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-border-subtle bg-secondary px-4 py-3 text-[0.625rem] text-white/55 shadow-xl sm:bottom-[45px] sm:gap-2.5 sm:px-5 sm:py-3.5 sm:text-xs">
                Review NQ trades
                <span className="flex size-5 items-center justify-center rounded bg-primary/15 text-primary sm:size-6">
                    <Check className="size-3 sm:size-3.5" aria-hidden="true" />
                </span>
            </div>

            <div className="absolute bottom-[16px] right-[8%] hidden rotate-6 font-mono text-[0.6875rem] italic text-white/30 lg:block">
                your edge,
                <br />
                made visible
                <svg className="-ml-9 -mt-1 h-8 w-14 -rotate-12" viewBox="0 0 56 32" fill="none" aria-hidden="true">
                    <path d="M53 6C35 4 38 23 8 21" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M14 17L7 21L13 25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
}

function ProductStatement({ children, highlight, label, detail, initials }: {
    children: React.ReactNode;
    highlight: string;
    label: string;
    detail: string;
    initials: string;
}) {
    return (
        <div className="mx-auto w-full max-w-[560px] border-l border-white/15 pl-4">
            <p className={landingSectionBodyClass}>
                {children}{' '}
                <mark className="rounded-[2px] bg-primary/20 px-0.5 text-primary/85">{highlight}</mark>
            </p>
            <div className="mt-3 flex items-center gap-2.5 text-[0.6875rem] text-white/30 normal-case sm:mt-4 sm:text-xs">
                <TinyAvatar label={initials} tone="gray" />
                <span>
                    <span className="text-white/45">{label}</span>, {detail}
                </span>
            </div>
        </div>
    );
}

function StorySection({ id, title, visual, statement }: {
    id: string;
    title: React.ReactNode;
    visual: React.ReactNode;
    statement: React.ReactNode;
}) {
    return (
        <LandingSection id={id} className="min-h-0 py-0">
            <LandingSectionHeading title={title} />
            <div className="mt-0">{visual}</div>
            <div className="mt-4">{statement}</div>
        </LandingSection>
    );
}

export function ProductStorySections() {
    return (
        <>
            <StorySection
                id="journal-story"
                title={
                    <>
                        <span className="block">Connect every trade</span>
                        <span className="block">to the decisions behind it</span>
                    </>
                }
                visual={<TradeContextVisual />}
                statement={
                    <ProductStatement
                        highlight="Tradel keeps every execution beside the context needed when it is time to review."
                        label="Trade review"
                        detail="a core Tradel workflow"
                        initials="TR"
                    >
                        Notes and executions should not live in different places.
                    </ProductStatement>
                }
            />

            <StorySection
                id="analytics-story"
                title={
                    <>
                        <span className="block">See the patterns behind your performance</span>
                        <span className="mt-2 block text-sm text-zinc-300/40">(without living in spreadsheets)</span>
                    </>
                }
                visual={<AnalyticsVisual />}
                statement={
                    <ProductStatement
                        highlight="See which symbols and trade directions are working—and where performance is slipping."
                        label="Performance review"
                        detail="built into Tradel"
                        initials="PR"
                    >
                        A trading journal should deliver useful feedback, not another dashboard full of noise.
                    </ProductStatement>
                }
            />
        </>
    );
}
