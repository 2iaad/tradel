'use client';

import { useRef } from 'react';
import { useReveal } from './use-reveal';
import { useParallax, useScrollProgress } from './use-scroll-fx';

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
