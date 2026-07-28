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
    type Plugin,
    type ScriptableLineSegmentContext,
} from 'chart.js';

import { canvasColors, G, R, cardCls, h2Cls, monoFontStack } from '@/lib/ui';
import { useAccountStore } from '@/stores/accounts';
import { useTradesStore } from '@/stores/trades';
import { RANGES, RangeKey, buildSeries } from './equity-chart.lib';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

// Chart.js touches `window` at import — client-only, no SSR pass.
const Line = dynamic(() => import('react-chartjs-2').then((m) => m.Line), { ssr: false });

const money = (v: number) => '$' + Math.round(v).toLocaleString('en-US');
const signedDayMoney = (v: number | null) =>
    v === null ? '—' : `${v >= 0 ? '+' : '-'}$${Math.round(Math.abs(v)).toLocaleString('en-US')}`;

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
                color: canvasColors.faint,
                font: { family: monoFontStack, size: 10 },
                maxTicksLimit: 7,
                maxRotation: 0,
                padding: 14,
            },
        },
        y: {
            ticks: {
                color: canvasColors.faint,
                font: { family: monoFontStack, size: 10 },
                callback: (v) => money(Number(v)),
                padding: 14,
            },
            grid: { color: canvasColors.borderFaint, drawTicks: false },
        },
    },
    elements: { point: { radius: 0, hoverRadius: 4 } },
};

// Same 30D/90D/YTD/ALL toggle as the canvas card, minus the reveal wiring.
function RangePicker({ range, onChange }: { range: RangeKey; onChange: (k: RangeKey) => void }) {
    return (
        <div className="flex gap-1 bg-muted border border-border-subtle rounded-lg p-[3px]">
            {(Object.keys(RANGES) as RangeKey[]).map((key) => (
                <Button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    variant={key === range ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-auto rounded-md px-[13px] py-1.5 font-mono text-ui-xs ${
                        key === range
                            ? 'bg-primary text-black hover:bg-primary-hover'
                            : 'bg-transparent text-content-faint hover:bg-accent hover:text-secondary-foreground'
                    }`}
                >
                    {key}
                </Button>
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

    const series = useMemo(
        () => buildSeries(trades, startingBalance, range),
        [trades, startingBalance, range],
    );
    const equityFillPlugin = useMemo<Plugin<'line'>>(
        () => ({
            id: 'equityFill',
            beforeDatasetsDraw(chart) {
                const meta = chart.getDatasetMeta(0);
                const points = meta.data as Array<
                    PointElement & { cp1x?: number; cp1y?: number; cp2x?: number; cp2y?: number }
                >;
                const baseline = chart.scales.y.getPixelForValue(series.startEquity);
                chart.ctx.save();
                for (let i = 1; i < points.length; i++) {
                    const p0 = points[i - 1];
                    const p1 = points[i];
                    const below = p0.y > baseline || p1.y > baseline;
                    chart.ctx.fillStyle = below ? 'rgba(240,85,78,0.10)' : 'rgba(47,213,127,0.10)';
                    chart.ctx.beginPath();
                    chart.ctx.moveTo(p0.x, p0.y);
                    chart.ctx.bezierCurveTo(
                        p0.cp2x ?? p0.x,
                        p0.cp2y ?? p0.y,
                        p1.cp1x ?? p1.x,
                        p1.cp1y ?? p1.y,
                        p1.x,
                        p1.y,
                    );
                    chart.ctx.lineTo(p1.x, baseline);
                    chart.ctx.lineTo(p0.x, baseline);
                    chart.ctx.closePath();
                    chart.ctx.fill();
                }
                chart.ctx.restore();
            },
        }),
        [series.startEquity],
    );

    const data = useMemo<ChartData<'line'>>(() => {
        const { pts, dates, lo, hi, startEquity } = series;
        const span = hi - lo;
        const equity = pts.map((p) => lo + p * span);
        const curveEquity = [equity[0]];
        const curveDates = [dates[0]];
        for (let i = 1; i < equity.length; i++) {
            const previous = equity[i - 1];
            const current = equity[i];
            if ((previous < startEquity && current > startEquity) || (previous > startEquity && current < startEquity)) {
                const fraction = (startEquity - previous) / (current - previous);
                curveEquity.push(startEquity);
                curveDates.push(dates[i - 1] + (dates[i] - dates[i - 1]) * fraction);
            }
            curveEquity.push(current);
            curveDates.push(dates[i]);
        }
        return {
            labels: curveDates.map((ms) =>
                new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            ),
            datasets: [
                {
                    data: curveEquity,
                    borderColor: G,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.25,
                    segment: {
                        borderColor: (ctx: ScriptableLineSegmentContext) => {
                            const p0 = ctx.p0.parsed.y ?? startEquity;
                            const p1 = ctx.p1.parsed.y ?? startEquity;
                            return p0 < startEquity || p1 < startEquity ? R : G;
                        },
                    },
                },
            ],
        };
    }, [series]);

    const dailyStats = useMemo(() => {
        const { bestDay, worstDay, avgDay } = series;
        return { bestDay, worstDay, avgDay };
    }, [series]);

    return (
        <Card className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-[5px]">
                    <h2 className={h2Cls}>Equity curve</h2>
                    <span className="font-mono text-ui-xs font-medium tracking-[0.14em] text-content-faint">
                        NET LIQ ($) × TRADES LOGGED
                    </span>
                </div>
                <RangePicker range={range} onChange={setRange} />
            </div>
            <div className="flex flex-col gap-4 pt-1 pb-1">
                <h3 className="m-0 text-ui-lg font-medium text-[#a59f96]">
                    Profit and loss for each trading day
                </h3>
                <div className="grid grid-cols-3">
                    <div className="flex flex-col gap-1">
                        <span className="font-mono text-ui-xs tracking-[0.14em] text-[#a59f96]">
                            BEST DAY
                        </span>
                        <span className={`text-display-md leading-none font-semibold ${dailyStats.bestDay !== null && dailyStats.bestDay < 0 ? 'text-loss' : 'text-profit'}`}>
                            {signedDayMoney(dailyStats.bestDay)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 border-l border-[#292725] pl-11">
                        <span className="font-mono text-ui-xs tracking-[0.14em] text-[#a59f96]">
                            WORST DAY
                        </span>
                        <span className={`text-display-md leading-none font-semibold ${dailyStats.worstDay !== null && dailyStats.worstDay >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {signedDayMoney(dailyStats.worstDay)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 border-l border-[#292725] pl-11">
                        <span className="font-mono text-ui-xs tracking-[0.14em] text-[#a59f96]">
                            AVG / DAY
                        </span>
                        <span className={`text-display-md leading-none font-semibold ${dailyStats.avgDay !== null && dailyStats.avgDay < 0 ? 'text-loss' : 'text-profit'}`}>
                            {signedDayMoney(dailyStats.avgDay)}
                        </span>
                    </div>
                </div>
            </div>
            <div className="h-[400px]">
                <Line options={options} data={data} plugins={[equityFillPlugin]} />
            </div>
        </Card>
    );
}
