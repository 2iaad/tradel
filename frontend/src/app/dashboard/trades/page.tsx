"use client";

import { cardCls, ctaCls, G, R } from "@/lib/ui";
import { PageHeader } from "../page-header";
import { StatCards, useTradeStats } from "../trade-stats";
import { TradeLogTable } from "./trade-log-table";
import { useTradeLog } from "./use-trade-log";

type Log = ReturnType<typeof useTradeLog>;

const SIDES = ["ALL", "LONG", "SHORT"] as const;
const OUTCOMES = ["ALL", "WINS", "LOSSES"] as const;

// Segmented pill toggle; the active option fills green.
function SegmentedTabs<T extends string>({
    options,
    active,
    onChange,
}: {
    options: readonly T[];
    active: T;
    onChange: (value: T) => void;
}) {
    return (
        <div className="flex gap-1 bg-[#0a0d0f] border border-[#1b2226] rounded-lg p-[3px]">
            {options.map((opt) => {
                const on = opt === active;
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={`border-none cursor-pointer rounded-md px-[13px] py-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] transition-colors ${on ? "bg-[#2fd57f] text-[#04130a]" : "bg-transparent text-[#5f6b70] hover:text-[#c8d2d0]"}`}
                    >
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}

// Search box + side/outcome segmented filters + the date-range stamp.
function FilterToolbar({ log }: { log: Log }) {
    return (
        <div className="flex items-center gap-3 flex-wrap">
            <input
                value={log.q}
                onChange={(e) => log.setQ(e.target.value)}
                placeholder="Search symbol or setup…"
                className="flex-1 min-w-[200px] max-w-[300px] box-border bg-[#0a0d0f] border border-[#1b2226] rounded-lg px-3.5 py-2.5 text-[#e9eef0] font-mono text-[12.5px] outline-none transition-colors focus:border-[#2fd57f66] placeholder:text-[#4d5a5f]"
            />
            <SegmentedTabs options={SIDES} active={log.side} onChange={log.setSide} />
            <SegmentedTabs options={OUTCOMES} active={log.outcome} onChange={log.setOutcome} />
        </div>
    );
}

// One label+value pill in the quick-stats strip.
function Chip({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 bg-[#0a0d0f] border border-[#1b2226] rounded-full px-3.5 py-1.5 font-mono text-[11px] font-medium tracking-[0.04em] text-[#78878a]">
            {label && <span>{label}</span>}
            <span style={{ color: color ?? "#c8d2d0" }}>{value}</span>
        </span>
    );
}

// Quick-stats pill strip under the cards.
function ChipStrip({ s }: { s: Log["summary"] }) {
    return (
        <div className={`${cardCls} flex flex-wrap items-center gap-2 px-3.5 py-3`}>
            <Chip label="" value={`${s.count} trades`} color={G} />
            <Chip label="Avg win" value={s.avgWin} color={G} />
            <Chip label="Avg loss" value={s.avgLoss} color={R} />
            <Chip label="PF" value={s.pf} />
            <Chip label="Streak" value={s.streak} color={s.streak === "—" ? undefined : s.streakWin ? G : R} />
            <Chip label="This month" value={s.monthNet} color={s.monthPos ? G : R} />
        </div>
    );
}

// Trades route: filterable, sortable trade log backed by the trades API.
export default function TradesPage() {
    const log = useTradeLog();
    const stats = useTradeStats();
    return (
        <div className="w-full max-w-[1240px] box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader kicker="" title="Trade log">
                <button
                    type="button"
                    onClick={() => log.startEdit("new")}
                    className={`${ctaCls} whitespace-nowrap`}
                >
                    + Log trade
                </button>
            </PageHeader>
            <StatCards s={stats} />
            <ChipStrip s={log.summary} />
            <FilterToolbar log={log} />
            <TradeLogTable log={log} dense={false} />
        </div>
    );
}
