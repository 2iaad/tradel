"use client";

import { useEffect, useMemo } from "react";

import { useTradesStore } from "@/stores/trades";
import { toTradeLogRow } from "./trades/use-trade-log";

// Loads the trade log and derives the signed-in dashboard's recent rows.
// Headline stats come from useTradeStats (shared with trades + analytics).
export function useDashboardData() {
    const apiTrades = useTradesStore((s) => s.trades);
    const loading = useTradesStore((s) => s.loading);
    const loadTrades = useTradesStore((s) => s.load);

    useEffect(() => {
        loadTrades();
    }, [loadTrades]);

    const recent = useMemo(
        () =>
            apiTrades
                .map(toTradeLogRow)
                .sort((a, b) => b.ts - a.ts)
                .slice(0, 8),
        [apiTrades],
    );

    return { recent, loading };
}
