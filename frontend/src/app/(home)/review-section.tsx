import { kickerCls } from '@/lib/ui';
import { HEAT_CELLS, REVIEW_POINTS } from './home.data';
import { MaskedHeading } from './masked-heading';

const DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const dowCls = 'text-center font-mono text-[9px] font-medium tracking-[0.14em] text-[#4d5a5f]';
const cellCls =
    'box-border aspect-square rounded-[7px] border p-[7px] font-mono text-[10px] font-medium transition-[transform,border-color] duration-200 hover:scale-[1.07] hover:border-[#3a464d]';
const greenChipCls =
    'inline-flex rounded-[5px] border border-[rgba(47,213,127,0.25)] bg-[rgba(47,213,127,0.06)] px-[11px] py-1 font-mono text-[10px] font-semibold tracking-[0.08em] text-[#2fd57f]';
const grayChipCls =
    'inline-flex rounded-[5px] border border-[#222a2f] px-[11px] py-1 font-mono text-[10px] font-medium tracking-[0.08em] text-[#78878a]';

// Weekday labels + staggered daily P&L cells.
function HeatGrid() {
    return (
        <div className="grid grid-cols-5 gap-2">
            {DOW.map((d) => (
                <span key={d} className={dowCls}>
                    {d}
                </span>
            ))}
            {HEAT_CELLS.map((c, i) => (
                <div
                    key={i}
                    data-reveal="scale"
                    data-reveal-delay={c.delay}
                    className={cellCls}
                    style={{ background: c.bg, borderColor: c.border, color: c.txt }}
                >
                    {c.day}
                </div>
            ))}
        </div>
    );
}

// June calendar heatmap card — daily P&L intensity per weekday.
function HeatmapCard() {
    return (
        <div
            data-reveal="up"
            className="flex flex-col gap-4 rounded-[14px] border border-[#1b2226] bg-[#0e1214] px-[26px] py-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
        >
            <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-semibold tracking-[0.14em] text-[#e9eef0]">
                    JUNE 2026
                </span>
                <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-[#5f6b70]">
                    DAILY P&amp;L
                </span>
            </div>
            <HeatGrid />
            <div className="flex flex-wrap gap-2">
                <span className={greenChipCls}>NET +$3,120</span>
                <span className={grayChipCls}>41 TRADES</span>
                <span className={grayChipCls}>61% GREEN DAYS</span>
            </div>
        </div>
    );
}

const h2Cls =
    'm-0 text-[clamp(36px,4vw,60px)] leading-[1.08] font-semibold tracking-[-0.025em] text-[#eef4f1]';

// The three numbered takeaways under the review copy.
function ReviewPoints() {
    return (
        <div className="mt-1.5 flex flex-col gap-3.5">
            {REVIEW_POINTS.map(([n, title, body], i) => (
                <div
                    key={n}
                    data-reveal="right"
                    data-reveal-delay={String(540 + i * 120)}
                    className="flex items-baseline gap-4"
                >
                    <span className="font-mono text-[11px] font-semibold text-[#2fd57f]">{n}</span>
                    <div className="flex flex-col gap-[3px]">
                        <span className="text-[15.5px] font-semibold text-[#e9eef0]">{title}</span>
                        <span className="text-[13.5px] leading-[1.5] text-[#7e8d89]">{body}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Kicker, masked headline, sub copy and the numbered points.
function ReviewCopy() {
    return (
        <div className="flex flex-col gap-[22px]">
            <MaskedHeading
                className={h2Cls}
                delays={[120, 260]}
                lines={['See the month', 'the way it happened.']}
            />
            <p
                className="m-0 max-w-[440px] text-base leading-[1.65] text-[#8a9995]"
                data-reveal="blur"
                data-reveal-delay="420"
            >
                Green days, red days, days you sat on your hands &mdash; the calendar
                doesn&rsquo;t negotiate. Open any day and replay the decisions that made it.
            </p>
            <ReviewPoints />
        </div>
    );
}

// 04 · Review — parallax calendar heatmap beside the review copy.
export function ReviewSection() {
    return (
        <section className="relative flex min-h-screen items-center overflow-hidden border-t border-[#14191d] bg-[#0b0e10]">
            <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-[clamp(40px,6vw,96px)] px-9 py-[110px] lg:grid-cols-[1fr_1.05fr]">
                <div data-parallax="0.06" className="will-change-transform">
                    <HeatmapCard />
                </div>
                <ReviewCopy />
            </div>
        </section>
    );
}
