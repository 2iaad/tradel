'use client';

import { useEffect, useMemo, useRef } from 'react';
import { PieChart, type PieSeriesOption } from 'echarts/charts';
import {
    LegendComponent,
    type LegendComponentOption,
    TooltipComponent,
    type TooltipComponentOption,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import type { ComposeOption, EChartsType } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

import { canvasColors, G, monoFontStack, R } from '@/lib/ui';

echarts.use([PieChart, LegendComponent, TooltipComponent, CanvasRenderer]);

const BE = canvasColors.faint;

type ChartOption = ComposeOption<
    PieSeriesOption | LegendComponentOption | TooltipComponentOption
>;

interface WinRateDonutProps {
    wins: number;
    losses: number;
    breakevens: number;
}

function pieTooltip(params: unknown): string {
    const item = params as { name?: string; value?: unknown; percent?: unknown };
    const name = item.name ?? 'Trades';
    const value = typeof item.value === 'number' ? item.value : Number(item.value ?? 0);
    const percent = typeof item.percent === 'number' ? item.percent : Number(item.percent ?? 0);

    return `${name}<br/><span style="color:${canvasColors.grayLight};font-weight:700;">${value}</span> (${percent.toFixed(1)}%)`;
}

function buildOption(wins: number, losses: number, breakevens: number): ChartOption {
    const counts: Record<string, number> = {
        Wins: wins,
        Losses: losses,
        Breakevens: breakevens,
    };

    return {
        color: [G, R, BE],
        animationDuration: 420,
        animationDurationUpdate: 240,
        legend: {
            bottom: 0,
            left: 'center',
            icon: 'circle',
            selectedMode: false,
            itemWidth: 10,
            itemHeight: 10,
            itemGap: 13,
            formatter: (name) => `${name} ${counts[name] ?? 0}`,
            textStyle: {
                color: canvasColors.grayLight,
                fontFamily: monoFontStack,
                fontSize: 11,
            },
        },
        tooltip: {
            trigger: 'item',
            backgroundColor: canvasColors.surface,
            borderColor: canvasColors.border,
            borderWidth: 1,
            padding: [8, 10],
            textStyle: {
                color: canvasColors.grayLight,
                fontFamily: monoFontStack,
                fontSize: 12,
            },
            extraCssText: 'border-radius:8px;box-shadow:0 12px 28px rgba(0,0,0,.32);',
            formatter: pieTooltip,
        },
        series: [
            {
                name: 'Win Rate',
                type: 'pie',
                radius: ['50%', '76%'],
                center: ['50%', '42%'],
                minAngle: 2,
                avoidLabelOverlap: true,
                label: { show: false },
                labelLine: { show: false },
                itemStyle: {
                    borderRadius: 10,
                    borderColor: canvasColors.card,
                    borderWidth: 2,
                },
                emphasis: {
                    scale: false,
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0,0,0,.22)',
                    },
                },
                data: [
                    { value: wins, name: 'Wins' },
                    { value: losses, name: 'Losses' },
                    { value: breakevens, name: 'Breakevens' },
                ],
            },
        ],
    };
}

// Wins / losses / breakevens as an ECharts rounded-border doughnut.
export function WinRateDonut({ wins, losses, breakevens }: WinRateDonutProps) {
    const chartNode = useRef<HTMLDivElement>(null);
    const chart = useRef<EChartsType | null>(null);
    const option = useMemo(
        () => buildOption(wins, losses, breakevens),
        [wins, losses, breakevens],
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

    return (
        <div
            ref={chartNode}
            role="img"
            aria-label={`Win rate chart: ${wins} wins, ${losses} losses, ${breakevens} breakevens`}
            className="h-[178px] w-full"
        />
    );
}
