"use client";

import { useMemo, useState } from "react";

import { cardCls, kickerCls } from "@/lib/ui";
import { useNotesStore } from "@/stores/notes";
import type { TradePayload } from "@/stores/trades";
import { NoteModal } from "../journal/note-modal";
import { TradeRow } from "./trade-row";
import { TradeRowForm } from "./trade-row-form";
import { LOG_GRID } from "./use-trade-log";
import type { SortCol, useTradeLog } from "./use-trade-log";

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
    log: Log;
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
function TradeLogHead({ log }: { log: Log }) {
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

// Always-visible last row: "+ ADD TRADE"; click flips it to the inline form.
function TradeAddRow({
    active,
    onActivate,
    onSave,
    onCancel,
}: {
    active: boolean;
    onActivate: () => void;
    onSave: (payload: TradePayload, id?: string) => Promise<void>;
    onCancel: () => void;
}) {
    if (active) return <TradeRowForm t={null} onSave={onSave} onCancel={onCancel} />;
    return (
        <button
            type="button"
            onClick={onActivate}
            className="w-full box-border bg-transparent border-0 border-t border-solid border-[#161c20] py-3 font-mono text-[11px] font-medium tracking-[0.14em] text-[#5f6b70] cursor-pointer transition-colors hover:text-[#2fd57f] hover:bg-[#10161a]"
        >
            + ADD TRADE
        </button>
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
// editing) + the always-present add row. `tradesWithNotes` marks which rows
// carry notes; `onAddNote` opens the note form pre-scoped to a trade.
function Rows({
    log,
    dense,
    tradesWithNotes,
    onAddNote,
}: TableProps & { tradesWithNotes: Set<string>; onAddNote: (tradeId: string) => void }) {
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
                        hasNotes={tradesWithNotes.has(t.id)}
                        onToggle={() => log.toggleOpen(t.id)}
                        onEdit={() => log.startEdit(t.id)}
                        onDelete={() => log.askDelete(t.id)}
                        onAddNote={() => onAddNote(t.id)}
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

const confirmBtn =
    "flex-1 rounded-lg px-4 py-2.5 font-mono text-[11px] font-semibold tracking-[0.1em] cursor-pointer transition-colors";

// Confirmation card shown before a trade is deleted.
function ConfirmDeleteModal({
    onCancel,
    onConfirm,
}: {
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <div
            onClick={onCancel}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,6,8,0.7)] backdrop-blur-[6px] animate-[tradelFadeIn_0.25s_ease]"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-[360px] max-w-[calc(100vw-48px)] box-border bg-[#0e1214] border border-[#222a2f] rounded-xl px-[30px] py-7 flex flex-col gap-4 animate-[tradelPopIn_0.3s_cubic-bezier(0.34,1.4,0.44,1)]"
            >
                <h2 className="m-0 text-xl font-semibold text-[#eef4f2]">Delete this trade?</h2>
                <p className="m-0 text-[13px] text-[#8a9995]">
                    The trade is removed from your journal. This can&apos;t be undone.
                </p>
                <div className="flex gap-2.5 mt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        className={`${confirmBtn} bg-transparent border border-[#222a2f] text-[#78878a] hover:text-[#c8d2d0] hover:border-[#2b353b]`}
                    >
                        CANCEL
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`${confirmBtn} border-none bg-[#f0554e] text-[#140404] hover:bg-[#ff6f68]`}
                    >
                        DELETE
                    </button>
                </div>
            </div>
        </div>
    );
}

// Full trade log: sortable header, expandable rows, empty state, footer.
export function TradeLogTable({ log, dense }: TableProps) {
    const notes = useNotesStore((s) => s.notes);
    const tradesWithNotes = useMemo(
        () => new Set(notes.map((n) => n.trade_id)),
        [notes],
    );
    // Trade id the "+ add note" prompt targets (null = closed).
    const [addNoteFor, setAddNoteFor] = useState<string | null>(null);

    return (
        <div className={`${cardCls} pt-5 flex flex-col overflow-hidden`}>
            <TableHeader />
            <div className="overflow-x-auto">
                <Rows
                    log={log}
                    dense={dense}
                    tradesWithNotes={tradesWithNotes}
                    onAddNote={setAddNoteFor}
                />
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
            {addNoteFor && (
                <NoteModal note={null} tradeId={addNoteFor} onClose={() => setAddNoteFor(null)} />
            )}
        </div>
    );
}
