'use client';

import { useState } from 'react';

import { cardCls, h2Cls } from '@/lib/ui';
import { EquityChart, RANGES, RangeKey } from './equity-chart';

// Equity curve title + axis subtitle.
export function ChartTitle() {
    return (
        <div className="flex flex-col gap-[5px]">
            <h2 className={h2Cls}>Equity curve</h2>
            <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]">
                NET LIQ ($) × TRADES LOGGED
            </span>
        </div>
    );
}

// 30D/90D/YTD/ALL toggle for the equity chart.
function RangePicker({ range, onChange }: { range: RangeKey; onChange: (k: RangeKey) => void }) {
    return (
        <div className="flex gap-1 bg-[#0a0d0f] border border-[#1b2226] rounded-lg p-[3px]">
            {(Object.keys(RANGES) as RangeKey[]).map((key) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    className={`border-none cursor-pointer rounded-md px-[13px] py-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] transition-colors ${
                        key === range
                            ? 'bg-[#2fd57f] text-[#04130a]'
                            : 'bg-transparent text-[#5f6b70]'
                    }`}
                >
                    {key}
                </button>
            ))}
        </div>
    );
}

// Equity-curve card with the range picker; owns the selected range.
export function EquityCard() {
    const [range, setRange] = useState<RangeKey>('YTD');

    return (
        <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <ChartTitle />
                <RangePicker range={range} onChange={setRange} />
            </div>
            <EquityChart range={range} />
        </div>
    );
}
