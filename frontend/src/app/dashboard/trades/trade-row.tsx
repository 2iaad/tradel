import { G, R } from "../dashboard.data";
import { signedMoney } from "@/lib/format";
import { JournalNote } from "./journal-note";
import { LOG_GRID } from "./trade-log-grid";
import type { TradeLogRow } from "./trade-log-row";

const sideStyle = (long: boolean) => ({
    color: long ? G : R,
    background: long ? "rgba(47,213,127,.08)" : "rgba(240,85,78,.08)",
    borderColor: long ? "rgba(47,213,127,.25)" : "rgba(240,85,78,.25)",
});
const numCls = "font-mono text-[12.5px] text-[#93a09d]";
const badgeCls = "inline-flex px-2 py-0.5 rounded font-mono text-[9.5px] tracking-[0.06em] border";

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

interface TradeRowProps {
    t: TradeLogRow;
    open: boolean;
    dense: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

// One trade row (click to expand its journal note) + the expandable panel.
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
            {open && <JournalNote t={t} />}
        </div>
    );
}
