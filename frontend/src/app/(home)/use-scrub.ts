'use client';

import { useEffect } from 'react';
import { YTD_STATS } from './home.data';
import { drawScrubChart } from './scrub-chart.lib';

export interface ScrubRefs {
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
export function useScrub(r: ScrubRefs) {
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
