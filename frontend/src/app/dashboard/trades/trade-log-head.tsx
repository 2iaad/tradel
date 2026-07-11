import { LOG_GRID } from "./trade-log-grid";
import type { SortCol, useTradeLog } from "./use-trade-log";

// A clickable, sortable column header; shows the active sort arrow.
function SortHead({
    col,
    label,
    align,
    log,
}: {
    col: SortCol;
    label: string;
    align: "left" | "right";
    log: ReturnType<typeof useTradeLog>;
}) {
    const on = log.sortCol === col;
    return (
        <button
            type="button"
            onClick={() => log.sortBy(col)}
            className={`bg-none border-none p-0 font-mono text-[10px] font-medium tracking-[0.12em] cursor-pointer hover:text-[#c8d2d0] ${align === "right" ? "text-right" : "text-left"} ${on ? "text-[#c8d2d0]" : "text-[#5f6b70]"}`}
        >
            {label} {on ? (log.dir === "desc" ? "▼" : "▲") : ""}
        </button>
    );
}

// Column labels for the trade log; R / P&L / DATE are sortable.
export function TradeLogHead({ log }: { log: ReturnType<typeof useTradeLog> }) {
    return (
        <div
            className={`${LOG_GRID} items-center px-[22px] py-2 border-t border-[#161c20] font-mono text-[10px] font-medium tracking-[0.12em] text-[#5f6b70]`}
        >
            <span>SYMBOL</span>
            <span>SIDE</span>
            <span>SETUP</span>
            <span>ENTRY</span>
            <span>EXIT</span>
            <span>SIZE</span>
            <SortHead col="r" label="R" align="left" log={log} />
            <SortHead col="pnl" label="P&L" align="right" log={log} />
            <SortHead col="date" label="DATE" align="right" log={log} />
            <span />
            <span />
        </div>
    );
}
