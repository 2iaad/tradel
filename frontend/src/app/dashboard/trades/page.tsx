"use client";

import { ctaCls, G, R } from "@/lib/ui";
import { PageHeader } from "../page-header";
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

// One summary cell (label + value).
function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div className="flex flex-col gap-1.5 px-5 py-4 border-l border-[#161c20] first:border-l-0">
            <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]">
                {label}
            </span>
            <span className="text-[21px] font-semibold" style={{ color: color ?? "#eef4f2" }}>
                {value}
            </span>
        </div>
    );
}

// Four-up stat strip reflecting the active filters.
function SummaryStrip({ summary }: { summary: Log["summary"] }) {
    return (
        <div className="grid grid-cols-4 bg-[#0e1214] border border-[#1b2226] rounded-[10px] overflow-hidden">
            <Cell label="TRADES" value={String(summary.count)} />
            <Cell
                label="NET P&L"
                value={summary.net}
                color={summary.netV > 0 ? G : summary.netV < 0 ? R : undefined}
            />
            <Cell label="WIN RATE" value={summary.win} />
            <Cell label="AVG R" value={summary.avgR} color={summary.avgRPos ? G : R} />
        </div>
    );
}

// Trades route: filterable, sortable trade log backed by the trades API.
export default function TradesPage() {
    const log = useTradeLog();
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
            <FilterToolbar log={log} />
            <SummaryStrip summary={log.summary} />
            <TradeLogTable log={log} dense={false} />
        </div>
    );
}
