'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { cardCls, h2Cls } from '@/lib/ui';
import { useAccountStore } from '@/stores/accounts';
import { useTradesStore } from '@/stores/trades';
import { RANGES, RangeKey, Series, buildSeries, drawChart } from './equity-chart.lib';

/* Drives the equity chart canvas: one rAF loop, paused on hidden tab;
   reveal animation triggers when the chart scrolls into view and re-arms
   when it fully leaves; range switches replay the reveal; static full
   curve for reduced motion. Hover is tracked in local vars — zero
   re-renders. `series` is the real equity data; the loop reads it via a ref
   so new trades repaint without re-arming the effect. Returns the ref to
   attach to the <canvas>. */
function useEquityCanvas(range: RangeKey, series: Series) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rangeRef = useRef(range);
    const revealT0 = useRef<number | null>(null);
    const seriesRef = useRef(series);
    seriesRef.current = series;

    // Range switch replays the reveal (skip the initial render).
    useEffect(() => {
        if (rangeRef.current !== range) {
            rangeRef.current = range;
            revealT0.current = performance.now();
        }
    }, [range]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let raf = 0;
        let played = false;
        let onScreen = false;
        let hover: { x: number; y: number } | null = null;

        const tick = () => {
            const s = seriesRef.current;
            drawChart(canvas, {
                pts: s.pts,
                lo: s.lo,
                hi: s.hi,
                sig: s.sig,
                reveal: revealT0.current,
                reduced,
                hover,
            });
            raf = requestAnimationFrame(tick);
        };
        // Only run the loop when the chart is both on-screen and the tab is
        // visible — no point burning frames on a pulsing dot no one can see.
        const start = () => {
            if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(tick);
        };
        const stop = () => {
            cancelAnimationFrame(raf);
            raf = 0;
        };

        // Gates the loop on visibility; arms the reveal when the chart scrolls
        // into view and re-arms after it fully leaves the viewport.
        const io = new IntersectionObserver(
            (entries) => {
                const en = entries[0];
                onScreen = en.isIntersecting;
                if (en.intersectionRatio >= 0.35 && !played) {
                    played = true;
                    revealT0.current = performance.now();
                } else if (en.intersectionRatio === 0) {
                    played = false;
                    revealT0.current = null;
                }
                if (onScreen) start();
                else stop();
            },
            { threshold: [0, 0.35] },
        );
        io.observe(canvas);

        const onMove = (ev: MouseEvent) => {
            const r = canvas.getBoundingClientRect();
            hover = { x: ev.clientX - r.left, y: ev.clientY - r.top };
        };
        const onLeave = () => {
            hover = null;
        };
        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('mouseleave', onLeave);
        const onVis = () => (document.hidden ? stop() : start());
        document.addEventListener('visibilitychange', onVis);

        return () => {
            stop();
            io.disconnect();
            canvas.removeEventListener('mousemove', onMove);
            canvas.removeEventListener('mouseleave', onLeave);
            document.removeEventListener('visibilitychange', onVis);
        };
    }, []);

    return canvasRef;
}

// Canvas equity curve, driven by the real trade log.
function EquityChart({ range, series }: { range: RangeKey; series: Series }) {
    const canvasRef = useEquityCanvas(range, series);

    return <canvas ref={canvasRef} className="w-full h-[340px] block cursor-crosshair" />;
}

// Equity curve title + axis subtitle.
function ChartTitle() {
    return (
        <div className="flex flex-col gap-[5px]">
            <h2 className={h2Cls}>Equity curve</h2>
            <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]">
                NET LIQ ($) × TRADES LOGGED
            </span>
        </div>
    );
}

// 30D/90D/YTD/ALL toggle for the equity chart.
function RangePicker({ range, onChange }: { range: RangeKey; onChange: (k: RangeKey) => void }) {
    return (
        <div className="flex gap-1 bg-[#0a0d0f] border border-[#1b2226] rounded-lg p-[3px]">
            {(Object.keys(RANGES) as RangeKey[]).map((key) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    className={`border-none cursor-pointer rounded-md px-[13px] py-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] transition-colors ${
                        key === range
                            ? 'bg-[#2fd57f] text-[#04130a]'
                            : 'bg-transparent text-[#5f6b70]'
                    }`}
                >
                    {key}
                </button>
            ))}
        </div>
    );
}

// Equity-curve card with the range picker; owns the selected range and builds
// the equity series from the (already-loaded) trade log + active account.
export function EquityCard() {
    const [range, setRange] = useState<RangeKey>('YTD');
    const trades = useTradesStore((s) => s.trades);
    const activeId = useAccountStore((s) => s.activeId);
    const accounts = useAccountStore((s) => s.accounts);

    const startingBalance = useMemo(() => {
        const acc = accounts.find((a) => a.id === activeId);
        return acc ? parseFloat(acc.starting_balance) : 0;
    }, [accounts, activeId]);

    const series = useMemo(
        () => buildSeries(trades, startingBalance, range),
        [trades, startingBalance, range],
    );

    return (
        <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <ChartTitle />
                <RangePicker range={range} onChange={setRange} />
            </div>
            <EquityChart range={range} series={series} />
        </div>
    );
}
