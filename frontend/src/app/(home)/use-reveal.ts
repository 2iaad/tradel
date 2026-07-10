'use client';

import { useEffect } from 'react';

const EASE = 'cubic-bezier(0.22,1,0.36,1)';

// Snaps an element to its revealed (final) state.
const show = (el: HTMLElement) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.filter = 'none';
};

// Plays one element's entrance after its data-reveal-delay.
const play = (el: HTMLElement) => {
    const d = el.dataset.revealDelay ?? '0';
    el.style.transition = `opacity 0.9s ${EASE} ${d}ms, transform 1.05s ${EASE} ${d}ms, filter 0.9s ${EASE} ${d}ms`;
    show(el);
    el.addEventListener('transitionend', () => (el.style.willChange = 'auto'), { once: true });
};

/* One-shot entrance animations for every [data-reveal] element on the page.
   Hidden start states live in globals.css. A mask line is 100% clipped by its
   overflow:hidden wrapper while hidden — a fully-clipped element never reports
   an intersection — so the WRAPPER is observed and the child revealed. */
export function useReveal() {
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const byTarget = new Map<Element, HTMLElement>();
        document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
            const target =
                el.dataset.reveal === 'mask' && el.parentElement ? el.parentElement : el;
            // already scrolled past (restored scroll) → visible, no animation
            if (target.getBoundingClientRect().bottom < 0) return show(el);
            byTarget.set(target, el);
        });
        const io = new IntersectionObserver(
            (entries) => {
                for (const en of entries) {
                    if (!en.isIntersecting) continue;
                    const el = byTarget.get(en.target);
                    if (el) play(el);
                    io.unobserve(en.target);
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
        );
        byTarget.forEach((_, target) => io.observe(target));
        return () => io.disconnect();
    }, []);
}
