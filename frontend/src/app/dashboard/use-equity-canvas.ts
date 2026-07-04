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
