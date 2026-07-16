import { G, R } from "@/lib/ui";
import { signedMoney } from "@/lib/format";
import { LOG_GRID } from "./use-trade-log";
import type { TradeLogRow } from "./use-trade-log";

const sideStyle = (long: boolean) => ({
    color: long ? G : R,
    background: long ? "rgba(47,213,127,.08)" : "rgba(240,85,78,.08)",
    borderColor: long ? "rgba(47,213,127,.25)" : "rgba(240,85,78,.25)",
});
const numCls = "font-mono text-[12.5px] text-[#93a09d]";
const badgeCls = "inline-flex px-2 py-0.5 rounded font-mono text-[9.5px] tracking-[0.06em] border";
const tagCls =
    "inline-flex px-2 py-0.5 rounded font-mono text-[9.5px] font-medium tracking-[0.06em] text-[#78878a] border border-[#222a2f]";

// Symbol, side pill, and setup pill (the three leading cells).
function LeadCells({ t }: { t: TradeLogRow }) {
    return (
        <>
            <span className="font-mono text-[12.5px] font-semibold text-[#e9eef0]">{t.sym}</span>
            <span>
                <span
                    className={`${badgeCls} font-semibold tracking-[0.08em]`}
                    style={sideStyle(t.side === "LONG")}
                >
                    {t.side}
                </span>
            </span>
            <span>
                <span className={`${badgeCls} font-medium text-[#78878a] border-[#222a2f]`}>
                    {t.setup || "—"}
                </span>
            </span>
        </>
    );
}

// Entry/exit/size + R/P&L/date/chevron (the trailing cells). Null R/P&L
// (still-open trade) renders as a dash.
function TailCells({ t, open }: { t: TradeLogRow; open: boolean }) {
    const winCol = { color: (t.pnlv ?? 0) >= 0 ? G : R };
    return (
        <>
            <span className={numCls}>{t.entry}</span>
            <span className={numCls}>{t.exit ?? "—"}</span>
            <span className={numCls}>{t.size}</span>
            <span className="font-mono text-[12.5px] font-medium" style={winCol}>
                {t.rv === null ? "—" : `${t.rv > 0 ? "+" : ""}${t.rv.toFixed(1)}R`}
            </span>
            <span className="font-mono text-[12.5px] font-semibold text-right" style={winCol}>
                {t.pnlv === null ? "—" : signedMoney(t.pnlv)}
            </span>
            <span className="font-mono text-[10.5px] text-[#5f6b70] text-right">{t.date}</span>
            <span
                className="font-mono text-[11px] text-[#5f6b70] text-center inline-block transition-transform"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            >
                ▾
            </span>
        </>
    );
}

// Edit (✎) / delete (✕) icon buttons in the trailing cell.
function RowIcons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    const cls = "bg-transparent border-none p-0 cursor-pointer text-[13px] leading-none transition-colors";
    return (
        <span className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={onEdit}
                title="Edit trade"
                className={`${cls} text-[#5f6b70] hover:text-[#2fd57f]`}
            >
                ✎
            </button>
            <button
                type="button"
                onClick={onDelete}
                title="Delete trade"
                className={`${cls} text-[#5f6b70] hover:text-[#f0554e]`}
            >
                ✕
            </button>
        </span>
    );
}

// Empty state shown when a trade has no attached note.
function NoNote() {
    return (
        <div className="flex items-center gap-3.5">
            <span className="text-[12.5px] text-[#5f6b70]">
                No note attached to this trade.
            </span>
            <button
                type="button"
                className="bg-none border-none p-0 font-mono text-[11px] font-medium tracking-[0.1em] text-[#2fd57f] cursor-pointer hover:text-[#5fe9a0]"
            >
                + ADD NOTE
            </button>
        </div>
    );
}

// Expanded panel under a trade row: its note, or the add-note prompt.
function NotePanel({ t }: { t: TradeLogRow }) {
    return (
        <div className="bg-[#0a0d0f] border-t border-[#161c20] px-[22px] pt-4 pb-[18px] flex flex-col gap-2">
            {t.noteTitle ? (
                <>
                    <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] font-medium tracking-[0.16em] text-[#2fd57f]">
                            {"/// NOTE"}
                        </span>
                        <span className="font-mono text-[10px] text-[#4d5a5f]">{t.time}</span>
                    </div>
                    <span className="text-[14.5px] font-semibold text-[#e9eef0]">{t.noteTitle}</span>
                    <span className="text-[13px] leading-[1.6] text-[#8a9995] max-w-[720px]">
                        {t.noteBody}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className={tagCls}>{t.tags[0]}</span>
                        <span className={tagCls}>{t.tags[1]}</span>
                    </span>
                </>
            ) : (
                <NoNote />
            )}
        </div>
    );
}

interface TradeRowProps {
    t: TradeLogRow;
    open: boolean;
    dense: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

// One trade row (click to expand its note) + the expandable panel.
export function TradeRow({ t, open, dense, onToggle, onEdit, onDelete }: TradeRowProps) {
    return (
        <div>
            <div
                onClick={onToggle}
                className={`${LOG_GRID} items-center px-[22px] ${dense ? "py-[7px]" : "py-[11px]"} border-t border-[#161c20] transition-colors cursor-pointer hover:bg-[#10161a] ${open ? "bg-[#10161a]" : ""}`}
            >
                <LeadCells t={t} />
                <TailCells t={t} open={open} />
                <RowIcons onEdit={onEdit} onDelete={onDelete} />
            </div>
            {open && <NotePanel t={t} />}
        </div>
    );
}
