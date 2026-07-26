// Equity-series math for the dashboard chart — no React, no canvas.

import type { ApiTrade } from '@/stores/trades';

// Range keys → trailing-window length in days. YTD/ALL computed per-call.
export const RANGES = {
    '30D': 30,
    '90D': 90,
    YTD: 'ytd',
    ALL: 'all',
} as const;
export type RangeKey = keyof typeof RANGES;

// Real equity series for a range: cumulative starting_balance + closed-trade
// P&L, ordered by close time. `pts` is normalized to [0,1] against [lo,hi].
export interface Series {
    pts: number[];
    /** Timestamp (ms) per point — seed at the window start, then one per trade. */
    dates: number[];
    lo: number;
    hi: number;
}

// Window start (ms) for a range key, relative to now. ALL → 0 (everything).
function windowStart(key: RangeKey): number {
    const r = RANGES[key];
    if (r === 'all') return 0;
    if (r === 'ytd') return new Date(new Date().getFullYear(), 0, 1).getTime();
    return Date.now() - r * 86400_000;
}

/* Builds the equity series from closed trades. A trade counts as closed once
   it has a pnl (matching the dashboard stats), ordered by when it was logged
   (created_at). Equity climbs by each trade's pnl in that order; the window's
   first point is seeded at the running equity *before* the window (so a 30D
   view starts at the right balance, not the base). Flat line at
   startingBalance when nothing closed. */
const closedTime = (t: ApiTrade) => Date.parse(t.created_at);

export function buildSeries(
    trades: ApiTrade[],
    startingBalance: number,
    key: RangeKey,
): Series {
    const closed = trades
        .filter((t) => t.pnl !== null)
        .sort((a, b) => closedTime(a) - closedTime(b));

    const start = windowStart(key);
    let running = startingBalance;
    let i = 0;
    // Fast-forward through trades that closed before the window.
    for (; i < closed.length && closedTime(closed[i]) < start; i++)
        running += parseFloat(closed[i].pnl!);

    const equity = [running]; // seed at pre-window running equity
    // Seed date: window start, or the first in-window trade (ALL has start 0).
    const dates = [start > 0 ? start : (closed[i] ? closedTime(closed[i]) : Date.now())];
    for (; i < closed.length; i++) {
        running += parseFloat(closed[i].pnl!);
        equity.push(running);
        dates.push(closedTime(closed[i]));
    }
    // Nothing closed in-window: draw a flat 2-point line, not a single point
    // (the geometry divides by the trade-index span).
    if (equity.length === 1) {
        equity.push(running);
        dates.push(Date.now());
    }

    let lo = Math.min(...equity);
    let hi = Math.max(...equity);
    if (lo === hi) {
        // Flat series: pad so normalization doesn't divide by zero.
        const pad = Math.abs(lo) * 0.01 || 1;
        lo -= pad;
        hi += pad;
    }
    const span = hi - lo;
    const pts = equity.map((v) => (v - lo) / span);
    return { pts, dates, lo, hi };
}
