'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    BarChart,
    PieChart,
    RadarChart,
    type BarSeriesOption,
    type PieSeriesOption,
    type RadarSeriesOption,
} from 'echarts/charts';
import {
    GridComponent,
    LegendComponent,
    RadarComponent,
    TooltipComponent,
    type GridComponentOption,
    type LegendComponentOption,
    type RadarComponentOption,
    type TooltipComponentOption,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import type { ComposeOption, EChartsType } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    canvasColors,
    cardCls,
    cardDescriptionCls,
    cardFooterCls,
    cardMetaLabelCls,
    cardMetaValueCls,
    cardTitleCls,
    monoFontStack,
} from '@/lib/ui';
import type { BreakdownEntry } from '@/stores/analytics';

echarts.use([
    BarChart,
    PieChart,
    RadarChart,
    GridComponent,
    LegendComponent,
    RadarComponent,
    TooltipComponent,
    CanvasRenderer,
]);

type ChartOption = ComposeOption<
    | BarSeriesOption
    | PieSeriesOption
    | RadarSeriesOption
    | GridComponentOption
    | LegendComponentOption
    | RadarComponentOption
    | TooltipComponentOption
>;

const DISTRIBUTION_COLORS = [
    '#08dc32',
    '#4387ef',
    '#a94ee9',
    '#ed3aa2',
    '#ff691b',
    '#a5df00',
    '#12b789',
    '#f04444',
];

const fmtMoney = (value: number, currency: string, signed = false) => {
    const sign = value < 0 ? '-' : signed && value > 0 ? '+' : '';
    try {
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Math.abs(value));
        return `${sign}${formatted}`;
    } catch {
        return `${sign}$${Math.abs(value).toFixed(2)}`;
    }
};

const fmtWholeMoney = (value: number, currency: string, signed = false) => {
    const sign = value < 0 ? '-' : signed && value > 0 ? '+' : '';
    try {
        const symbol = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
        })
            .formatToParts(0)
            .find((part) => part.type === 'currency')?.value ?? '$';
        return `${sign}${symbol}${Math.round(Math.abs(value)).toLocaleString('en-US')}`;
    } catch {
        return `${sign}$${Math.round(Math.abs(value)).toLocaleString('en-US')}`;
    }
};

function useEChart(node: React.RefObject<HTMLDivElement | null>, option: ChartOption) {
    const chart = useRef<EChartsType | null>(null);

    useEffect(() => {
        if (!node.current) return;
        const instance = echarts.init(node.current, undefined, { renderer: 'canvas' });
        const resizeObserver = new ResizeObserver(() => instance.resize());
        chart.current = instance;
        resizeObserver.observe(node.current);
        return () => {
            resizeObserver.disconnect();
            instance.dispose();
            chart.current = null;
        };
    }, [node]);

    useEffect(() => {
        chart.current?.setOption(option, { notMerge: true });
    }, [option]);
}

function SectionHeader({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-5 px-[22px] pb-3 pt-5">
            <div className="min-w-0">
                <h2 className={cardTitleCls}>
                    {title}
                </h2>
                <p className={cardDescriptionCls}>{description}</p>
            </div>
            {children}
        </div>
    );
}

type SymbolsProps = {
    rows: BreakdownEntry[];
    currency: string;
};

function SymbolsPerformance({ rows, currency }: SymbolsProps) {
    const [mode, setMode] = useState<'bars' | 'radar'>('bars');
    const node = useRef<HTMLDivElement>(null);
    const data = useMemo(() => rows.slice(0, 8), [rows]);
    const maxAbs = Math.max(1, ...data.map((row) => Math.abs(row.net)));

    const option = useMemo<ChartOption>(() => {
        if (mode === 'radar') {
            const maxCount = Math.max(1, ...data.map((row) => row.count));
            return {
                animationDuration: 450,
                tooltip: {
                    trigger: 'item',
                    backgroundColor: '#101315',
                    borderColor: '#2b353b',
                    textStyle: { color: '#eef4f2', fontFamily: monoFontStack, fontSize: 12 },
                    formatter: (params: unknown) => {
                        const item = params as { name?: string; value?: number[] };
                        const values = item.value ?? [];
                        const row = data.find((entry) => entry.label === item.name);
                        return `${item.name ?? ''}<br/>P&L: ${fmtMoney(row?.net ?? 0, currency, true)}<br/>Win rate: ${((row?.winRate ?? 0) * 100).toFixed(0)}%<br/>Trades: ${row?.count ?? values[2] ?? 0}`;
                    },
                },
                radar: {
                    center: ['50%', '50%'],
                    radius: '68%',
                    indicator: [
                        { name: 'NET P&L', max: maxAbs },
                        { name: 'WIN RATE', max: 1 },
                        { name: 'TRADES', max: maxCount },
                    ],
                    axisName: {
                        color: canvasColors.faint,
                        fontFamily: monoFontStack,
                        fontSize: 10,
                    },
                    splitNumber: 4,
                    splitArea: { areaStyle: { color: ['rgba(255,255,255,.02)', 'transparent'] } },
                    splitLine: { lineStyle: { color: canvasColors.borderFaint } },
                    axisLine: { lineStyle: { color: canvasColors.borderFaint } },
                },
                series: data.map((row, index) => ({
                    type: 'radar' as const,
                    name: row.label,
                    data: [
                        {
                            value: [Math.abs(row.net), row.winRate ?? 0, row.count],
                            name: row.label,
                            lineStyle: { color: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length] },
                            itemStyle: { color: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length] },
                            areaStyle: { opacity: 0.06 },
                        },
                    ],
                    symbol: 'none',
                })),
            };
        }

        return {
            animationDuration: 450,
            grid: { left: 98, right: 92, top: 12, bottom: 12, containLabel: false },
            xAxis: {
                type: 'value',
                min: Math.min(0, ...data.map((row) => row.net)),
                max: Math.max(0, ...data.map((row) => row.net)),
                show: false,
            },
            yAxis: {
                type: 'category',
                inverse: true,
                data: data.map((row) => row.label),
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    color: '#a9a39b',
                    fontFamily: monoFontStack,
                    fontSize: 13,
                    margin: 14,
                },
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: '#101315',
                borderColor: '#2b353b',
                textStyle: { color: '#eef4f2', fontFamily: monoFontStack, fontSize: 12 },
                formatter: (params: unknown) => {
                    const item = (Array.isArray(params) ? params[0] : params) as { name?: string; value?: number };
                    const row = data.find((entry) => entry.label === item.name);
                    return `${item.name ?? ''}<br/>P&L: ${fmtMoney(row?.net ?? Number(item.value ?? 0), currency, true)}<br/>${row?.count ?? 0} trades`;
                },
            },
            series: [
                {
                    type: 'bar',
                    data: data.map((row) => ({
                        value: row.net,
                        itemStyle: {
                            color: row.net >= 0 ? '#16bd87' : canvasColors.loss,
                            borderRadius: row.net >= 0 ? [0, 7, 7, 0] : [7, 0, 0, 7],
                        },
                    })),
                    barWidth: 36,
                    label: {
                        show: true,
                        position: 'right',
                        color: '#d7d2ca',
                        fontFamily: monoFontStack,
                        fontSize: 13,
                        formatter: (params: unknown) => {
                            const item = params as { value?: number };
                            return fmtWholeMoney(Number(item.value ?? 0), currency, true);
                        },
                    },
                },
            ],
        };
    }, [currency, data, maxAbs, mode]);

    useEChart(node, option);
    const best = data[0];
    const net = data.reduce((sum, row) => sum + row.net, 0);

    return (
        <Card className={`${cardCls} overflow-hidden p-0`}>
            <SectionHeader title="Symbols Performance" description="P&L breakdown by symbol">
                <div className="flex shrink-0 items-center rounded-full border border-border-subtle bg-muted p-1">
                    {(['bars', 'radar'] as const).map((value) => (
                        <Button
                            key={value}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode(value)}
                            className={`h-auto rounded-full px-4 py-2 text-ui-md ${mode === value ? 'bg-background text-content shadow-sm hover:bg-background hover:text-content' : 'text-content-faint hover:bg-transparent hover:text-content'}`}
                        >
                            {value === 'bars' ? 'Bars' : 'Radar'}
                        </Button>
                    ))}
                </div>
            </SectionHeader>
            <div className="px-6 pt-3">
                {data.length ? (
                    <div ref={node} role="img" aria-label="P&L breakdown by symbol" className="h-[430px] w-full" />
                ) : (
                    <div className="flex h-[430px] items-center justify-center text-ui-sm text-content-faint">No symbol data yet</div>
                )}
            </div>
            <div className={`${cardFooterCls} grid grid-cols-3`}>
                <FooterMetric label="Symbols" value={String(data.length)} />
                <FooterMetric label="Best" value={best ? `${best.label} ${fmtWholeMoney(best.net, currency, true)}` : '—'} center />
                <FooterMetric label="Net P&L" value={fmtMoney(net, currency, true)} right accent={net >= 0} />
            </div>
        </Card>
    );
}

function FooterMetric({
    label,
    value,
    center,
    right,
    accent,
}: {
    label: string;
    value: string;
    center?: boolean;
    right?: boolean;
    accent?: boolean;
}) {
    return (
        <div className={`${center ? 'text-center' : right ? 'text-right' : ''} min-w-0`}>
            <div className={cardMetaLabelCls}>{label}</div>
            <div className={`mt-2 truncate ${cardMetaValueCls} ${accent ? 'text-profit' : ''}`}>{value}</div>
        </div>
    );
}

function TradeDistribution({ rows }: SymbolsProps) {
    const node = useRef<HTMLDivElement>(null);
    const data = useMemo(() => rows.slice(0, 8), [rows]);
    const total = data.reduce((sum, row) => sum + row.count, 0);
    const option = useMemo<ChartOption>(
        () => ({
            animationDuration: 450,
            tooltip: {
                trigger: 'item',
                backgroundColor: '#101315',
                borderColor: '#2b353b',
                textStyle: { color: '#eef4f2', fontFamily: monoFontStack, fontSize: 12 },
                formatter: (params: unknown) => {
                    const item = params as { name?: string; value?: number; percent?: number };
                    return `${item.name ?? ''}<br/>${item.value ?? 0} trades · ${Number(item.percent ?? 0).toFixed(0)}%`;
                },
            },
            series: [
                {
                    name: 'Trade Distribution',
                    type: 'pie',
                    radius: ['22%', '78%'],
                    center: ['50%', '50%'],
                    roseType: 'area',
                    avoidLabelOverlap: true,
                    label: { show: false },
                    labelLine: { show: false },
                    itemStyle: {
                        borderRadius: 8,
                        borderColor: canvasColors.card,
                        borderWidth: 3,
                    },
                    data: data.map((row, index) => ({
                        name: row.label,
                        value: row.count,
                        itemStyle: { color: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length] },
                    })),
                },
            ],
        }),
        [data],
    );
    useEChart(node, option);
    const mostTraded = [...data].sort((a, b) => b.count - a.count)[0];
    const concentration = total && mostTraded ? Math.round((mostTraded.count / total) * 100) : 0;

    return (
        <Card className={`${cardCls} overflow-hidden p-0`}>
            <SectionHeader title="Trade Distribution" description="Trade count distribution across symbols" />
            <div className="grid min-h-[490px] grid-cols-[1.04fr_0.96fr] items-center gap-3 px-8 py-4">
                {data.length ? (
                    <div className="relative h-[390px] min-w-0">
                        <div ref={node} role="img" aria-label="Trade count distribution by symbol" className="h-full w-full" />
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
                            <span className="text-display-md font-semibold leading-none text-content">{total}</span>
                            <span className="mt-1 text-ui-sm text-content-muted">Trades</span>
                        </div>
                    </div>
                ) : (
                    <div className="col-span-2 flex h-[390px] items-center justify-center text-ui-sm text-content-faint">No trade data yet</div>
                )}
                <div className="flex min-w-0 flex-col gap-4">
                    {data.map((row, index) => {
                        const percentage = total ? Math.round((row.count / total) * 100) : 0;
                        return (
                            <div key={row.label} className="flex items-center gap-3 text-ui-sm">
                                <span className="size-4 shrink-0 rounded-[3px]" style={{ background: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length] }} />
                                <span className="min-w-0 truncate font-semibold text-content">{row.label}</span>
                                <span className="ml-auto whitespace-nowrap font-mono text-content">{percentage}%</span>
                                <span className="whitespace-nowrap text-content-faint">· {row.count} {row.count === 1 ? 'trade' : 'trades'}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className={`${cardFooterCls} grid grid-cols-2`}>
                <div>
                    <div className={cardMetaLabelCls}>Most traded</div>
                    <div className={`mt-2 ${cardMetaValueCls}`}>{mostTraded ? `${mostTraded.label} · ${mostTraded.count} ${mostTraded.count === 1 ? 'trade' : 'trades'}` : '—'}</div>
                </div>
                <div className="text-right">
                    <div className={cardMetaLabelCls}>Concentration</div>
                    <div className={`mt-2 ${cardMetaValueCls}`}>{total ? `${concentration}% of all trades` : '—'}</div>
                </div>
            </div>
        </Card>
    );
}

export function SymbolAnalyticsGrid({ rows, currency = 'USD' }: SymbolsProps) {
    return (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
            <SymbolsPerformance rows={rows} currency={currency} />
            <TradeDistribution rows={rows} currency={currency} />
        </div>
    );
}
