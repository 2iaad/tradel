"use client";

import { useEffect, useMemo } from "react";

import { signedMoney } from "@/lib/format";
import { useTradesStore } from "@/stores/trades";
import { G, R } from "@/lib/ui";
import { toTradeLogRow, TradeLogRow } from "./trades/use-trade-log";

// One stat card on the signed-in dashboard.
export interface Stat {
    label: string;
    value: string;
    vCol: string;
    sub: string;
    sCol: string;
}

// Headline stats derived from the full trade list.
function computeStats(rows: TradeLogRow[]): Stat[] {
    const closed = rows.filter((t) => t.pnlv !== null);
    const wins = closed.filter((t) => (t.pnlv ?? 0) > 0);
    const net = closed.reduce((s, t) => s + (t.pnlv ?? 0), 0);
    const grossWin = wins.reduce((s, t) => s + (t.pnlv ?? 0), 0);
    const grossLoss = Math.abs(
        closed.reduce((s, t) => s + Math.min(t.pnlv ?? 0, 0), 0),
    );
    const pf = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : "—";
    const winRate = closed.length
        ? `${((wins.length / closed.length) * 100).toFixed(1)}%`
        : "—";
    return [
        {
            label: "NET P&L",
            value: closed.length ? signedMoney(net) : "—",
            vCol: net >= 0 ? G : R,
            sub: `${closed.length} CLOSED TRADES`,
            sCol: "#5f6b70",
        },
        {
            label: "WIN RATE",
            value: winRate,
            vCol: "#eef4f2",
            sub: `${wins.length}W · ${closed.length - wins.length}L`,
            sCol: "#5f6b70",
        },
        {
            label: "PROFIT FACTOR",
            value: pf,
            vCol: "#eef4f2",
            sub: "GROSS PROFIT / LOSS",
            sCol: "#5f6b70",
        },
        {
            label: "TRADES LOGGED",
            value: String(rows.length),
            vCol: "#eef4f2",
            sub: `${rows.length - closed.length} OPEN`,
            sCol: "#5f6b70",
        },
    ];
}

// Loads the trade log and derives the signed-in dashboard's stats + recent rows.
export function useDashboardData() {
    const apiTrades = useTradesStore((s) => s.trades);
    const loading = useTradesStore((s) => s.loading);
    const load = useTradesStore((s) => s.load);

    useEffect(() => {
        load();
    }, [load]);

    const rows = useMemo(() => apiTrades.map(toTradeLogRow), [apiTrades]);
    const stats = useMemo(() => computeStats(rows), [rows]);
    const recent = useMemo(
        () => [...rows].sort((a, b) => b.ts - a.ts).slice(0, 8),
        [rows],
    );

    return { stats, recent, loading };
}
