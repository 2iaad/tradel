import type { ApiTrade } from '@/stores/trades';

export interface EquityPoint {
    cumulative: number;
    date: string;
    dateKey: string;
    dateShort: string;
    pnl: number;
    trade: number;
}

export interface DailyPnlPoint {
    date: string;
    dateKey: string;
    dateShort: string;
    pnl: number;
}

export interface EquityChartData {
    dailyPoints: DailyPnlPoint[];
    dateLabelsByTrade: Record<number, string>;
    dateTicks: number[];
    deepestDip: number;
    gradientOffset: number;
    greenDays: number;
    net: number;
    peak: number;
    peakTrade: number | null;
    redDays: number;
    tradePoints: EquityPoint[];
}

const validClosedTrade = (trade: ApiTrade) => {
    if (trade.pnl === null) return false;
    const pnl = Number(trade.pnl);
    const timestamp = Date.parse(trade.created_at);
    return Number.isFinite(pnl) && Number.isFinite(timestamp);
};

const dateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const sampleDateTicks = (points: EquityPoint[], limit = 8) => {
    const firstTradeByDay: Array<{ trade: number; label: string }> = [];
    const seen = new Set<string>();

    for (const point of points) {
        if (seen.has(point.dateKey)) continue;
        seen.add(point.dateKey);
        firstTradeByDay.push({ trade: point.trade, label: point.dateShort });
    }

    const sampled =
        firstTradeByDay.length <= limit
            ? firstTradeByDay
            : Array.from({ length: limit }, (_, index) => {
                  const position = (index * (firstTradeByDay.length - 1)) / (limit - 1);
                  return firstTradeByDay[Math.round(position)];
              });

    return {
        dateTicks: sampled.map((point) => point.trade),
        dateLabelsByTrade: Object.fromEntries(
            sampled.map((point) => [point.trade, point.label]),
        ) as Record<number, string>,
    };
};

// Builds both visualizations in the reference card from the active account's
// closed trades. `created_at` is currently the product's only trade timestamp,
// so it is also the chart's chronological/closing timestamp.
export function buildEquityChartData(trades: ApiTrade[]): EquityChartData {
    const closed = trades
        .filter(validClosedTrade)
        .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

    let cumulative = 0;
    const tradePoints: EquityPoint[] = closed.map((trade, index) => {
        const pnl = Number(trade.pnl);
        const date = new Date(trade.created_at);
        cumulative += pnl;

        return {
            cumulative,
            date: date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
            dateKey: dateKey(date),
            dateShort: date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            }),
            pnl,
            trade: index + 1,
        };
    });

    const dailyByDate = new Map<string, DailyPnlPoint>();
    for (const point of tradePoints) {
        const current = dailyByDate.get(point.dateKey);
        if (current) current.pnl += point.pnl;
        else {
            dailyByDate.set(point.dateKey, {
                date: point.date,
                dateKey: point.dateKey,
                dateShort: point.dateShort,
                pnl: point.pnl,
            });
        }
    }
    const dailyPoints = [...dailyByDate.values()];

    let runningPeak = 0;
    let deepestDip = 0;
    let peak = 0;
    let peakTrade: number | null = null;
    for (const point of tradePoints) {
        if (point.cumulative > peak) {
            peak = point.cumulative;
            peakTrade = point.trade;
        }
        runningPeak = Math.max(runningPeak, point.cumulative);
        deepestDip = Math.min(deepestDip, point.cumulative - runningPeak);
    }

    const lowest = Math.min(0, ...tradePoints.map((point) => point.cumulative));
    const highest = Math.max(0, ...tradePoints.map((point) => point.cumulative));
    const gradientOffset =
        highest <= 0 ? 0 : lowest >= 0 ? 1 : highest / (highest - lowest);
    const ticks = sampleDateTicks(tradePoints);

    return {
        dailyPoints,
        ...ticks,
        deepestDip,
        gradientOffset,
        greenDays: dailyPoints.filter((point) => point.pnl >= 0).length,
        net: tradePoints.at(-1)?.cumulative ?? 0,
        peak,
        peakTrade,
        redDays: dailyPoints.filter((point) => point.pnl < 0).length,
        tradePoints,
    };
}
