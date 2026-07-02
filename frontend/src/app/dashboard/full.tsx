"use client";

import { useState } from "react";

import { kickerCls } from "@/lib/ui";
import { EquityChart, RANGES, RangeKey } from "./equity-chart";
import { useSession } from "./session";

const cardCls = "bg-[#0e1214] border border-[#1b2226] rounded-[10px]";
const h2Cls = "m-0 text-[17px] font-semibold text-[#eef4f2]";
const ghostBtnCls =
    "bg-transparent border-none p-0 font-mono text-[11px] font-medium tracking-[0.1em] text-[#2fd57f] cursor-pointer hover:text-[#5fe9a0]";
const tableGrid =
    "grid grid-cols-[78px_74px_1fr_1fr_56px_64px_104px_66px] gap-2";

const G = "#2fd57f";
const R = "#f0554e";

// ponytail: demo data straight from the design — swap for the trades
// API when those endpoints exist.
const STATS = [
    { label: "NET P&L · YTD", value: "+$14,382.40", vCol: G, sub: "▲ 4.2% THIS MONTH", sCol: G },
    { label: "WIN RATE", value: "58.4%", vCol: "#eef4f2", sub: "▲ 2.1PT VS LAST 90D", sCol: G },
    { label: "PROFIT FACTOR", value: "1.92", vCol: "#eef4f2", sub: "▼ 0.08 VS LAST 90D", sCol: R },
    { label: "TRADES LOGGED", value: "127", vCol: "#eef4f2", sub: "94% WITH NOTES", sCol: "#5f6b70" },
];

const TRADES = [
    { sym: "NVDA", side: "LONG", entry: "128.40", exit: "134.92", size: "120", r: "+2.1R", pnl: "+$782.40", win: true, date: "JUL 01" },
    { sym: "TSLA", side: "SHORT", entry: "243.10", exit: "236.55", size: "80", r: "+1.6R", pnl: "+$524.00", win: true, date: "JUL 01" },
    { sym: "AAPL", side: "LONG", entry: "231.20", exit: "229.84", size: "150", r: "-0.7R", pnl: "-$204.00", win: false, date: "JUN 30" },
    { sym: "AMD", side: "LONG", entry: "182.66", exit: "189.10", size: "100", r: "+1.9R", pnl: "+$644.00", win: true, date: "JUN 30" },
    { sym: "SPY", side: "SHORT", entry: "618.32", exit: "620.10", size: "40", r: "-0.5R", pnl: "-$71.20", win: false, date: "JUN 27" },
    { sym: "BTC", side: "LONG", entry: "108,420", exit: "112,884", size: "0.5", r: "+2.4R", pnl: "+$2,232.00", win: true, date: "JUN 27" },
    { sym: "META", side: "LONG", entry: "742.15", exit: "751.40", size: "30", r: "+1.1R", pnl: "+$277.50", win: true, date: "JUN 26" },
    { sym: "QQQ", side: "SHORT", entry: "554.80", exit: "558.65", size: "60", r: "-0.9R", pnl: "-$231.00", win: false, date: "JUN 26" },
];

const NOTES = [
    { title: "Forced the NVDA entry", body: "Went in before the retest confirmed. It worked, but it was luck — flag this pattern.", date: "JUL 01", tags: ["discipline", "momentum"] },
    { title: "A+ setup on TSLA short", body: "Waited the full 15 minutes for the failed breakout. Textbook execution, size was right.", date: "JUL 01", tags: ["setup", "short"] },
    { title: "Overtraded the open again", body: "Three entries in the first 20 minutes, two were noise. Cap myself at one until 10:00.", date: "JUN 30", tags: ["risk", "review"] },
];

export function dateStamp() {
    const d = new Date();
    const part = (o: Intl.DateTimeFormatOptions) =>
        d.toLocaleDateString("en-US", o).toUpperCase();
    return `${part({ weekday: "short" })} · ${part({ month: "short" })} ${part({ day: "2-digit" })} ${d.getFullYear()}`;
}

export function FullDashboard() {
    const session = useSession();
    const [range, setRange] = useState<RangeKey>("YTD");

    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const name =
        session.status === "user" ? session.email.split("@")[0] : "trader";

    return (
        <div className="w-full max-w-[1240px] box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            {/* page header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                    <div className={kickerCls}>{"/// DASHBOARD"}</div>
                    <h1 className="m-0 text-[26px] font-semibold tracking-[-0.01em] text-[#eef4f2]">
                        {greeting}, {name}
                    </h1>
                </div>
                <div className="flex items-center gap-3.5">
                    <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-[#5f6b70]">
                        {dateStamp()}
                    </span>
                    <button
                        type="button"
                        className="border-none rounded-lg px-[18px] py-[11px] bg-[#2fd57f] text-[#04130a] font-semibold text-[13.5px] cursor-pointer transition-[background,transform] hover:bg-[#4ce392] active:scale-[0.97]"
                    >
                        + Log trade
                    </button>
                </div>
            </div>

            {/* stat cards */}
            <div className="grid grid-cols-4 gap-4">
                {STATS.map((s) => (
                    <div
                        key={s.label}
                        className={`${cardCls} px-5 py-[18px] flex flex-col gap-2 transition-[border-color,transform] duration-200 hover:border-[#2fd57f44] hover:-translate-y-0.5`}
                    >
                        <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]">
                            {s.label}
                        </span>
                        <span
                            className="text-[26px] font-semibold tracking-[-0.01em]"
                            style={{ color: s.vCol }}
                        >
                            {s.value}
                        </span>
                        <span
                            className="font-mono text-[11px] font-medium"
                            style={{ color: s.sCol }}
                        >
                            {s.sub}
                        </span>
                    </div>
                ))}
            </div>

            {/* equity curve */}
            <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex flex-col gap-[5px]">
                        <h2 className={h2Cls}>Equity curve</h2>
                        <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]">
                            NET LIQ ($) × TRADES LOGGED
                        </span>
                    </div>
                    <div className="flex gap-1 bg-[#0a0d0f] border border-[#1b2226] rounded-lg p-[3px]">
                        {(Object.keys(RANGES) as RangeKey[]).map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setRange(key)}
                                className={`border-none cursor-pointer rounded-md px-[13px] py-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] transition-colors ${
                                    key === range
                                        ? "bg-[#2fd57f] text-[#04130a]"
                                        : "bg-transparent text-[#5f6b70]"
                                }`}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>
                <EquityChart range={range} />
            </div>

            {/* trades + notes */}
            <div className="grid grid-cols-[1.9fr_1fr] gap-4 items-start">
                {/* recent trades */}
                <div className={`${cardCls} pt-5 pb-1.5 flex flex-col`}>
                    <div className="flex items-center justify-between px-[22px] pb-3.5">
                        <h2 className={h2Cls}>Recent trades</h2>
                        <button type="button" className={ghostBtnCls}>
                            VIEW ALL →
                        </button>
                    </div>
                    <div
                        className={`${tableGrid} px-[22px] py-2 border-t border-[#161c20] font-mono text-[10px] font-medium tracking-[0.12em] text-[#5f6b70]`}
                    >
                        <span>SYMBOL</span>
                        <span>SIDE</span>
                        <span>ENTRY</span>
                        <span>EXIT</span>
                        <span>SIZE</span>
                        <span>R</span>
                        <span className="text-right">P&L</span>
                        <span className="text-right">DATE</span>
                    </div>
                    {TRADES.map((t) => (
                        <div
                            key={`${t.sym}-${t.date}`}
                            className={`${tableGrid} items-center px-[22px] py-[11px] border-t border-[#161c20] transition-colors cursor-default hover:bg-[#10161a]`}
                        >
                            <span className="font-mono text-[12.5px] font-semibold text-[#e9eef0]">
                                {t.sym}
                            </span>
                            <span>
                                <span
                                    className="inline-flex px-2 py-0.5 rounded font-mono text-[9.5px] font-semibold tracking-[0.08em] border"
                                    style={
                                        t.side === "LONG"
                                            ? {
                                                  color: G,
                                                  background: "rgba(47,213,127,.08)",
                                                  borderColor: "rgba(47,213,127,.25)",
                                              }
                                            : {
                                                  color: R,
                                                  background: "rgba(240,85,78,.08)",
                                                  borderColor: "rgba(240,85,78,.25)",
                                              }
                                    }
                                >
                                    {t.side}
                                </span>
                            </span>
                            <span className="font-mono text-[12.5px] text-[#93a09d]">
                                {t.entry}
                            </span>
                            <span className="font-mono text-[12.5px] text-[#93a09d]">
                                {t.exit}
                            </span>
                            <span className="font-mono text-[12.5px] text-[#93a09d]">
                                {t.size}
                            </span>
                            <span
                                className="font-mono text-[12.5px] font-medium"
                                style={{ color: t.win ? G : R }}
                            >
                                {t.r}
                            </span>
                            <span
                                className="font-mono text-[12.5px] font-semibold text-right"
                                style={{ color: t.win ? G : R }}
                            >
                                {t.pnl}
                            </span>
                            <span className="font-mono text-[10.5px] text-[#5f6b70] text-right">
                                {t.date}
                            </span>
                        </div>
                    ))}
                </div>

                {/* journal notes */}
                <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3`}>
                    <div className="flex items-center justify-between">
                        <h2 className={h2Cls}>Journal notes</h2>
                        <button type="button" className={ghostBtnCls}>
                            + NEW
                        </button>
                    </div>
                    {NOTES.map((n) => (
                        <div
                            key={n.title}
                            className="border border-[#1b2226] rounded-lg px-[15px] py-3.5 flex flex-col gap-2 transition-colors cursor-pointer hover:border-[#2fd57f44]"
                        >
                            <span className="text-sm font-medium text-[#e9eef0]">
                                {n.title}
                            </span>
                            <span className="text-[12.5px] leading-normal text-[#7e8d89]">
                                {n.body}
                            </span>
                            <span className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-[10px] font-medium text-[#5f6b70] mr-1">
                                    {n.date}
                                </span>
                                {n.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex px-2 py-0.5 rounded font-mono text-[9.5px] font-medium tracking-[0.06em] text-[#78878a] border border-[#222a2f]"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
