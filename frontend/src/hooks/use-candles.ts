'use client';

import { useEffect } from 'react';

import { clientSize } from '@/lib/canvas-size';

// Deterministic hash noise in [0,1) — keeps candles stable as they scroll.
const rand = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

// Smooth pseudo price walk in ~[0,1] (sum of sines = loops forever).
const price = (i: number) =>
    0.5 +
    0.26 * Math.sin(i * 0.21) +
    0.15 * Math.sin(i * 0.063 + 1.7) +
    0.09 * Math.sin(i * 0.47 + 4.2);

// Paints one frame of the scrolling candlestick backdrop at time t.
function drawCandles(canvas: HTMLCanvasElement, t: number) {
    if (!canvas.isConnected) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { w, h } = clientSize(canvas);
    if (!w || !h) return;
    const W = Math.round(w * dpr);
    const H = Math.round(h * dpr);
    if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const step = 30;
    const bodyW = 15;
    const offset = t * 26;
    const first = Math.floor(offset / step) - 1;
    const frac = offset % step;
    const y = (v: number) => 48 + (1 - v) * (h - 130);
    // faint horizontal grid
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    for (let gy = 48; gy < h - 40; gy += 56) {
        ctx.beginPath();
        ctx.moveTo(0, gy + 0.5);
        ctx.lineTo(w, gy + 0.5);
        ctx.stroke();
    }
    for (let k = 0; k <= w / step + 2; k++) {
        const i = first + k;
        const x = k * step - frac - step / 2;
        const o = price(i);
        const c = price(i + 0.7);
        const hi = Math.max(o, c) + 0.02 + 0.05 * rand(i * 3.1);
        const lo = Math.min(o, c) - 0.02 - 0.05 * rand(i * 7.3);
        const col = c >= o ? '#2fd57f' : '#f0554e';
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y(hi));
        ctx.lineTo(x, y(lo));
        ctx.stroke();
        ctx.fillStyle = col;
        const yo = y(o);
        const yc = y(c);
        ctx.fillRect(x - bodyW / 2, Math.min(yo, yc), bodyW, Math.max(2, Math.abs(yc - yo)));
        ctx.globalAlpha = 1;
    }
}

// Endlessly scrolling candlestick backdrop — one rAF loop, paused when
// the tab is hidden; a single static frame for prefers-reduced-motion.
export function useCandles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let raf = 0;
        let last = 0;
        let t = 0;
        let covered = false;

        const frame = (now: number) => {
            const dt = last ? Math.min((now - last) / 1000, 0.1) : 0.016;
            last = now;
            t += dt;
            drawCandles(canvas, t);
            raf = reduced ? 0 : requestAnimationFrame(frame);
        };
        const start = () => {
            if (!raf && !covered && !document.hidden) raf = requestAnimationFrame(frame);
        };
        const stop = () => {
            cancelAnimationFrame(raf);
            raf = 0;
            last = 0;
        };
        const onVis = () => (document.hidden ? stop() : start());
        // ponytail: both consumers (landing hero, auth panel) sit in the
        // page's first viewport; the sticky hero stays pinned under opaque
        // sections, so past one viewport of scroll (hero min-height 640px,
        // +120px past the next section's rounded corners) the canvas is
        // fully hidden — pause the loop instead of painting covered pixels.
        // The section is also visibility-hidden while covered: on fast async
        // scroll (Firefox APZ) the compositor can show the pinned hero layer
        // through not-yet-rasterized gaps in the sections above it — hidden
        // layers can't leak through, gaps show plain page background instead.
        const sec = canvas.closest('section');
        const onScroll = () => {
            const c = window.scrollY > Math.max(window.innerHeight, 640) + 120;
            if (c !== covered) {
                covered = c;
                if (sec) sec.style.visibility = c ? 'hidden' : '';
                if (c) stop();
                else start();
            }
        };
        document.addEventListener('visibilitychange', onVis);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // restored scroll may start past the hero
        start();
        return () => {
            stop();
            if (sec) sec.style.visibility = '';
            document.removeEventListener('visibilitychange', onVis);
            window.removeEventListener('scroll', onScroll);
        };
    }, [canvasRef]);
}
