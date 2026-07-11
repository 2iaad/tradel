import { SegmentedTabs } from "./segmented-tabs";
import type { useTradeLog } from "./use-trade-log";

const SIDES = ["ALL", "LONG", "SHORT"] as const;
const OUTCOMES = ["ALL", "WINS", "LOSSES"] as const;

// Search box + side/outcome segmented filters + the date-range stamp.
export function FilterToolbar({ log }: { log: ReturnType<typeof useTradeLog> }) {
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
            <span className="ml-auto font-mono text-[10.5px] font-medium tracking-[0.1em] text-[#5f6b70]">
                {log.range}
            </span>
        </div>
    );
}
