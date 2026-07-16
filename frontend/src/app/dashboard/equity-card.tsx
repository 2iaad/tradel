'use client';

import { useEffect, useRef, useState } from 'react';

import { cardCls, ctaCls, h2Cls } from '@/lib/ui';
import { RANGES, RangeKey, curve, drawChart } from './equity-chart.lib';

/* Drives the equity chart canvas: one rAF loop, paused on hidden tab;
   reveal animation triggers when the chart scrolls into view and re-arms
   when it fully leaves; range switches replay the reveal; static full
   curve for reduced motion. Hover is tracked in local vars — zero
   re-renders. Returns the ref to attach to the <canvas>. */
function useEquityCanvas(range: RangeKey, ghost: boolean) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rangeRef = useRef(range);
    const revealT0 = useRef<number | null>(null);

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
        const curves: Partial<Record<RangeKey, number[]>> = {};

        const tick = () => {
            const key = rangeRef.current;
            drawChart(canvas, {
                key,
                pts: (curves[key] ??= curve(key)),
                ghost,
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
        if (!ghost) {
            canvas.addEventListener('mousemove', onMove);
            canvas.addEventListener('mouseleave', onLeave);
        }
        const onVis = () => (document.hidden ? stop() : start());
        document.addEventListener('visibilitychange', onVis);

        return () => {
            stop();
            io.disconnect();
            canvas.removeEventListener('mousemove', onMove);
            canvas.removeEventListener('mouseleave', onLeave);
            document.removeEventListener('visibilitychange', onVis);
        };
    }, [ghost]);

    return canvasRef;
}

// Canvas equity curve; ghost mode draws the dim dashed guest preview.
function EquityChart({ range = 'YTD', ghost = false }: { range?: RangeKey; ghost?: boolean }) {
    const canvasRef = useEquityCanvas(range, ghost);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-[340px] block ${ghost ? '' : 'cursor-crosshair'}`}
        />
    );
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

// Equity-curve card with the range picker; owns the selected range.
export function EquityCard() {
    const [range, setRange] = useState<RangeKey>('YTD');

    return (
        <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <ChartTitle />
                <RangePicker range={range} onChange={setRange} />
            </div>
            <EquityChart range={range} />
        </div>
    );
}

// Centered call-to-action overlaid on the ghost curve.
function GhostOverlay({ onStart }: { onStart: () => void }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 pointer-events-none">
            <span className="text-xl font-semibold text-[#eef4f2]">
                Your curve starts at trade #1
            </span>
            <span className="text-[13.5px] text-[#7e8d89] max-w-[340px] text-center">
                The dotted line is what a journaled year can look like.
            </span>
            <button
                type="button"
                onClick={onStart}
                className={`${ctaCls} pointer-events-auto mt-1.5 px-5`}
            >
                Log your first trade
            </button>
        </div>
    );
}

// Guest equity-curve card: dim dashed preview with the signup CTA on top.
export function GhostEquityCard({ onStart }: { onStart: () => void }) {
    return (
        <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
            <div className="flex items-center justify-between gap-4">
                <ChartTitle />
                <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-[#5f6b70] border border-dashed border-[#2b343a] rounded-md px-2.5 py-[5px]">
                    PREVIEW
                </span>
            </div>
            <div className="relative">
                <EquityChart ghost />
                <GhostOverlay onStart={onStart} />
            </div>
        </div>
    );
}
