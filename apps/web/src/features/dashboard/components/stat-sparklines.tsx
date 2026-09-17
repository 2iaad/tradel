'use client';

import { BarChart, LineChart, type BarSeriesOption, type LineSeriesOption } from 'echarts/charts';
import {
    GridComponent,
    TooltipComponent,
    type GridComponentOption,
    type TooltipComponentOption,
} from 'echarts/components';
import type { ComposeOption, EChartsType } from 'echarts/core';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useMemo, useRef } from 'react';

import { signedMoney } from '@/lib/format';
import { canvasColors, G, monoFontStack, R } from '@/lib/ui';

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

type MiniBarOption = ComposeOption<BarSeriesOption | GridComponentOption | TooltipComponentOption>;
type MiniLineOption = ComposeOption<
    LineSeriesOption | GridComponentOption | TooltipComponentOption
>;

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => {
        const entities: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return entities[char] ?? char;
    });
}

function buildMiniBarOption({
    values,
    labels,
    unit,
    showX,
    colors,
}: {
    values: number[];
    labels: string[];
    unit: 'money' | 'r';
    showX: boolean;
    colors?: string[];
}): MiniBarOption {
    const fmt = (v: number) =>
        unit === 'money' ? signedMoney(v) : `${v > 0 ? '+' : ''}${v.toFixed(2)}R`;
    const barColors = colors ?? values.map((v) => (v > 0 ? G : v < 0 ? R : canvasColors.faint));

    return {
        animationDuration: 420,
        animationDurationUpdate: 240,
        grid: {
            left: 0,
            right: 0,
            top: 8,
            bottom: showX ? 24 : 2,
            containLabel: false,
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
                shadowStyle: {
                    color: 'rgba(255,255,255,.04)',
                },
            },
            backgroundColor: canvasColors.black,
            borderColor: canvasColors.border,
            borderWidth: 1,
            padding: [8, 10],
            textStyle: {
                color: canvasColors.grayLight,
                fontFamily: monoFontStack,
                fontSize: 12,
            },
            extraCssText: 'border-radius:6px;box-shadow:0 12px 26px rgba(0,0,0,.32);',
            formatter: (params: unknown) => {
                const point = Array.isArray(params) ? params[0] : params;
                const item = point as { axisValue?: unknown; value?: unknown; color?: string };
                const value = typeof item.value === 'number' ? item.value : Number(item.value ?? 0);
                const label = String(item.axisValue ?? '');
                const color = item.color ?? canvasColors.faint;

                return [
                    `<strong style="color:${canvasColors.grayLight};">${escapeHtml(label)}</strong>`,
                    `<br/><span style="display:inline-block;width:9px;height:9px;background:${color};margin-right:5px;"></span>${escapeHtml(fmt(value))}`,
                ].join('');
            },
        },
        xAxis: {
            type: 'category',
            data: labels,
            axisTick: {
                alignWithLabel: true,
                lineStyle: {
                    color: canvasColors.borderFaint,
                },
            },
            axisLine: {
                lineStyle: {
                    color: canvasColors.borderFaint,
                },
            },
            axisLabel: {
                show: showX,
                color: canvasColors.faint,
                fontFamily: monoFontStack,
                fontSize: 10,
                margin: 8,
                hideOverlap: true,
            },
        },
        yAxis: {
            type: 'value',
            min: Math.min(0, ...values),
            max: Math.max(0, ...values),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            splitLine: { show: false },
        },
        series: [
            {
                name: unit === 'money' ? 'P&L' : 'R:R',
                type: 'bar',
                barWidth: '60%',
                data: values.map((value, index) => ({
                    value,
                    itemStyle: {
                        color: barColors[index] ?? canvasColors.faint,
                    },
                })),
            },
        ],
    };
}

// Tiny ECharts bar chart for the stat cards, based on bar-tick-align.
export function MiniBars({
    values,
    labels,
    unit,
    showX = false,
    colors,
}: {
    values: number[];
    labels: string[];
    unit: 'money' | 'r';
    showX?: boolean;
    colors?: string[];
}) {
    const chartNode = useRef<HTMLDivElement>(null);
    const chart = useRef<EChartsType | null>(null);
    const option = useMemo(
        () => buildMiniBarOption({ values, labels, unit, showX, colors }),
        [colors, labels, showX, unit, values],
    );

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
        chart.current?.setOption(option, { notMerge: true });
    }, [option]);

    return <div ref={chartNode} className="mt-4 h-[120px] w-full" />;
}

function buildMiniLineOption({
    values,
    labels,
    unit,
    color,
}: {
    values: number[];
    labels: string[];
    unit: 'money' | 'r';
    color: string;
}): MiniLineOption {
    const plotValues = values.length ? values : [0];
    const plotLabels = labels.length ? labels : ['—'];
    const min = Math.min(...plotValues);
    const max = Math.max(...plotValues);
    const padding = min === max ? Math.max(Math.abs(min) * 0.02, 1) : (max - min) * 0.08;

    return {
        // The wrapper provides the deterministic reveal animation below;
        // keep ECharts static so it cannot race that clip animation.
        animation: false,
        grid: {
            left: 0,
            right: 0,
            top: 10,
            bottom: 2,
            containLabel: false,
        },
        tooltip: { show: false },
        xAxis: {
            type: 'category',
            // A normal horizontal axis makes ECharts reveal the initial
            // clip-path animation from left to right.
            data: plotLabels,
            axisTick: {
                show: false,
            },
            axisLine: { show: false },
            axisLabel: {
                show: false,
            },
        },
        yAxis: {
            type: 'value',
            min: min - padding,
            max: max + padding,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            splitLine: { show: false },
        },
        series: [
            {
                name: unit === 'money' ? 'Equity' : 'R:R',
                type: 'line',
                data: plotValues,
                smooth: 0.35,
                showSymbol: false,
                symbol: 'none',
                silent: true,
                lineStyle: {
                    color,
                    width: 2.5,
                    cap: 'round',
                    join: 'round',
                },
                emphasis: { disabled: true },
            },
        ],
    };
}

// Tiny ECharts line chart for the Total P&L card. It is intentionally a
// non-interactive sparkline with no x-axis labels or hover affordances.
export function MiniLine({
    values,
    labels,
    unit,
    color = G,
}: {
    values: number[];
    labels: string[];
    unit: 'money' | 'r';
    color?: string;
}) {
    const chartNode = useRef<HTMLDivElement>(null);
    const revealNode = useRef<HTMLDivElement>(null);
    const chart = useRef<EChartsType | null>(null);
    const option = useMemo(
        () => buildMiniLineOption({ values, labels, unit, color }),
        [color, labels, unit, values],
    );

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
        chart.current?.setOption(option, { notMerge: true });
    }, [option]);

    useEffect(() => {
        const node = revealNode.current;
        if (!node) return;

        const duration = 1600;
        let startedAt: number | null = null;
        let frame = 0;
        const tick = (now: number) => {
            startedAt ??= now;
            const progress = Math.min((now - startedAt) / duration, 1);
            const hiddenRight = (1 - progress) * 100;
            node.style.clipPath = `inset(0 ${hiddenRight}% 0 0)`;
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <div
            ref={revealNode}
            className="equity-line-reveal mt-4 h-[120px] w-full overflow-hidden"
            style={{ clipPath: 'inset(0 100% 0 0)' }}
        >
            <div ref={chartNode} className="h-full w-full" />
        </div>
    );
}
