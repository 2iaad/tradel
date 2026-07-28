"use client";

import { useMemo, useState } from "react";

import { cardCls } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
            <h2 className="m-0 text-[17px] font-semibold text-card-foreground">All trades</h2>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-auto border-border-subtle bg-transparent px-3 py-1.5 font-mono text-[10.5px] font-medium tracking-[0.1em] text-muted-foreground hover:bg-transparent hover:text-secondary-foreground hover:border-border-hover whitespace-nowrap"
            >
                EXPORT CSV
            </Button>
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
        <Button
            type="button"
            onClick={() => log.sortBy(col)}
            variant="ghost"
            size="xs"
            className={`h-auto p-0 font-mono text-[10px] font-medium tracking-[0.12em] hover:bg-transparent hover:text-secondary-foreground ${align === "right" ? "text-right" : "text-left"} ${on ? "text-secondary-foreground" : "text-content-faint"}`}
        >
            {label} {on ? (log.dir === "desc" ? "▼" : "▲") : ""}
        </Button>
    );
}

// Column labels for the trade log; R / P&L / DATE are sortable.
function TradeLogHead({ log }: { log: Log }) {
    return (
        <div
            className={`${LOG_GRID} items-center px-[22px] py-2 border-t border-border-faint font-mono text-[10px] font-medium tracking-[0.12em] text-content-faint`}
        >
            <SortHead col="date" label="DATE" align="left" log={log} />
            <span>SYMBOL</span>
            <span>SIDE</span>
            <span>ENTRY</span>
            <span>EXIT</span>
            <span>LOTS</span>
            <SortHead col="pnl" label="P&L" align="left" log={log} />
            <SortHead col="r" label="R:R" align="left" log={log} />
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
        <Button
            type="button"
            onClick={onActivate}
            variant="ghost"
            className="h-18 w-full box-border rounded-none border-0 border-t border-solid border-border-faint bg-[#090d0e] py-3 font-mono text-[11px] font-medium tracking-[0.14em] text-primary hover:bg-accent"
        >
            + ADD TRADE
        </Button>
    );
}

// Shown when the table body has no rows; clear-filters only when they hide trades.
function EmptyState({ label, onClear }: { label: string; onClear?: () => void }) {
    return (
        <div className="flex flex-col items-center gap-3 py-14 px-[22px] border-t border-border-faint">
            <span className="font-mono text-[11px] font-medium tracking-[0.16em] text-content-faint">
                {label}
            </span>
            {onClear && (
                <Button
                    type="button"
                    onClick={onClear}
                    variant="outline"
                    size="sm"
                    className="h-auto border-border-subtle bg-transparent px-4 py-2 font-mono text-[11px] font-medium tracking-[0.1em] text-primary hover:bg-transparent hover:border-primary/25"
                >
                    CLEAR FILTERS
                </Button>
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
        <div className="flex items-center justify-between px-[22px] py-3 border-t border-border-faint bg-[#0c1012] font-mono text-[10.5px] font-medium tracking-[0.1em] text-content-faint">
            <span>
                SHOWING {summary.count} OF {summary.total} TRADES
            </span>
            <span>{summary.notedPct} WITH NOTES</span>
        </div>
    );
}

const confirmBtn =
    "h-auto flex-1 rounded-lg px-4 py-2.5 font-mono text-[11px] font-semibold tracking-[0.1em] cursor-pointer transition-colors";

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
                className="w-[360px] max-w-[calc(100vw-48px)] box-border bg-card border border-border rounded-xl px-[30px] py-7 flex flex-col gap-4 animate-[tradelPopIn_0.3s_cubic-bezier(0.34,1.4,0.44,1)]"
            >
                <h2 className="m-0 text-xl font-semibold text-card-foreground">Delete this trade?</h2>
                <p className="m-0 text-[13px] text-content-dim">
                    The trade is removed from your journal. This can&apos;t be undone.
                </p>
                <div className="flex gap-2.5 mt-1">
                    <Button
                        type="button"
                        onClick={onCancel}
                        variant="outline"
                        className={`${confirmBtn} border-border bg-transparent text-muted-foreground hover:bg-transparent hover:text-secondary-foreground hover:border-border-hover`}
                    >
                        CANCEL
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        variant="destructive"
                        className={`${confirmBtn} bg-loss text-loss-foreground hover:bg-loss-hover`}
                    >
                        DELETE
                    </Button>
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
        <Card className={`${cardCls} pt-5 flex flex-col overflow-hidden`}>
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
        </Card>
    );
}
