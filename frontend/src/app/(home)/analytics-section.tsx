'use client';

import { useEffect, useRef } from 'react';
import { kickerCls } from '@/lib/ui';
import { YTD_STATS } from './home.data';
import { MaskedHeading } from './masked-heading';
import { drawScrubChart } from './scrub-chart.lib';

interface ScrubRefs {
    section: React.RefObject<HTMLElement | null>;
    canvas: React.RefObject<HTMLCanvasElement | null>;
    pnl: React.RefObject<HTMLSpanElement | null>;
    win: React.RefObject<HTMLSpanElement | null>;
    pf: React.RefObject<HTMLSpanElement | null>;
    hint: React.RefObject<HTMLDivElement | null>;
}

const setText = (el: HTMLElement | null, v: string) => {
    if (el && el.textContent !== v) el.textContent = v;
};

/* Drives the pinned analytics section: scroll progress e in [0,1] scrubs the
   canvas curve and the stat counters, and fades out the hint. All writes are
   imperative on the passed refs — no re-renders. */
function useScrub(r: ScrubRefs) {
    useEffect(() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let raf = 0;
        const apply = () => {
            raf = 0;
            const sec = r.section.current;
            const cv = r.canvas.current;
            if (!sec || !cv) return;
            const rect = sec.getBoundingClientRect();
            const vh = window.innerHeight;
            if (rect.bottom < 0 || rect.top > vh) return; // section off-screen
            const e = reduced
                ? 1
                : Math.min(1, Math.max(0, -rect.top / Math.max(1, sec.offsetHeight - vh)));
            drawScrubChart(cv, e);
            setText(r.pnl.current, '+$' + Math.round(YTD_STATS.pnl * e).toLocaleString('en-US'));
            setText(r.win.current, (YTD_STATS.win * e).toFixed(1) + '%');
            setText(r.pf.current, (YTD_STATS.pf * e).toFixed(2));
            if (r.hint.current) r.hint.current.style.opacity = String(Math.max(0, 1 - e * 5));
        };
        const on = () => {
            if (!raf) raf = requestAnimationFrame(apply);
        };
        on();
        window.addEventListener('scroll', on, { passive: true });
        window.addEventListener('resize', on);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', on);
            window.removeEventListener('resize', on);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

const h2Cls =
    'm-0 text-[clamp(34px,3.6vw,54px)] leading-[1.08] font-semibold tracking-[-0.025em] text-[#eef4f1]';
const pinCls =
    'sticky top-0 box-border flex h-screen min-h-[640px] flex-col overflow-hidden px-[clamp(24px,4vw,56px)] pt-24 pb-14';
const chartCardCls =
    'box-border flex min-h-0 flex-1 rounded-[14px] border border-[#1b2226] bg-[#0b0f12] px-5 py-[18px]';
const hintCls =
    'flex items-center justify-center gap-2.5 font-mono text-[10px] font-medium tracking-[0.24em] text-[#4d5a5f]';

// Kicker + masked headline + sub copy.
function AnalyticsCopy() {
    return (
        <div className="flex flex-col gap-4 w-full">
            <MaskedHeading
                className={h2Cls}
                delays={[120]}
                lines={['Watch your edge take shape.']}
            />
            <p
                data-reveal="blur"
                data-reveal-delay="300"
                className="m-0 max-w-[430px] text-[15px] leading-[1.6] text-[#8a9995]"
            >
                Net liquidity against trades logged &mdash; keep scrolling and the curve draws
                itself, trade by trade.
            </p>
        </div>
    );
}

// Copy on the left, the stat counters slotted beside it.
function AnalyticsHeader({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-end justify-between">
            <AnalyticsCopy />
            <div
                data-reveal="up"
                data-reveal-delay="380"
                className="flex flex-wrap gap-[clamp(24px,3vw,52px)]"
            >
                {children}
            </div>
        </div>
    );
}

// One animated stat; its value node is written imperatively by the scrub.
function Stat({
    vRef,
    start,
    label,
    green,
}: {
    vRef: React.RefObject<HTMLSpanElement | null>;
    start: string;
    label: string;
    green?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <span
                ref={vRef}
                className={`font-mono text-[28px] font-semibold tracking-[-0.02em] ${green ? 'text-[#2fd57f]' : 'text-[#eef4f2]'}`}
            >
                {start}
            </span>
            <span className="font-mono text-[10px] font-medium tracking-[0.16em] text-[#5f6b70]">
                {label}
            </span>
        </div>
    );
}

// Chart card + fading scroll hint; both nodes driven by the scrub engine.
function ChartPanel({
    canvasRef,
    hintRef,
}: {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    hintRef: React.RefObject<HTMLDivElement | null>;
}) {
    return (
        <>
            <div data-reveal="scale" data-reveal-delay="200" className={chartCardCls}>
                <canvas ref={canvasRef} className="block h-full w-full" />
            </div>
            <div ref={hintRef} className={hintCls}>
                KEEP SCROLLING &mdash; THE CURVE DRAWS WITH YOU
            </div>
        </>
    );
}

// 03 · Analytics — pinned viewport; the equity curve draws as you scroll.
export function AnalyticsSection() {
    const section = useRef<HTMLElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const pnl = useRef<HTMLSpanElement>(null);
    const win = useRef<HTMLSpanElement>(null);
    const pf = useRef<HTMLSpanElement>(null);
    const hint = useRef<HTMLDivElement>(null);
    useScrub({ section, canvas, pnl, win, pf, hint });
    return (
        <section
            ref={section}
            className="relative h-[230vh] border-t border-[#14191d] bg-[#07090b]"
        >
            <div className={pinCls}>
                <div className="mx-auto flex min-h-0 w-full max-w-[1160px] flex-1 flex-col gap-[26px]">
                    <AnalyticsHeader>
                        <Stat vRef={pnl} start="+$0" green label="NET P&L · YTD" />
                        <Stat vRef={win} start="0.0%" label="WIN RATE" />
                        <Stat vRef={pf} start="0.00" label="PROFIT FACTOR" />
                    </AnalyticsHeader>
                    <ChartPanel canvasRef={canvas} hintRef={hint} />
                </div>
            </div>
        </section>
    );
}
