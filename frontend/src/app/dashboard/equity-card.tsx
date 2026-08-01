'use client';

import { useMemo, useState } from 'react';
import { ChartNoAxesCombined } from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ReferenceDot,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipContentProps,
} from 'recharts';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    cardCls,
    cardDescriptionCls,
    cardFooterCls,
    cardMetaLabelCls,
    cardTitleCls,
    monoFontStack,
} from '@/lib/ui';
import { useAccountStore } from '@/stores/accounts';
import { useTradesStore } from '@/stores/trades';
import {
    buildEquityChartData,
    type DailyPnlPoint,
    type EquityPoint,
} from './equity-chart.lib';

type ChartMode = 'equity' | 'pnl';

const PROFIT = 'var(--profit)';
const LOSS = 'var(--loss)';

function currencySymbol(currency: string) {
    try {
        const parts = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
        }).formatToParts(0);
        return parts.find((part) => part.type === 'currency')?.value ?? currency;
    } catch {
        return currency;
    }
}

function formatMoney(value: number, currency: string, signed = false) {
    const sign = value < 0 ? '-' : signed && value > 0 ? '+' : '';
    const absolute = Math.abs(value);

    try {
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(absolute);
        return `${sign}${formatted}`;
    } catch {
        return `${sign}${currency} ${absolute.toFixed(2)}`;
    }
}

function formatRoundedMoney(value: number, currency: string, signed = false) {
    const sign = value < 0 ? '-' : signed && value > 0 ? '+' : '';
    return `${sign}${currencySymbol(currency)}${Math.abs(Math.round(value)).toLocaleString('en-US')}`;
}

function formatAxisMoney(value: number, currency: string) {
    const absolute = Math.abs(value);
    const compact =
        absolute >= 1_000
            ? `${(absolute / 1_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`
            : Math.round(absolute).toLocaleString('en-US');
    return `${value < 0 ? '-' : ''}${currencySymbol(currency)}${compact}`;
}

type EquityTooltipProps = TooltipContentProps & {
    currency: string;
};

function EquityTooltip({ active, payload, currency }: EquityTooltipProps) {
    const point = payload?.[0]?.payload as EquityPoint | undefined;
    if (!active || !point) return null;

    return (
        <div className="min-w-44 space-y-1.5 rounded-lg border border-border bg-popover px-3 py-2 text-ui-xs shadow-xl">
            <p className="font-medium text-content">
                {point.date} · Trade #{point.trade}
            </p>
            <div className="flex items-center justify-between gap-6">
                <span className="text-content-faint">This trade</span>
                <span
                    className="font-mono font-semibold tabular-nums"
                    style={{ color: point.pnl >= 0 ? PROFIT : LOSS }}
                >
                    {formatMoney(point.pnl, currency, true)}
                </span>
            </div>
            <div className="flex items-center justify-between gap-6">
                <span className="text-content-faint">Running total</span>
                <span
                    className="font-mono font-semibold tabular-nums"
                    style={{ color: point.cumulative >= 0 ? PROFIT : LOSS }}
                >
                    {formatMoney(point.cumulative, currency, true)}
                </span>
            </div>
        </div>
    );
}

type DailyTooltipProps = TooltipContentProps & {
    currency: string;
};

function DailyTooltip({ active, payload, currency }: DailyTooltipProps) {
    const point = payload?.[0]?.payload as DailyPnlPoint | undefined;
    if (!active || !point) return null;

    return (
        <div className="min-w-40 space-y-1.5 rounded-lg border border-border bg-popover px-3 py-2 text-ui-xs shadow-xl">
            <p className="font-medium text-content">{point.date}</p>
            <div className="flex items-center justify-between gap-6">
                <span className="text-content-faint">Day&apos;s P&amp;L</span>
                <span
                    className="font-mono font-semibold tabular-nums"
                    style={{ color: point.pnl >= 0 ? PROFIT : LOSS }}
                >
                    {formatMoney(point.pnl, currency, true)}
                </span>
            </div>
        </div>
    );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="flex min-w-0 flex-col gap-0.5">
            <span className={cardMetaLabelCls}>{label}</span>
            <span className="truncate font-mono text-ui-sm font-semibold tabular-nums" style={{ color }}>
                {value}
            </span>
        </div>
    );
}

function MetricDivider() {
    return <div aria-hidden="true" className="h-7 w-px shrink-0 bg-border-subtle" />;
}

function ChartEmptyState() {
    return (
        <div className="flex h-[280px] flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg border border-border-subtle bg-muted text-content-faint">
                <ChartNoAxesCombined aria-hidden="true" className="size-5" />
            </div>
            <div className="space-y-1">
                <p className="text-ui-md font-semibold text-content">No trades to chart yet</p>
                <p className="text-ui-sm text-content-faint">
                    Log your first closed trade and your equity curve starts here.
                </p>
            </div>
        </div>
    );
}

export function EquityCard() {
    const [mode, setMode] = useState<ChartMode>('equity');
    const trades = useTradesStore((state) => state.trades);
    const accounts = useAccountStore((state) => state.accounts);
    const activeId = useAccountStore((state) => state.activeId);
    const currency = accounts.find((account) => account.id === activeId)?.currency ?? 'USD';
    const chart = useMemo(() => buildEquityChartData(trades), [trades]);

    const dailyStats = useMemo(() => {
        if (!chart.dailyPoints.length) return { avg: 0, best: 0, worst: 0 };
        const values = chart.dailyPoints.map((point) => point.pnl);
        return {
            avg: values.reduce((sum, value) => sum + value, 0) / values.length,
            best: Math.max(...values),
            worst: Math.min(...values),
        };
    }, [chart.dailyPoints]);

    const hasTrades = chart.tradePoints.length > 0;
    const lastPoint = chart.tradePoints.at(-1);
    const firstDate = chart.tradePoints[0]?.dateShort;
    const lastDate = lastPoint?.dateShort;

    return (
        <Card className={`${cardCls} gap-0 py-0`}>
            <CardHeader className="gap-0 px-[22px] pb-3 pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <CardTitle className={cardTitleCls}>
                            {mode === 'equity' ? 'Equity curve' : 'Daily P&L'}
                        </CardTitle>
                        <CardDescription className={cardDescriptionCls}>
                            {mode === 'equity'
                                ? 'Cumulative profit and loss, trade by trade'
                                : 'Profit and loss for each trading day'}
                        </CardDescription>
                    </div>
                    <div className="flex w-fit items-center rounded-lg border border-border-subtle bg-muted p-[3px]">
                        {(['equity', 'pnl'] as const).map((value) => {
                            const selected = value === mode;
                            return (
                                <Button
                                    key={value}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => setMode(value)}
                                    variant="ghost"
                                    size="sm"
                                    className={`h-auto rounded-md px-3 py-1.5 font-mono text-ui-xs ${
                                        selected
                                            ? 'bg-card text-content shadow-sm hover:bg-card hover:text-content'
                                            : 'text-content-faint hover:bg-accent hover:text-secondary-foreground'
                                    }`}
                                >
                                    {value === 'equity' ? 'Equity' : 'P&L'}
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {hasTrades && (
                    <div className="mt-4 flex items-center gap-4 sm:gap-5">
                        {mode === 'equity' ? (
                            <>
                                <Metric
                                    label="Net"
                                    value={formatRoundedMoney(chart.net, currency, true)}
                                    color={chart.net >= 0 ? PROFIT : LOSS}
                                />
                                <MetricDivider />
                                <Metric
                                    label="Peak"
                                    value={formatRoundedMoney(chart.peak, currency)}
                                    color={PROFIT}
                                />
                                <MetricDivider />
                                <Metric
                                    label="Deepest dip"
                                    value={formatRoundedMoney(chart.deepestDip, currency)}
                                    color={chart.deepestDip < 0 ? LOSS : 'var(--content-faint)'}
                                />
                            </>
                        ) : (
                            <>
                                <Metric
                                    label="Best day"
                                    value={formatRoundedMoney(dailyStats.best, currency, true)}
                                    color={dailyStats.best >= 0 ? PROFIT : LOSS}
                                />
                                <MetricDivider />
                                <Metric
                                    label="Worst day"
                                    value={formatRoundedMoney(dailyStats.worst, currency, true)}
                                    color={dailyStats.worst < 0 ? LOSS : PROFIT}
                                />
                                <MetricDivider />
                                <Metric
                                    label="Avg / day"
                                    value={formatRoundedMoney(dailyStats.avg, currency, true)}
                                    color={dailyStats.avg >= 0 ? PROFIT : LOSS}
                                />
                            </>
                        )}
                    </div>
                )}
            </CardHeader>

            <CardContent className="px-2 pb-2 pt-0 sm:px-4">
                {!hasTrades ? (
                    <ChartEmptyState />
                ) : (
                    <div className="h-[280px] w-full" aria-label={mode === 'equity' ? 'Equity curve chart' : 'Daily profit and loss chart'}>
                        <ResponsiveContainer width="100%" height="100%">
                            {mode === 'equity' ? (
                                <AreaChart
                                    accessibilityLayer
                                    data={chart.tradePoints}
                                    margin={{ top: 20, right: 20, bottom: 16, left: 12 }}
                                >
                                    <defs>
                                        <linearGradient id="equity-fill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0" stopColor={PROFIT} stopOpacity={0.45} />
                                            <stop offset={chart.gradientOffset} stopColor={PROFIT} stopOpacity={0.04} />
                                            <stop offset={chart.gradientOffset} stopColor={LOSS} stopOpacity={0.04} />
                                            <stop offset="1" stopColor={LOSS} stopOpacity={0.45} />
                                        </linearGradient>
                                        <linearGradient id="equity-stroke" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0" stopColor={PROFIT} />
                                            <stop offset={chart.gradientOffset} stopColor={PROFIT} />
                                            <stop offset={chart.gradientOffset} stopColor={LOSS} />
                                            <stop offset="1" stopColor={LOSS} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        vertical={false}
                                        stroke="var(--border)"
                                        strokeOpacity={0.42}
                                    />
                                    <XAxis
                                        dataKey="trade"
                                        type="number"
                                        domain={['dataMin', 'dataMax']}
                                        ticks={chart.dateTicks}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        tickFormatter={(value: number) => chart.dateLabelsByTrade[value] ?? ''}
                                        tick={{
                                            fill: 'var(--content-faint)',
                                            fontFamily: monoFontStack,
                                            fontSize: 10,
                                        }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        domain={[(minimum: number) => Math.min(0, minimum), (maximum: number) => Math.max(0, maximum)]}
                                        tickFormatter={(value: number) => formatAxisMoney(value, currency)}
                                        tick={{
                                            fill: 'var(--content-faint)',
                                            fontFamily: monoFontStack,
                                            fontSize: 10,
                                        }}
                                        width={58}
                                    />
                                    <ReferenceLine
                                        y={0}
                                        stroke="var(--border-hover)"
                                        strokeDasharray="3 3"
                                    />
                                    {chart.peak > 0 && (
                                        <ReferenceLine
                                            y={chart.peak}
                                            stroke={PROFIT}
                                            strokeOpacity={0.28}
                                            strokeDasharray="2 4"
                                        />
                                    )}
                                    <Tooltip
                                        cursor={false}
                                        content={(props) => <EquityTooltip {...props} currency={currency} />}
                                    />
                                    <Area
                                        dataKey="cumulative"
                                        type="monotone"
                                        baseValue={0}
                                        fill="url(#equity-fill)"
                                        stroke="url(#equity-stroke)"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{
                                            r: 4,
                                            fill: chart.net >= 0 ? PROFIT : LOSS,
                                            stroke: 'var(--background)',
                                            strokeWidth: 2,
                                        }}
                                        animationDuration={650}
                                    />
                                    {lastPoint && (
                                        <ReferenceDot
                                            x={lastPoint.trade}
                                            y={lastPoint.cumulative}
                                            r={4}
                                            fill={chart.net >= 0 ? PROFIT : LOSS}
                                            stroke="var(--background)"
                                            strokeWidth={2}
                                        />
                                    )}
                                    {chart.peakTrade !== null && (
                                        <ReferenceDot
                                            x={chart.peakTrade}
                                            y={chart.peak}
                                            r={3}
                                            fill={PROFIT}
                                            stroke="var(--background)"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                </AreaChart>
                            ) : (
                                <BarChart
                                    accessibilityLayer
                                    data={chart.dailyPoints}
                                    margin={{ top: 12, right: 20, bottom: 16, left: 12 }}
                                    barCategoryGap="20%"
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        stroke="var(--border)"
                                        strokeOpacity={0.42}
                                    />
                                    <XAxis
                                        dataKey="dateShort"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        minTickGap={24}
                                        interval="preserveStartEnd"
                                        tick={{
                                            fill: 'var(--content-faint)',
                                            fontFamily: monoFontStack,
                                            fontSize: 10,
                                        }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        tickFormatter={(value: number) => formatAxisMoney(value, currency)}
                                        tick={{
                                            fill: 'var(--content-faint)',
                                            fontFamily: monoFontStack,
                                            fontSize: 10,
                                        }}
                                        width={58}
                                    />
                                    <ReferenceLine y={0} stroke="var(--border-hover)" />
                                    <ReferenceLine
                                        y={dailyStats.avg}
                                        stroke="var(--content-faint)"
                                        strokeOpacity={0.55}
                                        strokeDasharray="4 4"
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--muted)', fillOpacity: 0.55 }}
                                        content={(props) => <DailyTooltip {...props} currency={currency} />}
                                    />
                                    <Bar
                                        dataKey="pnl"
                                        radius={[3, 3, 0, 0]}
                                        maxBarSize={28}
                                        animationDuration={520}
                                    >
                                        {chart.dailyPoints.map((point) => (
                                            <Cell
                                                key={point.dateKey}
                                                fill={point.pnl >= 0 ? PROFIT : LOSS}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>

            {hasTrades && (
                <CardFooter className={cardFooterCls}>
                    <div className="flex w-full items-end justify-between gap-4">
                        {mode === 'equity' ? (
                            <>
                                <div className="flex min-w-0 flex-col gap-0.5">
                                    <span className={cardMetaLabelCls}>Period</span>
                                    <span className="truncate text-ui-sm font-semibold text-content">
                                        {firstDate} – {lastDate}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5 text-right">
                                    <span className={cardMetaLabelCls}>Trades</span>
                                    <span className="font-mono text-ui-sm font-semibold tabular-nums text-content">
                                        {chart.tradePoints.length}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <Metric
                                    label="Green days"
                                    value={chart.greenDays.toLocaleString('en-US')}
                                    color={PROFIT}
                                />
                                <div className="text-center">
                                    <Metric
                                        label="Red days"
                                        value={chart.redDays.toLocaleString('en-US')}
                                        color={LOSS}
                                    />
                                </div>
                                <div className="text-right">
                                    <Metric
                                        label="Trades"
                                        value={chart.tradePoints.length.toLocaleString('en-US')}
                                        color="var(--content)"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}
