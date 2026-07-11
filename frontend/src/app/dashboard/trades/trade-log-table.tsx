import { cardCls } from "@/lib/ui";
import { TradeLogHead } from "./trade-log-head";
import { TradeRow } from "./trade-row";
import type { useTradeLog } from "./use-trade-log";

// Card header with the title and the (decorative) export button.
function TableHeader() {
    return (
        <div className="flex items-center justify-between px-[22px] pb-3.5">
            <h2 className="m-0 text-[17px] font-semibold text-[#eef4f2]">All trades</h2>
            <button
                type="button"
                className="bg-none border border-[#1b2226] rounded-md px-3 py-1.5 font-mono text-[10.5px] font-medium tracking-[0.1em] text-[#78878a] cursor-pointer transition-colors hover:text-[#c8d2d0] hover:border-[#2b353b] whitespace-nowrap"
            >
                EXPORT CSV
            </button>
        </div>
    );
}

// Shown when filters match no trades.
function EmptyState({ onClear }: { onClear: () => void }) {
    return (
        <div className="flex flex-col items-center gap-3 py-14 px-[22px] border-t border-[#161c20]">
            <span className="font-mono text-[11px] font-medium tracking-[0.16em] text-[#5f6b70]">
                NO TRADES MATCH YOUR FILTERS
            </span>
            <button
                type="button"
                onClick={onClear}
                className="bg-none border border-[#1b2226] rounded-lg px-4 py-2 font-mono text-[11px] font-medium tracking-[0.1em] text-[#2fd57f] cursor-pointer transition-colors hover:border-[#2fd57f44]"
            >
                CLEAR FILTERS
            </button>
        </div>
    );
}

// Full trade log: sortable header, expandable rows, empty state, footer.
export function TradeLogTable({ log, dense }: { log: ReturnType<typeof useTradeLog>; dense: boolean }) {
    return (
        <div className={`${cardCls} pt-5 flex flex-col overflow-hidden`}>
            <TableHeader />
            <div className="overflow-x-auto">
                <div className="min-w-[780px]">
                    <TradeLogHead log={log} />
                    {log.rows.map((t) => (
                        <TradeRow
                            key={t.id}
                            t={t}
                            open={log.openId === t.id}
                            dense={dense}
                            onToggle={() => log.toggleOpen(t.id)}
                        />
                    ))}
                </div>
            </div>
            {log.rows.length === 0 && <EmptyState onClear={log.clearFilters} />}
            <div className="flex items-center justify-between px-[22px] py-3 border-t border-[#161c20] bg-[#0c1012] font-mono text-[10.5px] font-medium tracking-[0.1em] text-[#5f6b70]">
                <span>
                    SHOWING {log.summary.count} OF {log.summary.total} TRADES
                </span>
                <span>{log.summary.notedPct} WITH NOTES</span>
            </div>
        </div>
    );
}
