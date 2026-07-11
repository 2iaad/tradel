import { G, R } from "../dashboard.data";
import type { useTradeLog } from "./use-trade-log";

const labelCls = "font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]";
const valueCls = "text-[21px] font-semibold";

// One summary cell (label + value).
function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div className="flex flex-col gap-1.5 px-5 py-4 border-l border-[#161c20] first:border-l-0">
            <span className={labelCls}>{label}</span>
            <span className={valueCls} style={{ color: color ?? "#eef4f2" }}>
                {value}
            </span>
        </div>
    );
}

// Four-up stat strip reflecting the active filters.
export function SummaryStrip({ summary }: { summary: ReturnType<typeof useTradeLog>["summary"] }) {
    return (
        <div className="grid grid-cols-4 bg-[#0e1214] border border-[#1b2226] rounded-[10px] overflow-hidden">
            <Cell label="TRADES" value={String(summary.count)} />
            <Cell label="NET P&L" value={summary.net} color={summary.netPos ? G : R} />
            <Cell label="WIN RATE" value={summary.win} />
            <Cell label="AVG R" value={summary.avgR} color={summary.avgRPos ? G : R} />
        </div>
    );
}
