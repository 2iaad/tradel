'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useCandles } from '@/hooks/use-candles';
import { MaskedHeading } from './masked-heading';

// Parallax backdrop for the hero: drifting candlesticks under two vignettes.
function HeroCanvas() {
    const canvas = useRef<HTMLCanvasElement>(null);
    useCandles(canvas);
    return (
        <div className="absolute inset-x-0 top-[-12%] h-[124%]">
            <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-55" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_62%_at_50%_38%,rgba(7,9,11,0)_0%,rgba(7,9,11,0.55)_62%,rgba(7,9,11,0.96)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,11,0.85)_0%,rgba(7,9,11,0)_26%,rgba(7,9,11,0)_62%,#07090b_96%)]" />
        </div>
    );
}

const titleCls =
    'm-0 text-[clamp(52px,7.2vw,104px)] leading-[1.04] font-semibold tracking-[-0.03em] text-[#eef4f1]';
const cursorCls =
    'ml-[0.12em] inline-block h-[0.72em] w-[0.14em] align-[-0.04em] bg-[#2fd57f] [animation:tradelBlink_1.1s_steps(1)_infinite]';
const primaryCtaCls =
    'inline-flex items-center rounded-[9px] bg-[#2fd57f] px-7 py-[15px] text-[15px] font-semibold text-[#04130a] shadow-[0_8px_32px_rgba(47,213,127,0.25)] transition-[background-color,transform,box-shadow] hover:bg-[#4ce392] hover:shadow-[0_10px_40px_rgba(47,213,127,0.35)] active:scale-[0.97]';
const demoCtaCls =
    'inline-flex items-center gap-2 rounded-[9px] border border-[#222a2f] px-6 py-[15px] text-[15px] font-medium text-[#c8d2d0] transition-colors hover:border-[#3a464d] hover:text-[#eef4f2]';

const HERO_LINES = [
    'The market forgets.',
    <>
        Your <span className="text-[#2fd57f]">journal </span>doesn&rsquo;t.
        <span className={cursorCls} />
    </>,
];

// Pulsing pill announcing what Tradel is.
function HeroBadge() {
    return (
        <div
            data-reveal="blur"
            data-reveal-delay="80"
            className="inline-flex items-center gap-[9px] rounded-full border border-[#1e262b] bg-[rgba(14,18,20,0.55)] px-[15px] py-[7px]"
        >
            <span className="h-1.5 w-1.5 rounded-full bg-[#2fd57f] [animation:tradelPulse_2.2s_ease-out_infinite]" />
            <span className="font-mono text-[10.5px] font-medium tracking-[0.2em] text-[#7e8d89]">
                THE TRADING JOURNAL FOR SERIOUS TRADERS
            </span>
        </div>
    );
}

// Primary/demo CTAs plus the no-card note.
function HeroCtas() {
    return (
        <>
            <div
                data-reveal="up"
                data-reveal-delay="800"
                className="flex flex-wrap items-center justify-center gap-3.5"
            >
                <Link href="/register" className={primaryCtaCls}>
                    Start your journal &mdash; free
                </Link>
                <Link href="/dashboard" className={demoCtaCls}>
                    Explore the demo &rarr;
                </Link>
            </div>
            <div
                data-reveal="up"
                data-reveal-delay="950"
                className="font-mono text-[10.5px] font-medium tracking-[0.18em] text-[#4d5a5f]"
            >
                NO CARD REQUIRED &middot; SET UP IN UNDER A MINUTE
            </div>
        </>
    );
}

// Bouncing scroll indicator at the hero's bottom edge.
function ScrollCue() {
    return (
        <div className="absolute bottom-[26px] left-1/2 z-[1] flex -translate-x-1/2 flex-col items-center gap-2.5">
            <span className="font-mono text-[9.5px] font-medium tracking-[0.26em] text-[#4d5a5f]">
                SCROLL
            </span>
            <span className="h-11 w-px bg-[linear-gradient(180deg,#2fd57f,rgba(47,213,127,0))] [animation:tradelCue_1.9s_cubic-bezier(0.65,0,0.35,1)_infinite]" />
        </div>
    );
}

// 01 · Hero — sticky full-viewport intro over the candlestick canvas.
export function Hero() {
    return (
        <section className="sticky top-0 h-screen min-h-[640px] overflow-hidden">
            <HeroCanvas />
            <div className="relative z-[1] flex h-full flex-col items-center justify-center gap-[26px] px-6 pt-16 text-center">
                <HeroBadge />
                <MaskedHeading h1 className={titleCls} delays={[180, 360]} lines={HERO_LINES} />
                <p
                    data-reveal="blur"
                    data-reveal-delay="620"
                    className="m-0 max-w-[520px] text-[clamp(15px,1.4vw,18px)] leading-[1.6] text-[#8a9995]"
                >
                    Every entry, every exit, and the reasoning between them &mdash; logged in
                    seconds, reviewed with clarity.
                </p>
                <HeroCtas />
            </div>
            <ScrollCue />
        </section>
    );
}
