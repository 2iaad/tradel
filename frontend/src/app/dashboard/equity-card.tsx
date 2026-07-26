'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
    type ChartData,
    type ChartOptions,
} from 'chart.js';

import { A, cardCls, h2Cls } from '@/lib/ui';
import { useAccountStore } from '@/stores/accounts';
import { useTradesStore } from '@/stores/trades';
import { RANGES, RangeKey, buildSeries } from './equity-chart.lib';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

// Chart.js touches `window` at import — client-only, no SSR pass.
const Line = dynamic(() => import('react-chartjs-2').then((m) => m.Line), { ssr: false });

const money = (v: number) => '$' + Math.round(v).toLocaleString('en-US');

const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700 },
    interaction: { intersect: false, mode: 'index' },
    plugins: {
        tooltip: {
            callbacks: { label: (c) => money(c.parsed.y ?? 0) },
        },
    },
    scales: {
        x: {
            grid: { display: false, drawTicks: false },
            ticks: {
                color: '#5f6b70',
                font: { family: 'monospace', size: 10 },
                maxTicksLimit: 7,
                maxRotation: 0,
                padding: 14,
            },
        },
        y: {
            ticks: {
                color: '#5f6b70',
                font: { family: 'monospace', size: 10 },
                callback: (v) => money(Number(v)),
                padding: 14,
            },
            grid: { color: '#161c20', drawTicks: false },
        },
    },
    elements: { point: { radius: 0, hoverRadius: 4 } },
};

// Same 30D/90D/YTD/ALL toggle as the canvas card, minus the reveal wiring.
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
                            ? 'bg-[#ffdd3a] text-[#231a00]'
                            : 'bg-transparent text-[#5f6b70]'
                    }`}
                >
                    {key}
                </button>
            ))}
        </div>
    );
}

// Equity-curve card. Reuses buildSeries, reconstructing raw equity from the
// normalized points ($ = lo + pt*(hi-lo)) for Chart.js to plot.
export function EquityCard() {
    const [range, setRange] = useState<RangeKey>('YTD');
    const trades = useTradesStore((s) => s.trades);
    const activeId = useAccountStore((s) => s.activeId);
    const accounts = useAccountStore((s) => s.accounts);

    const startingBalance = useMemo(() => {
        const acc = accounts.find((a) => a.id === activeId);
        return acc ? parseFloat(acc.starting_balance) : 0;
    }, [accounts, activeId]);

    const data = useMemo<ChartData<'line'>>(() => {
        const { pts, dates, lo, hi } = buildSeries(trades, startingBalance, range);
        const span = hi - lo;
        const equity = pts.map((p) => lo + p * span);
        return {
            labels: dates.map((ms) =>
                new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            ),
            datasets: [
                {
                    data: equity,
                    borderColor: A,
                    backgroundColor: 'rgba(255,221,58,0.08)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.25,
                },
            ],
        };
    }, [trades, startingBalance, range]);

    return (
        <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-[5px]">
                    <h2 className={h2Cls}>Equity curve</h2>
                    <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]">
                        NET LIQ ($) × TRADES LOGGED
                    </span>
                </div>
                <RangePicker range={range} onChange={setRange} />
            </div>
            <div className="h-[400px]">
                <Line options={options} data={data} />
            </div>
        </div>
    );
}
