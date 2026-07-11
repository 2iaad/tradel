"use client";

import { useAuthSubmit } from "@/hooks/use-auth-submit";
import { apiMessage } from "@/lib/api";
import { signedMoney } from "@/lib/format";
import { errorCls } from "@/lib/ui";
import type { TradePayload } from "@/stores/trades";
import { LOG_GRID } from "./trade-log-grid";
import type { TradeLogRow } from "./trade-log-row";

const inCls =
    "w-full box-border bg-[#0a0d0f] border border-[#222a2f] rounded px-2 py-1.5 font-mono text-[12px] text-[#e9eef0] outline-none focus:border-[#2fd57f66] [color-scheme:dark]";
const dashCls = "font-mono text-[12px] text-[#4d5a5f]";

// "YYYY-MM-DD" date-input value from an ISO stamp, in local time.
function toDateInput(iso?: string) {
    const d = iso ? new Date(iso) : new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}

// openedAt ISO from the picked date, keeping the previous (or current) clock time.
function withClock(date: string, prevIso: string | null): string {
    const d = prevIso ? new Date(prevIso) : new Date();
    const [y, m, day] = date.split("-").map(Number);
    d.setFullYear(y, m - 1, day);
    return d.toISOString();
}

// Inline form fields → trades API payload; empty optional fields stay undefined.
function toPayload(f: FormData, prev: TradeLogRow | null): TradePayload {
    const opt = (k: string) => {
        const v = f.get(k);
        return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
    };
    const num = (k: string) => (opt(k) === undefined ? undefined : Number(opt(k)));
    return {
        symbol: f.get("symbol") as string,
        side: f.get("side") as "LONG" | "SHORT",
        entry: num("entry"),
        exit: num("exit"),
        size: num("size"),
        // R has no column on create (CreateTradeDto) — edit only.
        r: prev ? num("r") : undefined,
        openedAt: withClock(f.get("openedAt") as string, prev?.openedAt ?? null),
    };
}

// Input cells aligned to the log grid columns; P&L stays computed server-side.
function FormCells({ t }: { t: TradeLogRow | null }) {
    return (
        <>
            <input name="symbol" defaultValue={t?.sym} required maxLength={20} placeholder="SYM" className={inCls} />
            <select name="side" defaultValue={t?.side ?? "LONG"} className={inCls}>
                <option>LONG</option>
                <option>SHORT</option>
            </select>
            <span className={dashCls}>—</span>
            <input name="entry" type="number" step="any" defaultValue={t?.entry} required placeholder="entry" className={inCls} />
            <input name="exit" type="number" step="any" defaultValue={t?.exit ?? ""} placeholder="—" className={inCls} />
            <input name="size" type="number" step="any" defaultValue={t?.size} required placeholder="size" className={inCls} />
            {t ? (
                <input name="r" type="number" step="any" defaultValue={t.rv ?? ""} placeholder="—" className={inCls} />
            ) : (
                <span className={dashCls}>—</span>
            )}
            <span className={`${dashCls} text-right`}>
                {t?.pnlv != null ? signedMoney(t.pnlv) : "—"}
            </span>
            <input name="openedAt" type="date" defaultValue={toDateInput(t?.openedAt)} required className={inCls} />
        </>
    );
}

// Save (✓) / cancel (✕) buttons in the trailing cell.
function FormIcons({ pending, onCancel }: { pending: boolean; onCancel: () => void }) {
    const cls = "bg-transparent border-none p-0 cursor-pointer text-[13px] leading-none";
    return (
        <span className="flex items-center justify-end gap-2">
            <button type="submit" disabled={pending} title="Save" className={`${cls} text-[#2fd57f] hover:text-[#5fe9a0] disabled:opacity-50`}>
                ✓
            </button>
            <button type="button" onClick={onCancel} title="Cancel" className={`${cls} text-[#5f6b70] hover:text-[#c8d2d0]`}>
                ✕
            </button>
        </span>
    );
}

// Inline editable trade row (add + edit); Enter or ✓ saves, ✕ cancels.
export function TradeRowForm({
    t,
    onSave,
    onCancel,
}: {
    t: TradeLogRow | null;
    onSave: (payload: TradePayload, id?: string) => Promise<void>;
    onCancel: () => void;
}) {
    const { pending, error, onSubmit } = useAuthSubmit(async (f) => {
        try {
            await onSave(toPayload(f, t), t?.id);
        } catch (err) {
            throw new Error(apiMessage(err));
        }
    }, onCancel);
    return (
        <form onSubmit={onSubmit} className="border-t border-[#161c20] bg-[#10161a]">
            <div className={`${LOG_GRID} items-center px-[22px] py-[7px]`}>
                <FormCells t={t} />
                <span />
                <FormIcons pending={pending} onCancel={onCancel} />
            </div>
            {error && <p className={`${errorCls} px-[22px] pb-2 font-mono text-[11px]`}>{error}</p>}
        </form>
    );
}
