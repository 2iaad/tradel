"use client";

import { useEffect, useMemo } from "react";

import { signedMoney } from "@/lib/format";
import { useAnalyticsStore } from "@/stores/analytics";
import type { Summary } from "@/stores/analytics";
import { useTradesStore } from "@/stores/trades";
import { G, R } from "@/lib/ui";
import { toTradeLogRow } from "./trades/use-trade-log";

// One stat card on the signed-in dashboard.
export interface Stat {
    label: string;
    value: string;
    vCol: string;
    sub: string;
    sCol: string;
}

// The four headline stat cards, from the analytics summary (one source of
// truth — the same numbers the analytics page shows).
function computeStats(s: Summary): Stat[] {
    const pf = s.profitFactor === null ? "—" : s.profitFactor.toFixed(2);
    const winRate = s.winRate === null ? "—" : `${(s.winRate * 100).toFixed(1)}%`;
    const total = s.closed + s.open;
    return [
        {
            label: "NET P&L",
            value: s.closed ? signedMoney(s.net) : "—",
            vCol: s.net >= 0 ? G : R,
            sub: `${s.closed} CLOSED TRADES`,
            sCol: "#5f6b70",
        },
        {
            label: "WIN RATE",
            value: winRate,
            vCol: "#eef4f2",
            sub: `${s.wins}W · ${s.losses}L`,
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
            value: String(total),
            vCol: "#eef4f2",
            sub: `${s.open} OPEN`,
            sCol: "#5f6b70",
        },
    ];
}

// Empty stat cards shown before the summary loads (or with no account).
const EMPTY_STATS: Stat[] = [
    { label: "NET P&L", value: "—", vCol: "#eef4f2", sub: "0 CLOSED TRADES", sCol: "#5f6b70" },
    { label: "WIN RATE", value: "—", vCol: "#eef4f2", sub: "0W · 0L", sCol: "#5f6b70" },
    { label: "PROFIT FACTOR", value: "—", vCol: "#eef4f2", sub: "GROSS PROFIT / LOSS", sCol: "#5f6b70" },
    { label: "TRADES LOGGED", value: "0", vCol: "#eef4f2", sub: "0 OPEN", sCol: "#5f6b70" },
];

// Loads the analytics summary (for stats) + trade log (for recent rows) and
// derives the signed-in dashboard's data.
export function useDashboardData() {
    const summary = useAnalyticsStore((s) => s.summary);
    const loadSummary = useAnalyticsStore((s) => s.load);
    const apiTrades = useTradesStore((s) => s.trades);
    const loading = useTradesStore((s) => s.loading);
    const loadTrades = useTradesStore((s) => s.load);

    useEffect(() => {
        loadSummary();
        loadTrades();
    }, [loadSummary, loadTrades]);

    const stats = useMemo(() => (summary ? computeStats(summary) : EMPTY_STATS), [summary]);
    const recent = useMemo(
        () =>
            apiTrades
                .map(toTradeLogRow)
                .sort((a, b) => b.ts - a.ts)
                .slice(0, 8),
        [apiTrades],
    );

    return { stats, recent, loading };
}
