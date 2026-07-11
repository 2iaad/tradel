import type { ApiTrade } from "@/stores/trades";

// Display row for the trade log table, derived from an API trade.
export interface TradeLogRow {
    id: string;
    ts: number; // opened_at epoch — sort key
    sym: string;
    side: "LONG" | "SHORT";
    setup: string; // ponytail: no backend column yet — always empty
    entry: string;
    exit: string | null;
    size: string;
    rv: number | null;
    pnlv: number | null;
    date: string;
    time: string;
    openedAt: string; // ISO — edit-form prefill
    closedAt: string | null;
    noteTitle: string; // ponytail: journal notes have no backend yet
    noteBody: string;
    tags: [string, string];
}

// "JUL 01"-style stamp.
const day = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();

// Maps an API trade to the shape the log table renders.
export function toTradeLogRow(t: ApiTrade): TradeLogRow {
    const opened = new Date(t.opened_at);
    const clock = opened.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    return {
        id: t.id,
        ts: opened.getTime(),
        sym: t.symbol,
        side: t.side,
        setup: "",
        entry: t.entry,
        exit: t.exit,
        size: t.size,
        rv: t.r === null ? null : parseFloat(t.r),
        pnlv: t.pnl === null ? null : parseFloat(t.pnl),
        date: day(opened),
        time: `${day(opened)} · ${clock}`,
        openedAt: t.opened_at,
        closedAt: t.closed_at,
        noteTitle: "",
        noteBody: "",
        tags: ["", ""],
    };
}
