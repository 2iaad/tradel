import { G, R } from "@/lib/ui";
import { signedMoney } from "@/lib/format";
import { useNotesStore } from "@/stores/notes";
import type { ApiNote } from "@/stores/notes";
import { LOG_GRID } from "./use-trade-log";
import type { TradeLogRow } from "./use-trade-log";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const sideStyle = (long: boolean) => ({
    color: long ? G : R,
    background: long ? "rgba(47,213,127,.08)" : "rgba(240,85,78,.08)",
    borderColor: long ? "rgba(47,213,127,.25)" : "rgba(240,85,78,.25)",
});
const numCls = "font-mono text-ui-sm text-content-muted";
const badgeCls = "inline-flex px-2 py-0.5 rounded font-mono text-ui-xs tracking-[0.06em] border";
const tagCls =
    "inline-flex px-2 py-0.5 rounded font-mono text-ui-xs font-medium tracking-[0.06em] text-muted-foreground border border-border";

// Date (stacked date + time), symbol, and side pill (the three leading
// cells). A green dot by the symbol marks trades that carry at least one note.
function LeadCells({ t, hasNotes }: { t: TradeLogRow; hasNotes: boolean }) {
    return (
        <>
            <span className="flex flex-col gap-0.5">
                <span className="font-mono text-ui-sm text-secondary-foreground">{t.date}</span>
                <span className="font-mono text-ui-xs text-content-faint">{t.clock}</span>
            </span>
            <span className="flex items-center gap-1.5 font-mono text-ui-sm font-semibold text-content">
                {hasNotes && (
                    <span title="Has notes" className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
                {t.sym}
            </span>
            <span>
                    <Badge
                    variant="outline"
                    className={`${badgeCls} h-auto font-semibold tracking-[0.08em]`}
                    style={sideStyle(t.side === "LONG")}
                >
                    {t.side}
                </Badge>
            </span>
        </>
    );
}

// Entry/exit/lots + P&L/R:R/chevron (the trailing cells). Null R/P&L
// (still-open trade) renders as a dash.
function TailCells({ t, open }: { t: TradeLogRow; open: boolean }) {
    const winCol = { color: (t.pnlv ?? 0) >= 0 ? G : R };
    return (
        <>
            <span className={numCls}>{t.entry}</span>
            <span className={numCls}>{t.exit ?? "—"}</span>
            <span className={numCls}>{t.lots}</span>
            <span className="font-mono text-ui-sm font-semibold" style={winCol}>
                {t.pnlv === null ? "—" : signedMoney(t.pnlv)}
            </span>
            <span className="font-mono text-ui-sm font-medium" style={winCol}>
                {t.rv === null ? "—" : `${t.rv > 0 ? "+" : ""}${t.rv.toFixed(1)}R`}
            </span>
            <span
                className="font-mono text-ui-xs text-content-faint text-center inline-block transition-transform"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            >
                ▾
            </span>
        </>
    );
}

// Edit (✎) / delete (✕) icon buttons in the trailing cell.
function RowIcons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    const cls = "bg-transparent border-none p-0 cursor-pointer text-ui-sm leading-none transition-colors";
    return (
        <span className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
                type="button"
                onClick={onEdit}
                title="Edit trade"
                variant="ghost"
                size="icon-sm"
                className={`${cls} text-content-faint hover:bg-transparent hover:text-primary`}
            >
                ✎
            </Button>
            <Button
                type="button"
                onClick={onDelete}
                title="Delete trade"
                variant="ghost"
                size="icon-sm"
                className={`${cls} text-content-faint hover:bg-transparent hover:text-loss`}
            >
                ✕
            </Button>
        </span>
    );
}

// Empty state shown when a trade has no attached note.
function NoNote({ onAddNote }: { onAddNote: () => void }) {
    return (
        <div className="flex items-center gap-3.5">
            <span className="text-ui-sm text-content-faint">
                No note attached to this trade.
            </span>
            <Button
                type="button"
                onClick={onAddNote}
                variant="link"
                className="h-auto p-0 font-mono text-ui-xs font-medium tracking-[0.1em] text-primary no-underline hover:text-primary-hover"
            >
                + ADD NOTE
            </Button>
        </div>
    );
}

// One attached note rendered inside the expanded panel.
function NoteBlock({ note }: { note: ApiNote }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2.5">
                <span className="text-ui-md font-semibold text-content">{note.title}</span>
                {note.tags.length > 0 && (
                    <span className="flex flex-wrap items-center gap-1.5">
                        {note.tags.map((tag) => (
                            <span key={tag} className={tagCls}>
                                {tag}
                            </span>
                        ))}
                    </span>
                )}
            </div>
            <span className="text-ui-sm leading-[1.6] text-content-dim max-w-[720px]">
                {note.body}
            </span>
        </div>
    );
}

// Expanded panel under a trade row: its note(s), or the add-note prompt.
// Notes are joined from the notes store by trade id.
function NotePanel({ t, onAddNote }: { t: TradeLogRow; onAddNote: () => void }) {
    const notes = useNotesStore((s) => s.notes);
    const tradeNotes = notes.filter((n) => n.trade_id === t.id);
    return (
        <div className="bg-muted border-t border-border-faint px-[22px] pt-4 pb-[18px] flex flex-col gap-3.5">
            {tradeNotes.length > 0 ? (
                tradeNotes.map((n) => <NoteBlock key={n.id} note={n} />)
            ) : (
                <NoNote onAddNote={onAddNote} />
            )}
        </div>
    );
}

interface TradeRowProps {
    t: TradeLogRow;
    open: boolean;
    dense: boolean;
    hasNotes: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddNote: () => void;
}

// One trade row (click to expand its note) + the expandable panel. A green dot
// on the chevron marks trades that carry at least one note.
export function TradeRow({
    t,
    open,
    dense,
    hasNotes,
    onToggle,
    onEdit,
    onDelete,
    onAddNote,
}: TradeRowProps) {
    return (
        <div>
            <div
                onClick={onToggle}
                className={`${LOG_GRID} items-center px-[22px] ${dense ? "py-[7px]" : "py-[11px]"} border-t border-border-faint transition-colors cursor-pointer hover:bg-accent ${open ? "bg-accent" : ""}`}
            >
                <LeadCells t={t} hasNotes={hasNotes} />
                <TailCells t={t} open={open} />
                <RowIcons onEdit={onEdit} onDelete={onDelete} />
            </div>
            {open && <NotePanel t={t} onAddNote={onAddNote} />}
        </div>
    );
}
