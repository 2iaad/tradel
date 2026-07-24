"use client";

import { useEffect, useMemo, useState } from "react";
import { signedMoney } from "@/lib/format";
import { useNotesStore } from "@/stores/notes";
import { useTradesStore } from "@/stores/trades";
import type { ApiTrade } from "@/stores/trades";

// Shared column template for the trade-log header + rows (must match exactly).
// Trailing 44px cell = edit/delete icons (or save/cancel while editing).
export const LOG_GRID =
    "grid grid-cols-[76px_76px_1fr_88px_88px_88px_64px_90px_132px_14px_44px] gap-2";

// Display row for the trade log table, derived from an API trade.
export interface TradeLogRow {
    id: string;
    ts: number;
    sym: string;
    side: "LONG" | "SHORT";
    setup: string;
    entry: string;
    exit: string | null;
    size: string;
    rv: number | null;
    pnlv: number | null;
    date: string;
    time: string;
    openedAt: string;
    closedAt: string | null;
    noteTitle: string;
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
    const notes = useNotesStore((s) => s.notes);
    const loadNotes = useNotesStore((s) => s.load);

    useEffect(() => {
        load();
        loadNotes(); // note badges + expanded note panels join by trade id
    }, [load, loadNotes]);

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
        const notedIds = new Set(notes.map((n) => n.trade_id));
        const noted = trades.filter((t) => notedIds.has(t.id)).length;
        return {
            count: n,
            total: trades.length,
            net: signedMoney(net),
            netV: net,
            win: n ? `${((wins / n) * 100).toFixed(1)}%` : "—",
            avgR: rRows.length ? `${avgR > 0 ? "+" : ""}${avgR.toFixed(2)}R` : "—",
            avgRPos: avgR >= 0,
            notedPct: trades.length ? `${Math.round((noted / trades.length) * 100)}%` : "0%",
        };
    }, [rows, trades, notes]);

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
