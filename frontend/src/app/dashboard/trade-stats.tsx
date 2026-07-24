"use client";

import { useMemo } from "react";

import { signedMoney } from "@/lib/format";
import { cardCls, G, R } from "@/lib/ui";
import { useAccountStore } from "@/stores/accounts";
import { useTradesStore } from "@/stores/trades";
import { toTradeLogRow } from "./trades/use-trade-log";
import type { TradeLogRow } from "./trades/use-trade-log";

// Headline trade stats shared by the dashboard, trades, and analytics pages
// (cards + chip strip). Pure — pages pass whichever rows they want summarized.
export function computeTradeStats(rows: TradeLogRow[], startingBalance: number) {
    const money = (v: number) =>
        "$" + Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 2 });
    const n = rows.length;
    const net = rows.reduce((s, t) => s + (t.pnlv ?? 0), 0);
    const winRows = rows.filter((t) => (t.pnlv ?? 0) > 0);
    const lossRows = rows.filter((t) => (t.pnlv ?? 0) < 0);
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
    let streak = "—";
    let streakWin = false;
    if (closed.length) {
        streakWin = (closed[0].pnlv ?? 0) > 0;
        let run = 0;
        for (const t of closed) {
            if (((t.pnlv ?? 0) > 0) === streakWin) run++;
            else break;
        }
        streak = `${run}${streakWin ? "W" : "L"}`;
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
            ? `${net >= 0 ? "+" : ""}${((net / startingBalance) * 100).toFixed(1)}%`
            : null;

    return {
        count: n,
        net: signedMoney(net),
        netV: net,
        win: n ? `${((wins / n) * 100).toFixed(1)}%` : "—",
        winPctV: n ? (wins / n) * 100 : null,
        wins,
        losses: lossRows.length,
        avgR: rRows.length ? `${avgR > 0 ? "+" : ""}${avgR.toFixed(2)}R` : "—",
        avgRPos: avgR >= 0,
        rCount: rRows.length,
        avgTrade: n ? signedMoney(net / n) : "—",
        avgWin: wins ? money(grossW / wins) : "—",
        avgLoss: lossRows.length ? money(grossL / lossRows.length) : "—",
        pf: grossL > 0 ? (grossW / grossL).toFixed(2) : "—",
        best: best ? signedMoney(best.pnlv ?? 0) : "—",
        bestSym: best?.sym ?? null,
        worst: worst ? signedMoney(worst.pnlv ?? 0) : "—",
        streak,
        streakWin,
        monthNet: signedMoney(monthNet),
        monthPos: monthNet >= 0,
        ret,
        retPos: net >= 0,
    };
}

export type TradeStats = ReturnType<typeof computeTradeStats>;

// Stats over ALL trades of the active account — the same numbers on every
// page. Does not fetch; each page already loads the trades store once.
export function useTradeStats(): TradeStats {
    const apiTrades = useTradesStore((s) => s.trades);
    const accounts = useAccountStore((s) => s.accounts);
    const activeId = useAccountStore((s) => s.activeId);
    return useMemo(() => {
        const sb = parseFloat(
            accounts.find((a) => a.id === activeId)?.starting_balance ?? "0",
        );
        return computeTradeStats(apiTrades.map(toTradeLogRow), sb);
    }, [apiTrades, accounts, activeId]);
}

// One headline stat card: label + top-right chip, big value, two sublines.
function StatCard({
    label,
    chip,
    value,
    valueColor,
    children,
}: {
    label: string;
    chip: string | null;
    value: string;
    valueColor?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`${cardCls} px-8 py-8 flex flex-col gap-2`}>
            <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]">
                    {label}
                </span>
                {/* Always rendered so cards without a chip keep the same header height. */}
                <span
                    className={`inline-flex px-2 py-2 rounded font-mono text-[9.5px] font-medium tracking-[0.06em] text-[#78878a] border border-[#222a2f] ${chip ? "" : "invisible"}`}
                >
                    {chip ?? "—"}
                </span>
            </div>
            <span
                className="text-[26px] leading-none font-semibold"
                style={{ color: valueColor ?? "#eef4f2" }}
            >
                {value}
            </span>
            <div className="flex flex-col gap-0.5 text-[12px]">{children}</div>
        </div>
    );
}

const subCls = "text-[#5f6b70]";

// The four headline cards (Total P&L / Win Rate / Best Trade / Avg R:R).
export function StatCards({ s }: { s: TradeStats }) {
    const netCol = s.netV > 0 ? G : s.netV < 0 ? R : undefined;
    const pts = s.winPctV === null ? null : s.winPctV - 50;
    return (
        <div className="grid grid-cols-4 gap-4">
            <StatCard label="TOTAL P&L" chip={s.ret} value={s.net} valueColor={netCol}>
                <span style={{ color: netCol ?? "#5f6b70" }}>Avg {s.avgTrade} per trade</span>
                <span className={subCls}>{s.count} trades recorded</span>
            </StatCard>
            <StatCard label="WIN RATE" chip={s.count ? `${s.wins}W / ${s.losses}L` : null} value={s.win}>
                <span className={subCls}>
                    {pts === null
                        ? "No trades yet"
                        : `${Math.abs(pts).toFixed(0)}pts ${pts >= 0 ? "above" : "below"} 50%`}
                </span>
                <span className={subCls}>
                    <span style={{ color: G }}>{s.avgWin} avg win</span> /{" "}
                    <span style={{ color: R }}>{s.avgLoss} avg loss</span>
                </span>
            </StatCard>
            <StatCard
                label="BEST TRADE"
                chip={s.bestSym}
                value={s.best}
                valueColor={s.bestSym ? G : undefined}
            >
                <span style={{ color: s.bestSym ? R : undefined }} className={s.bestSym ? "" : subCls}>
                    Worst: {s.worst}
                </span>
                <span className={subCls}>{s.count} total trades</span>
            </StatCard>
            <StatCard
                label="AVG R:R"
                chip={s.rCount ? null : "No data"}
                value={s.rCount ? s.avgR : "— —"}
                valueColor={s.rCount ? (s.avgRPos ? G : R) : undefined}
            >
                <span className={subCls}>PF: {s.pf === "—" ? "—" : `${s.pf}x`}</span>
                <span className={subCls}>{s.rCount} trades with R:R data</span>
            </StatCard>
        </div>
    );
}
