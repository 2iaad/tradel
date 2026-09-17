import { signedMoney } from '@/lib/format';
import { canvasColors, G, R } from '@/lib/ui';
import type { TradeLogRow } from './trade-log-row';

// Headline trade stats shared by the dashboard, trades, and analytics pages
// (cards + chip strip). Pure — pages pass whichever rows they want summarized.
export function computeTradeStats(rows: TradeLogRow[], startingBalance: number) {
    const money = (v: number) =>
        '$' + Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
    const n = rows.length;
    const net = rows.reduce((s, t) => s + (t.pnlv ?? 0), 0);
    const winRows = rows.filter((t) => (t.pnlv ?? 0) > 0);
    const lossRows = rows.filter((t) => (t.pnlv ?? 0) < 0);
    // Breakeven = a closed trade (has pnl) that netted exactly 0.
    const breakevens = rows.filter((t) => t.pnlv === 0).length;
    const wins = winRows.length;
    const grossW = winRows.reduce((s, t) => s + (t.pnlv ?? 0), 0);
    const grossL = -lossRows.reduce((s, t) => s + (t.pnlv ?? 0), 0);
    const rRows = rows.filter((t) => t.rv !== null);
    const avgR = rRows.length ? rRows.reduce((s, t) => s + (t.rv ?? 0), 0) / rRows.length : 0;

    // Best / worst closed trade.
    let best: TradeLogRow | null = null;
    let worst: TradeLogRow | null = null;
    for (const t of rows) {
        if (t.pnlv === null) continue;
        if (!best || t.pnlv > (best.pnlv ?? 0)) best = t;
        if (!worst || t.pnlv < (worst.pnlv ?? 0)) worst = t;
    }

    // Current win/loss streak, newest trade first.
    const closed = rows.filter((t) => t.pnlv !== null).sort((a, b) => b.ts - a.ts);
    let streak = '—';
    let streakWin = false;
    if (closed.length) {
        streakWin = (closed[0].pnlv ?? 0) > 0;
        let run = 0;
        for (const t of closed) {
            if ((t.pnlv ?? 0) > 0 === streakWin) run++;
            else break;
        }
        streak = `${run}${streakWin ? 'W' : 'L'}`;
    }

    const now = new Date();
    const monthNet = closed.reduce((s, t) => {
        const d = new Date(t.ts);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            ? s + (t.pnlv ?? 0)
            : s;
    }, 0);

    // Return % against the account's starting balance.
    const ret =
        startingBalance > 0
            ? `${net >= 0 ? '+' : ''}${((net / startingBalance) * 100).toFixed(1)}%`
            : null;

    // Keep the seven-day daily P&L series available to callers that need it.
    // The Total P&L sparkline below uses the cumulative equity curve instead.
    const dayBars: number[] = [];
    const dayLabels: string[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toDateString();
        dayBars.push(
            closed.reduce(
                (sum, t) => (new Date(t.ts).toDateString() === key ? sum + (t.pnlv ?? 0) : sum),
                0,
            ),
        );
        dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase());
    }
    const chron = [...closed].sort((a, b) => a.ts - b.ts);
    const rChron = chron.filter((t) => t.rv !== null).slice(-20);
    const rBarColors = rChron.map((t) =>
        (t.pnlv ?? 0) > 0 ? G : (t.pnlv ?? 0) < 0 ? R : canvasColors.faint,
    );
    // The mini chart in Total P&L is the account equity curve: start at the
    // opening balance, then add each closed trade in chronological order.
    let equity = startingBalance;
    const equityCurve = [equity];
    const equityLabels = ['START'];
    for (const trade of chron) {
        equity += trade.pnlv ?? 0;
        equityCurve.push(equity);
        equityLabels.push(
            new Date(trade.ts).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            }),
        );
    }
    const topTrades = [...closed].sort((a, b) => (b.pnlv ?? 0) - (a.pnlv ?? 0)).slice(0, 5);

    return {
        dayBars,
        dayLabels,
        equityCurve,
        equityLabels,
        rBars: rChron.map((t) => t.rv ?? 0),
        rBarLabels: rChron.map((t) => t.sym),
        rBarColors,
        topBars: topTrades.map((t) => t.pnlv ?? 0),
        topBarLabels: topTrades.map((t) => t.sym),
        count: n,
        net: signedMoney(net),
        netV: net,
        win: n ? `${((wins / n) * 100).toFixed(1)}%` : '—',
        winPctV: n ? (wins / n) * 100 : null,
        wins,
        losses: lossRows.length,
        breakevens,
        avgR: rRows.length ? `${avgR > 0 ? '+' : ''}${avgR.toFixed(2)}R` : '—',
        avgRPos: avgR >= 0,
        rCount: rRows.length,
        avgTrade: n ? signedMoney(net / n) : '—',
        avgWin: wins ? money(grossW / wins) : '—',
        avgLoss: lossRows.length ? money(grossL / lossRows.length) : '—',
        pf: grossL > 0 ? (grossW / grossL).toFixed(2) : '—',
        best: best ? signedMoney(best.pnlv ?? 0) : '—',
        bestSym: best?.sym ?? null,
        worst: worst ? signedMoney(worst.pnlv ?? 0) : '—',
        streak,
        streakWin,
        monthNet: signedMoney(monthNet),
        monthPos: monthNet >= 0,
        ret,
        retPos: net >= 0,
    };
}

export type TradeStats = ReturnType<typeof computeTradeStats>;
