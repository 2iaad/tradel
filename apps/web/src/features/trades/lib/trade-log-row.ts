import type { ApiTrade } from '@/features/trades/types';

// Shared column template for the trade-log header + rows (must match exactly).
// DATE · SYMBOL · SIDE · ENTRY · EXIT · LOTS · P&L · R:R · chevron · icons.
export const LOG_GRID = 'grid grid-cols-[104px_1fr_80px_88px_88px_64px_100px_64px_14px_44px] gap-2';

// Display row for the trade log table, derived from an API trade.
export interface TradeLogRow {
    id: string;
    ts: number;
    sym: string;
    side: 'LONG' | 'SHORT';
    setup: string;
    entry: string;
    exit: string | null;
    lots: string;
    rv: number | null;
    pnlv: number | null;
    date: string;
    clock: string;
    time: string;
    noteTitle: string;
    noteBody: string;
    tags: [string, string];
}

// "JUL 01"-style stamp.
const day = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();

// Maps an API trade to the shape the log table renders.
export function toTradeLogRow(t: ApiTrade): TradeLogRow {
    const created = new Date(t.created_at);
    const clock = created.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    return {
        id: t.id,
        ts: created.getTime(),
        sym: t.symbol,
        side: t.side,
        setup: '',
        entry: t.entry,
        exit: t.exit,
        lots: t.lots,
        rv: t.risk_reward === null ? null : parseFloat(t.risk_reward),
        pnlv: t.pnl === null ? null : parseFloat(t.pnl),
        date: day(created),
        clock,
        time: `${day(created)} · ${clock}`,
        noteTitle: '',
        noteBody: '',
        tags: ['', ''],
    };
}
