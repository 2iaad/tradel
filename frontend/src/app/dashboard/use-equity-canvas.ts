'use client';

import { useEffect, useRef } from 'react';

import { RangeKey, curve, drawChart } from './equity-chart.lib';

/* Drives the equity chart canvas: one rAF loop, paused on hidden tab;
   reveal animation triggers when the chart scrolls into view and re-arms
   when it fully leaves; range switches replay the reveal; static full
   curve for reduced motion. Hover is tracked in local vars — zero
   re-renders. Returns the ref to attach to the <canvas>. */
export function useEquityCanvas(range: RangeKey, ghost: boolean) {
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
        const start = () => {
            if (!raf) raf = requestAnimationFrame(tick);
        };
        const stop = () => {
            cancelAnimationFrame(raf);
            raf = 0;
        };

        // Trigger the reveal when the chart scrolls into view; re-arm
        // after it fully leaves the viewport.
        const io = new IntersectionObserver(
            (entries) => {
                const en = entries[0];
                if (en.intersectionRatio >= 0.35 && !played) {
                    played = true;
                    revealT0.current = performance.now();
                } else if (en.intersectionRatio === 0) {
                    played = false;
                    revealT0.current = null;
                }
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
        start();

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
