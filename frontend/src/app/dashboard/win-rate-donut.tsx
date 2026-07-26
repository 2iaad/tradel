'use client';

import dynamic from 'next/dynamic';
import {
    ArcElement,
    Chart as ChartJS,
    Tooltip,
    type ChartData,
    type ChartOptions,
} from 'chart.js';

import { G, R } from '@/lib/ui';

ChartJS.register(ArcElement, Tooltip);

// Chart.js touches `window` at import — client-only, no SSR pass.
const Doughnut = dynamic(() => import('react-chartjs-2').then((m) => m.Doughnut), {
    ssr: false,
});

const BE = '#5f6b70'; // breakeven grey

const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: { legend: { display: false } },
};

// Wins / losses / breakevens as a 3-slice doughnut for the win-rate card.
export function WinRateDonut({
    wins,
    losses,
    breakevens,
}: {
    wins: number;
    losses: number;
    breakevens: number;
}) {
    const data: ChartData<'doughnut'> = {
        labels: ['Wins', 'Losses', 'Breakevens'],
        datasets: [
            {
                data: [wins, losses, breakevens],
                backgroundColor: [G, R, BE],
                borderColor: '#0e1214',
                borderWidth: 2,
            },
        ],
    };

    const legend: [string, string, number][] = [
        ['Wins', G, wins],
        ['Losses', R, losses],
        ['Breakevens', BE, breakevens],
    ];

    return (
        <div className="flex flex-col gap-2">
            <div className="h-[150px]">
                <Doughnut options={options} data={data} />
            </div>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                {legend.map(([label, color, n]) => (
                    <span key={label} className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-[#c8d2d0]">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                        {label} {n}
                    </span>
                ))}
            </div>
        </div>
    );
}
