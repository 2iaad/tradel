import { cardCls } from "@/lib/ui";
import { ConfirmDeleteModal } from "./confirm-delete-modal";
import { TradeAddRow } from "./trade-add-row";
import { TradeLogHead } from "./trade-log-head";
import { TradeRow } from "./trade-row";
import { TradeRowForm } from "./trade-row-form";
import type { useTradeLog } from "./use-trade-log";

type Log = ReturnType<typeof useTradeLog>;

// Status line for an empty table body.
function emptyLabel(log: Log) {
    if (log.loading) return "LOADING TRADES…";
    if (log.error) return log.error.toUpperCase();
    if (log.summary.total === 0) return "NO TRADES LOGGED YET";
    return "NO TRADES MATCH YOUR FILTERS";
}

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

// Shown when the table body has no rows; clear-filters only when they hide trades.
function EmptyState({ label, onClear }: { label: string; onClear?: () => void }) {
    return (
        <div className="flex flex-col items-center gap-3 py-14 px-[22px] border-t border-[#161c20]">
            <span className="font-mono text-[11px] font-medium tracking-[0.16em] text-[#5f6b70]">
                {label}
            </span>
            {onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="bg-none border border-[#1b2226] rounded-lg px-4 py-2 font-mono text-[11px] font-medium tracking-[0.1em] text-[#2fd57f] cursor-pointer transition-colors hover:border-[#2fd57f44]"
                >
                    CLEAR FILTERS
                </button>
            )}
        </div>
    );
}

interface TableProps {
    log: Log;
    dense: boolean;
}

// Sortable column head + one row per filtered trade (inline form while
// editing) + the always-present add row.
function Rows({ log, dense }: TableProps) {
    return (
        <div className="min-w-[820px]">
            <TradeLogHead log={log} />
            {log.rows.map((t) =>
                log.editingId === t.id ? (
                    <TradeRowForm key={t.id} t={t} onSave={log.saveTrade} onCancel={log.cancelEdit} />
                ) : (
                    <TradeRow
                        key={t.id}
                        t={t}
                        open={log.openId === t.id}
                        dense={dense}
                        onToggle={() => log.toggleOpen(t.id)}
                        onEdit={() => log.startEdit(t.id)}
                        onDelete={() => log.askDelete(t.id)}
                    />
                ),
            )}
            <TradeAddRow
                active={log.editingId === "new"}
                onActivate={() => log.startEdit("new")}
                onSave={log.saveTrade}
                onCancel={log.cancelEdit}
            />
        </div>
    );
}

// Footer with the visible/total counts.
function TableFooter({ summary }: { summary: Log["summary"] }) {
    return (
        <div className="flex items-center justify-between px-[22px] py-3 border-t border-[#161c20] bg-[#0c1012] font-mono text-[10.5px] font-medium tracking-[0.1em] text-[#5f6b70]">
            <span>
                SHOWING {summary.count} OF {summary.total} TRADES
            </span>
            <span>{summary.notedPct} WITH NOTES</span>
        </div>
    );
}

// Full trade log: sortable header, expandable rows, empty state, footer.
export function TradeLogTable({ log, dense }: TableProps) {
    return (
        <div className={`${cardCls} pt-5 flex flex-col overflow-hidden`}>
            <TableHeader />
            <div className="overflow-x-auto">
                <Rows log={log} dense={dense} />
            </div>
            {log.rows.length === 0 && (
                <EmptyState
                    label={emptyLabel(log)}
                    onClear={log.summary.total > 0 ? log.clearFilters : undefined}
                />
            )}
            <TableFooter summary={log.summary} />
            {log.deletingId && (
                <ConfirmDeleteModal onCancel={log.cancelDelete} onConfirm={log.confirmDelete} />
            )}
        </div>
    );
}
