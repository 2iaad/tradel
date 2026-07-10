'use client';

import { useEffect } from 'react';

// Scales the ref'd fixed bar to the fraction of the page scrolled.
export function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const on = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, max)));
            el.style.transform = `scaleX(${p.toFixed(4)})`;
        };
        on();
        window.addEventListener('scroll', on, { passive: true });
        window.addEventListener('resize', on);
        return () => {
            window.removeEventListener('scroll', on);
            window.removeEventListener('resize', on);
        };
    }, [ref]);
}

// Vertical drift for [data-parallax="speed"] wrappers near the viewport.
export function useParallax() {
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const layers = [...document.querySelectorAll<HTMLElement>('[data-parallax]')].map(
            (el) => ({ el, speed: parseFloat(el.dataset.parallax ?? '') || 0.06, top: 0, h: 1 }),
        );
        if (!layers.length) return;
        // cache absolute offsets so the scroll handler never forces layout
        const recalc = () =>
            layers.forEach((p) => {
                let top = 0;
                let e: Element | null = p.el;
                while (e instanceof HTMLElement) {
                    top += e.offsetTop;
                    e = e.offsetParent;
                }
                p.top = top;
                p.h = p.el.offsetHeight || 1;
            });
        let raf = 0;
        const frame = () => {
            raf = 0;
            const y = window.scrollY;
            const vh = window.innerHeight;
            for (const p of layers) {
                if (p.top + p.h < y - 200 || p.top > y + vh + 200) continue;
                const rel = y + vh / 2 - (p.top + p.h / 2);
                p.el.style.transform = `translate3d(0,${(rel * -p.speed).toFixed(1)}px,0)`;
            }
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(frame);
        };
        const onResize = () => {
            recalc();
            onScroll();
        };
        recalc();
        frame();
        document.fonts?.ready.then(onResize); // layout shifts once webfonts land
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
        };
    }, []);
}
