// Demo ticker symbols for the scrolling tapes.
export const TOP_TICKS = [
    ['AAPL', 1.24],
    ['NVDA', -0.86],
    ['TSLA', 2.31],
    ['SPY', 0.42],
    ['BTC', -1.12],
    ['ETH', 0.77],
    ['MSFT', -0.22],
    ['AMD', 1.92],
] as const;

export const BOTTOM_TICKS = [
    ['GOOG', 0.58],
    ['META', -0.44],
    ['QQQ', 0.31],
    ['AMZN', 0.35],
    ['SOL', -2.05],
    ['GLD', 0.19],
    ['OIL', -0.63],
    ['DXY', 0.08],
] as const;

export type Ticks = readonly (readonly [string, number])[];
