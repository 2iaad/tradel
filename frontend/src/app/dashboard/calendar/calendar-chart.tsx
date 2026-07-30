'use client';

import { useEffect, useMemo, useRef } from 'react';
import { HeatmapChart, type HeatmapSeriesOption, ScatterChart, type ScatterSeriesOption } from 'echarts/charts';
import {
    CalendarComponent,
    type CalendarComponentOption,
    TooltipComponent,
    type TooltipComponentOption,
    VisualMapContinuousComponent,
    type VisualMapComponentOption,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import type { ComposeOption, EChartsType } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

import { signedMoney } from '@/lib/format';
import { canvasColors, monoFontStack } from '@/lib/ui';
import type { CalendarDay } from '@/stores/calendar';

echarts.use([
    CalendarComponent,
    HeatmapChart,
    ScatterChart,
    TooltipComponent,
    VisualMapContinuousComponent,
    CanvasRenderer,
]);

type CalendarDatum = [date: string, pnl: number, trades: number];
type ChartOption = ComposeOption<
    | CalendarComponentOption
    | HeatmapSeriesOption
    | ScatterSeriesOption
    | TooltipComponentOption
    | VisualMapComponentOption
>;

interface CalendarChartProps {
    days: CalendarDay[];
    loading: boolean;
    month: string;
}

const chartTop = 42;
const chartBottom = 18;
const cellHeight = 96;

function buildMonthData(month: string, days: CalendarDay[]): CalendarDatum[] {
    const byDate = new Map(days.map((day) => [day.date, day]));
    const [year, monthNumber] = month.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
        const date = `${month}-${String(index + 1).padStart(2, '0')}`;
        const day = byDate.get(date);
        return [date, day?.pnl ?? 0, day?.trades ?? 0];
    });
}

function weekRows(month: string): number {
    const [year, monthNumber] = month.split('-').map(Number);
    const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
    const mondayOffset = (firstWeekday + 6) % 7;
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    return Math.ceil((mondayOffset + daysInMonth) / 7);
}

function dateLabel(date: string): string {
    return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

function datumFrom(params: unknown): CalendarDatum | null {
    const value = (params as { value?: unknown })?.value;
    if (!Array.isArray(value) || typeof value[0] !== 'string') return null;
    return value as CalendarDatum;
}

function tooltip(params: unknown): string {
    const value = datumFrom(params);
    if (!value) return '';

    const [date, pnl, trades] = value;
    const pnlColor = pnl >= 0 ? canvasColors.profit : canvasColors.loss;
    const tradeLabel = trades === 1 ? 'trade' : 'trades';

    return [
        `<div style="min-width:168px;font-family:${monoFontStack};">`,
        `<div style="margin-bottom:9px;color:#eef4f2;font-weight:700;">${dateLabel(date)}</div>`,
        '<div style="display:flex;justify-content:space-between;gap:20px;color:#78878a;">',
        `<span>NET P&amp;L</span><span style="color:${pnlColor};font-weight:700;">${signedMoney(pnl)}</span>`,
        '</div>',
        '<div style="display:flex;justify-content:space-between;gap:20px;margin-top:5px;color:#78878a;">',
        `<span>ACTIVITY</span><span style="color:#c8d2d0;">${trades} ${tradeLabel}</span>`,
        '</div>',
        '</div>',
    ].join('');
}

function buildOption(month: string, data: CalendarDatum[]): ChartOption {
    const largestResult = Math.max(1, ...data.map(([, pnl]) => Math.abs(pnl)));

    return {
        animationDuration: 420,
        animationDurationUpdate: 280,
        tooltip: {
            trigger: 'item',
            confine: true,
            formatter: tooltip,
            backgroundColor: '#10161a',
            borderColor: '#2b353b',
            borderWidth: 1,
            padding: [11, 13],
            textStyle: {
                color: '#c8d2d0',
                fontFamily: monoFontStack,
                fontSize: 12,
            },
            extraCssText: 'border-radius:8px;box-shadow:0 14px 34px rgba(0,0,0,.36);',
        },
        visualMap: {
            show: false,
            type: 'continuous',
            min: -largestResult,
            max: largestResult,
            dimension: 1,
            seriesIndex: 2,
            inRange: {
                color: [
                    '#38191a',
                    '#0a0d0f',
                    '#123424',
                ],
            },
        },
        calendar: {
            range: month,
            orient: 'vertical',
            left: 52,
            right: 12,
            top: chartTop,
            bottom: chartBottom,
            cellSize: ['auto', cellHeight],
            yearLabel: { show: false },
            monthLabel: { show: false },
            dayLabel: {
                show: true,
                firstDay: 1,
                position: 'start',
                margin: 16,
                nameMap: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
                color: canvasColors.faint,
                fontFamily: monoFontStack,
                fontSize: 11,
                fontWeight: 600,
            },
            itemStyle: {
                color: '#0e1214',
                borderWidth: 0,
            },
            splitLine: {
                show: false,
            },
        },
        series: [
            {
                type: 'scatter',
                coordinateSystem: 'calendar',
                data,
                symbolSize: 0,
                silent: true,
                z: 3,
                label: {
                    show: true,
                    position: 'inside',
                    offset: [0, -5],
                    formatter: (params) => {
                        const value = datumFrom(params);
                        if (!value) return '';
                        const [date, pnl, trades] = value;
                        const resultStyle = pnl >= 0 ? 'profit' : 'loss';
                        const result = trades > 0 ? signedMoney(pnl) : 'NO TRADES';
                        return `{date|${Number(date.slice(-2))}}\n{${trades > 0 ? resultStyle : 'empty'}|${result}}`;
                    },
                    rich: {
                        date: {
                            color: '#eef4f2',
                            fontFamily: monoFontStack,
                            fontSize: 15,
                            fontWeight: 700,
                            lineHeight: 28,
                        },
                        profit: {
                            color: canvasColors.profit,
                            fontFamily: monoFontStack,
                            fontSize: 12,
                            fontWeight: 700,
                            lineHeight: 22,
                        },
                        loss: {
                            color: canvasColors.loss,
                            fontFamily: monoFontStack,
                            fontSize: 12,
                            fontWeight: 700,
                            lineHeight: 22,
                        },
                        empty: {
                            color: '#4d5a5f',
                            fontFamily: monoFontStack,
                            fontSize: 9,
                            fontWeight: 500,
                            lineHeight: 22,
                        },
                    },
                },
            },
            {
                type: 'scatter',
                coordinateSystem: 'calendar',
                data,
                symbolSize: 0,
                silent: true,
                z: 3,
                label: {
                    show: true,
                    position: 'inside',
                    offset: [0, 25],
                    formatter: (params) => {
                        const value = datumFrom(params);
                        if (!value || value[2] === 0) return '';
                        const trades = value[2];
                        return `{trades|${trades} ${trades === 1 ? 'TRADE' : 'TRADES'}}`;
                    },
                    rich: {
                        trades: {
                            color: '#78878a',
                            fontFamily: monoFontStack,
                            fontSize: 9,
                            fontWeight: 500,
                            lineHeight: 16,
                        },
                    },
                },
            },
            {
                name: 'Daily P&L',
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data,
                itemStyle: {
                    borderColor: '#0e1214',
                    borderRadius: 12,
                    borderWidth: 8,
                },
                emphasis: {
                    itemStyle: {
                        borderColor: '#ffdd3a',
                        borderWidth: 1,
                        shadowBlur: 8,
                        shadowColor: 'rgba(255,221,58,0.1)',
                    },
                },
            },
        ],
    };
}

export function CalendarChart({ days, loading, month }: CalendarChartProps) {
    const chartNode = useRef<HTMLDivElement>(null);
    const chart = useRef<EChartsType | null>(null);
    const data = useMemo(() => buildMonthData(month, days), [days, month]);
    const height = chartTop + chartBottom + weekRows(month) * cellHeight;

    useEffect(() => {
        if (!chartNode.current) return;

        const instance = echarts.init(chartNode.current, undefined, { renderer: 'canvas' });
        const resizeObserver = new ResizeObserver(() => instance.resize());
        chart.current = instance;
        resizeObserver.observe(chartNode.current);

        return () => {
            resizeObserver.disconnect();
            instance.dispose();
            chart.current = null;
        };
    }, []);

    useEffect(() => {
        chart.current?.setOption(buildOption(month, data), { notMerge: true });
    }, [data, month]);

    useEffect(() => {
        if (loading) {
            chart.current?.showLoading('default', {
                text: 'LOADING MONTH',
                color: '#ffdd3a',
                textColor: canvasColors.faint,
                maskColor: 'rgba(14,18,20,0.68)',
                fontSize: 11,
                showSpinner: true,
            });
        } else {
            chart.current?.hideLoading();
        }
    }, [loading]);

    return (
        <div className="w-full overflow-x-auto">
            <div
                ref={chartNode}
                role="img"
                aria-label={`Daily profit and loss calendar for ${month}`}
                className="min-w-[720px] w-full"
                style={{ height }}
            />
        </div>
    );
}
