'use client';

import { useRef } from 'react';

import { useCandles } from './use-candles';

// Brand headline block over the animated chart.
function HeroCopy() {
    return (
        <div className="absolute inset-0 flex flex-col justify-between box-border px-[52px] py-11">
            <div className="flex items-center gap-2.5">
                <span className="w-[9px] h-[9px] rounded-full bg-[#2fd57f] animate-[tradelPulse_2.2s_ease-out_infinite]" />
                <span className="font-mono text-[13px] font-semibold tracking-[0.22em] text-[#e8efec]">
                    TRADEL
                </span>
            </div>
            <div className="flex flex-col gap-3.5">
                <h1 className="m-0 text-[clamp(36px,3.4vw,52px)] font-semibold leading-[1.12] tracking-[-0.015em] text-[#eef4f1]">
                    Every trade,
                    <br />
                    on the record.
                    <span className="inline-block w-[13px] h-[0.78em] bg-[#2fd57f] ml-[9px] align-[-2px] animate-[tradelBlink_1.1s_steps(1)_infinite]" />
                </h1>
                <p className="m-0 text-[15px] leading-[1.5] text-[#7e8d89] max-w-[360px]">
                    Log entries, exits, and the reasoning between them.
                </p>
            </div>
        </div>
    );
}

const paneEase = 'transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.18,1)]';

// Visual half of the auth page: candlestick canvas + gradient + copy.
// Slides right when the register/reset forms are open.
export function HeroPanel({ shifted }: { shifted: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useCandles(canvasRef);

    return (
        <div
            className={`absolute inset-y-0 left-0 w-1/2 overflow-hidden bg-[#07090b] z-[1] ${paneEase}`}
            style={{ transform: `translateX(${shifted ? '100%' : '0%'})` }}
        >
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full opacity-[0.92]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,11,0.3)_0%,rgba(7,9,11,0)_30%,rgba(7,9,11,0.9)_82%)]" />
            <HeroCopy />
        </div>
    );
}
