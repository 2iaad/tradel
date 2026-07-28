"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    LinearScale,
    Tooltip,
} from "chart.js";

import { signedMoney } from "@/lib/format";
import { canvasColors, cardCls, G, monoFontStack, R } from "@/lib/ui";
import { useAccountStore } from "@/stores/accounts";
import { useTradesStore } from "@/stores/trades";
import { toTradeLogRow } from "./trades/use-trade-log";
import type { TradeLogRow } from "./trades/use-trade-log";
import { WinRateDonut } from "./win-rate-donut";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

// Chart.js touches `window` at import — client-only, no SSR pass.
const Bar = dynamic(() => import("react-chartjs-2").then((m) => m.Bar), { ssr: false });

// Headline trade stats shared by the dashboard, trades, and analytics pages
// (cards + chip strip). Pure — pages pass whichever rows they want summarized.
export function computeTradeStats(rows: TradeLogRow[], startingBalance: number) {
    const money = (v: number) =>
        "$" + Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 2 });
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

    // Mini-chart series for the stat cards.
    // TOTAL P&L: net result per day over the last 7 calendar days.
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
        dayLabels.push(d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase());
    }
    const chron = [...closed].sort((a, b) => a.ts - b.ts);
    const rChron = chron.filter((t) => t.rv !== null).slice(-20);
    const rBarColors = rChron.map((t) =>
        (t.pnlv ?? 0) > 0 ? G : (t.pnlv ?? 0) < 0 ? R : canvasColors.faint,
    );
    const topTrades = [...closed].sort((a, b) => (b.pnlv ?? 0) - (a.pnlv ?? 0)).slice(0, 5);

    return {
        dayBars,
        dayLabels,
        rBars: rChron.map((t) => t.rv ?? 0),
        rBarLabels: rChron.map((t) => t.sym),
        rBarColors,
        topBars: topTrades.map((t) => t.pnlv ?? 0),
        topBarLabels: topTrades.map((t) => t.sym),
        count: n,
        net: signedMoney(net),
        netV: net,
        win: n ? `${((wins / n) * 100).toFixed(1)}%` : "—",
        winPctV: n ? (wins / n) * 100 : null,
        wins,
        losses: lossRows.length,
        breakevens,
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
        <Card className={`${cardCls} px-6 py-4 flex flex-col gap-2`}>
            <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-ui-xs font-medium tracking-[0.14em] text-content-faint">
                    {label}
                </span>
                {/* Always rendered so cards without a chip keep the same header height. */}
                <Badge
                    variant="outline"
                    className={`h-auto rounded px-2 py-2 font-mono text-ui-xs font-medium tracking-[0.06em] text-muted-foreground ${chip ? "" : "invisible"}`}
                >
                    {chip ?? "—"}
                </Badge>
            </div>
            <span
                className="text-display-sm leading-none font-semibold"
                style={{ color: valueColor ?? "var(--card-foreground)" }}
            >
                {value}
            </span>
            <div className="flex flex-col gap-0.5 text-ui-sm">{children}</div>
        </Card>
    );
}

const subCls = "text-content-faint";

// Tiny axis-less bar chart for the stat cards: green above zero, red below.
function MiniBars({
    values,
    labels,
    unit,
    showX = false,
    colors,
}: {
    values: number[];
    labels: string[];
    unit: "money" | "r";
    showX?: boolean;
    colors?: string[];
}) {
    const fmt = (v: number) =>
        unit === "money" ? signedMoney(v) : `${v > 0 ? "+" : ""}${v.toFixed(2)}R`;
    return (
        <div className="mt-4 h-[120px]">
            <Bar
                data={{
                    labels,
                    datasets: [
                        {
                            data: values,
                            backgroundColor:
                                colors ?? values.map((v) => (v > 0 ? G : v < 0 ? R : canvasColors.faint)),
                            borderRadius: 2,
                        },
                    ],
                }}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 500 },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (c) => fmt(c.parsed.y ?? 0),
                            },
                        },
                    },
                    scales: {
                        x: showX
                            ? {
                                  grid: { display: false, drawTicks: false },
                                  ticks: {
                                      color: canvasColors.faint,
                                      font: { family: monoFontStack, size: 9 },
                                      padding: 8,
                                  },
                              }
                            : { display: false },
                        // Exact data bounds — no rounding down to a "nice" tick,
                        // which reserved empty space below barely-negative bars.
                        y: {
                            display: false,
                            min: Math.min(0, ...values),
                            max: Math.max(0, ...values),
                        },
                    },
                }}
            />
        </div>
    );
}

// The four headline cards (Total P&L / Win Rate / Best Trade / Avg R:R).
export function StatCards({ s }: { s: TradeStats }) {
    const netCol = s.netV > 0 ? G : s.netV < 0 ? R : undefined;
    return (
        <div className="grid grid-cols-4 gap-4">
            <StatCard label="TOTAL P&L" chip={s.ret} value={s.net} valueColor={netCol}>
                <span style={{ color: netCol ?? "var(--content-faint)" }}>Avg {s.avgTrade} per trade</span>
                <span className={subCls}>{s.count} trades recorded</span>
                {s.count > 0 && (
                    <MiniBars values={s.dayBars} labels={s.dayLabels} unit="money" showX />
                )}
            </StatCard>
            <StatCard label="WIN RATE" chip={s.count ? `${s.wins}W / ${s.losses}L` : null} value={s.win}>
                {s.count ? (
                    <WinRateDonut wins={s.wins} losses={s.losses} breakevens={s.breakevens} />
                ) : (
                    <span className={subCls}>No trades yet</span>
                )}
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
                {s.topBars.length > 0 && (
                    <MiniBars values={s.topBars} labels={s.topBarLabels} unit="money" showX />
                )}
            </StatCard>
            <StatCard
                label="AVG R:R"
                chip={s.rCount ? null : "No data"}
                value={s.rCount ? s.avgR : "— —"}
                valueColor={s.rCount ? (s.avgRPos ? G : R) : undefined}
            >
                <span className={subCls}>PF: {s.pf === "—" ? "—" : `${s.pf}x`}</span>
                <span className={subCls}>{s.rCount} trades with R:R data</span>
                {s.rBars.length > 0 && (
                    <MiniBars
                        values={s.rBars}
                        labels={s.rBarLabels}
                        unit="r"
                        showX
                        colors={s.rBarColors}
                    />
                )}
            </StatCard>
        </div>
    );
}
