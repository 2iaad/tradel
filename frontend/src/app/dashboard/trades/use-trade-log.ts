"use client";

import { useMemo, useState } from "react";
import { signedMoney } from "@/lib/format";
import { TRADE_LOG, TradeLogRow } from "./trades.data";

export type SortCol = "date" | "pnl" | "r";
type SideFilter = "ALL" | "LONG" | "SHORT";
type OutcomeFilter = "ALL" | "WINS" | "LOSSES";

const SORT_KEY: Record<SortCol, keyof TradeLogRow> = { date: "ts", pnl: "pnlv", r: "rv" };

// Filters, sorts, and summarizes the trade log; owns all table interaction state.
export function useTradeLog() {
    const [q, setQ] = useState("");
    const [side, setSide] = useState<SideFilter>("ALL");
    const [outcome, setOutcome] = useState<OutcomeFilter>("ALL");
    const [sortCol, setSortCol] = useState<SortCol>("date");
    const [dir, setDir] = useState<"asc" | "desc">("desc");
    const [openId, setOpenId] = useState<number | null>(null);

    const sortBy = (col: SortCol) => {
        if (col === sortCol) setDir((d) => (d === "desc" ? "asc" : "desc"));
        else {
            setSortCol(col);
            setDir("desc");
        }
    };
    const clearFilters = () => {
        setQ("");
        setSide("ALL");
        setOutcome("ALL");
    };
    const toggleOpen = (id: number) => setOpenId((cur) => (cur === id ? null : id));

    const rows = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const filtered = TRADE_LOG.filter((t) => {
            if (needle && !t.sym.toLowerCase().includes(needle) && !t.setup.toLowerCase().includes(needle))
                return false;
            if (side !== "ALL" && t.side !== side) return false;
            if (outcome === "WINS" && t.pnlv <= 0) return false;
            if (outcome === "LOSSES" && t.pnlv >= 0) return false;
            return true;
        });
        const key = SORT_KEY[sortCol];
        return [...filtered].sort((a, b) =>
            dir === "desc" ? (b[key] as number) - (a[key] as number) : (a[key] as number) - (b[key] as number),
        );
    }, [q, side, outcome, sortCol, dir]);

    const summary = useMemo(() => {
        const n = rows.length;
        const net = rows.reduce((s, t) => s + t.pnlv, 0);
        const wins = rows.filter((t) => t.pnlv > 0).length;
        const avgR = n ? rows.reduce((s, t) => s + t.rv, 0) / n : 0;
        const noted = TRADE_LOG.filter((t) => t.noteTitle).length;
        return {
            count: n,
            total: TRADE_LOG.length,
            net: signedMoney(net),
            netPos: net >= 0,
            win: n ? `${((wins / n) * 100).toFixed(1)}%` : "—",
            avgR: n ? `${avgR > 0 ? "+" : ""}${avgR.toFixed(2)}R` : "—",
            avgRPos: avgR >= 0,
            notedPct: `${Math.round((noted / TRADE_LOG.length) * 100)}%`,
        };
    }, [rows]);

    return {
        q, setQ, side, setSide, outcome, setOutcome,
        sortCol, dir, sortBy, clearFilters,
        openId, toggleOpen, rows, summary,
    };
}
