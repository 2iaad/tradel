"use client";

import { useEffect, useMemo, useState } from "react";
import { signedMoney } from "@/lib/format";
import { useTradesStore } from "@/stores/trades";
import { toTradeLogRow, TradeLogRow } from "./trade-log-row";

export type SortCol = "date" | "pnl" | "r";
type SideFilter = "ALL" | "LONG" | "SHORT";
type OutcomeFilter = "ALL" | "WINS" | "LOSSES";

const SORT_KEY: Record<SortCol, "ts" | "pnlv" | "rv"> = { date: "ts", pnl: "pnlv", r: "rv" };

// Filters, sorts, and summarizes the trade log; owns all table interaction state.
// Server state (fetch + mutations) lives in the trades store.
export function useTradeLog() {
    const apiTrades = useTradesStore((s) => s.trades);
    const loading = useTradesStore((s) => s.loading);
    const error = useTradesStore((s) => s.error);
    const load = useTradesStore((s) => s.load);
    const saveTrade = useTradesStore((s) => s.saveTrade);
    const removeTrade = useTradesStore((s) => s.removeTrade);

    useEffect(() => {
        load();
    }, [load]);

    const trades = useMemo(() => apiTrades.map(toTradeLogRow), [apiTrades]);
    const [q, setQ] = useState("");
    const [side, setSide] = useState<SideFilter>("ALL");
    const [outcome, setOutcome] = useState<OutcomeFilter>("ALL");
    const [sortCol, setSortCol] = useState<SortCol>("date");
    const [dir, setDir] = useState<"asc" | "desc">("desc");
    const [openId, setOpenId] = useState<string | null>(null);
    // Inline-edit target: a trade id, "new" for the add row, or null (idle).
    const [editingId, setEditingId] = useState<string | "new" | null>(null);
    // Trade awaiting delete confirmation.
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const startEdit = (id: string | "new") => setEditingId(id);
    const cancelEdit = () => setEditingId(null);
    const askDelete = (id: string) => setDeletingId(id);
    const cancelDelete = () => setDeletingId(null);
    const confirmDelete = async () => {
        if (!deletingId) return;
        try {
            await removeTrade(deletingId);
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

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
    const toggleOpen = (id: string) => setOpenId((cur) => (cur === id ? null : id));

    const rows = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const filtered = trades.filter((t) => {
            if (needle && !t.sym.toLowerCase().includes(needle) && !t.setup.toLowerCase().includes(needle))
                return false;
            if (side !== "ALL" && t.side !== side) return false;
            if (outcome === "WINS" && (t.pnlv ?? 0) <= 0) return false;
            if (outcome === "LOSSES" && (t.pnlv ?? 0) >= 0) return false;
            return true;
        });
        const key = SORT_KEY[sortCol];
        const val = (t: TradeLogRow) => t[key] ?? -1e15; // null R/P&L sorts last on desc
        return [...filtered].sort((a, b) => (dir === "desc" ? val(b) - val(a) : val(a) - val(b)));
    }, [trades, q, side, outcome, sortCol, dir]);

    const summary = useMemo(() => {
        const n = rows.length;
        const net = rows.reduce((s, t) => s + (t.pnlv ?? 0), 0);
        const wins = rows.filter((t) => (t.pnlv ?? 0) > 0).length;
        const rRows = rows.filter((t) => t.rv !== null);
        const avgR = rRows.length ? rRows.reduce((s, t) => s + (t.rv ?? 0), 0) / rRows.length : 0;
        const noted = trades.filter((t) => t.noteTitle).length;
        return {
            count: n,
            total: trades.length,
            net: signedMoney(net),
            netPos: net >= 0,
            win: n ? `${((wins / n) * 100).toFixed(1)}%` : "—",
            avgR: rRows.length ? `${avgR > 0 ? "+" : ""}${avgR.toFixed(2)}R` : "—",
            avgRPos: avgR >= 0,
            notedPct: trades.length ? `${Math.round((noted / trades.length) * 100)}%` : "0%",
        };
    }, [rows, trades]);

    // Oldest — newest stamp for the toolbar, from the unfiltered log.
    const range = useMemo(() => {
        if (!trades.length) return "—";
        const byTs = [...trades].sort((a, b) => a.ts - b.ts);
        return `${byTs[0].date} — ${byTs[byTs.length - 1].date}`;
    }, [trades]);

    return {
        q, setQ, side, setSide, outcome, setOutcome,
        sortCol, dir, sortBy, clearFilters,
        openId, toggleOpen, rows, summary, range,
        loading, error, saveTrade,
        editingId, startEdit, cancelEdit,
        deletingId, askDelete, cancelDelete, confirmDelete,
    };
}
