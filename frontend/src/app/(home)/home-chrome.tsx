'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

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
function useReveal() {
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

// Scales the ref'd fixed bar to the fraction of the page scrolled.
function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>) {
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
function useParallax() {
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

// Page-wide motion: reveal + parallax engines, plus the scroll progress bar.
export function MotionLayer() {
    const bar = useRef<HTMLDivElement>(null);
    useReveal();
    useParallax();
    useScrollProgress(bar);
    return (
        <div
            ref={bar}
            className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left scale-x-0 bg-[#2fd57f] shadow-[0_0_12px_rgba(47,213,127,0.55)]"
        />
    );
}

const solidCls = 'border-[#14191d] bg-[rgba(7,9,11,0.82)] backdrop-blur-[14px]';
const signInCls =
    'rounded-lg px-4 py-[9px] text-[13.5px] font-medium text-[#93a09d] transition-colors hover:text-[#eef4f2]';
const getStartedCls =
    'rounded-lg bg-[#2fd57f] px-[18px] py-2.5 text-[13.5px] font-semibold text-[#04130a] transition-[background-color,transform] hover:bg-[#4ce392] active:scale-[0.97]';

// Pulsing dot + wordmark.
function Brand() {
    return (
        <span className="flex items-center gap-2.5">
            <span className="h-[9px] w-[9px] rounded-full bg-[#2fd57f] [animation:tradelPulse_2.2s_ease-out_infinite]" />
            <span className="font-mono text-[13px] font-semibold tracking-[0.22em] text-[#e8efec]">
                TRADEL
            </span>
        </span>
    );
}

// Fixed top nav — transparent over the hero, frosted glass once scrolled.
export function HomeNav() {
    const [solid, setSolid] = useState(false);
    useEffect(() => {
        const on = () => setSolid(window.scrollY > 32);
        on();
        window.addEventListener('scroll', on, { passive: true });
        return () => window.removeEventListener('scroll', on);
    }, []);
    return (
        <nav
            className={`fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b px-[clamp(20px,4vw,48px)] transition-[background-color,border-color,backdrop-filter] duration-300 ${solid ? solidCls : 'border-transparent bg-transparent'}`}
        >
            <Brand />
            <span className="flex items-center gap-2.5">
                <Link href="/login" className={signInCls}>
                    Sign in
                </Link>
                <Link href="/register" className={getStartedCls}>
                    Get started
                </Link>
            </span>
        </nav>
    );
}
