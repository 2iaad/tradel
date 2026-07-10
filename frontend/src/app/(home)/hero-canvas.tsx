'use client';

import { useRef } from 'react';
import { useCandles } from '@/components/auth/use-candles';

// Parallax backdrop for the hero: drifting candlesticks under two vignettes.
export function HeroCanvas() {
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
