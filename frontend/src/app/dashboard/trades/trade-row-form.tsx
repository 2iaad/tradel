"use client";

import { useAuthSubmit } from "@/hooks/use-auth-submit";
import { apiMessage } from "@/lib/api";
import { signedMoney } from "@/lib/format";
import { errorCls } from "@/lib/ui";
import type { TradePayload } from "@/stores/trades";
import { LOG_GRID } from "./use-trade-log";
import type { TradeLogRow } from "./use-trade-log";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const inCls =
    "w-full box-border bg-muted border border-border rounded px-2 py-1.5 font-mono text-[12px] text-content outline-none focus:border-primary/40 [color-scheme:dark]";
const dashCls = "font-mono text-[12px] text-content-placeholder";

// Inline form fields → trades API payload; empty optional fields stay undefined.
// The trade date is created_at (set server-side), so there's no date field.
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
        lots: num("lots"),
        // R:R has no column on create (CreateTradeDto) — edit only.
        rReward: prev ? num("rReward") : undefined,
    };
}

// Input cells aligned to the log grid columns; P&L stays computed server-side.
function FormCells({ t }: { t: TradeLogRow | null }) {
    return (
        <>
            {/* date column: created_at, set server-side — shown after save */}
            <span className={dashCls}>{t?.date ?? "—"}</span>
            <Input name="symbol" defaultValue={t?.sym} required maxLength={20} placeholder="SYM" className={inCls} />
            <Select name="side" defaultValue={t?.side ?? "LONG"}>
                <SelectTrigger className={inCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="LONG">LONG</SelectItem>
                    <SelectItem value="SHORT">SHORT</SelectItem>
                </SelectContent>
            </Select>
            <Input name="entry" type="number" step="any" defaultValue={t?.entry} required placeholder="entry" className={inCls} />
            <Input name="exit" type="number" step="any" defaultValue={t?.exit ?? ""} placeholder="—" className={inCls} />
            <Input name="lots" type="number" step="any" defaultValue={t?.lots} required placeholder="lots" className={inCls} />
            <span className={dashCls}>
                {t?.pnlv != null ? signedMoney(t.pnlv) : "—"}
            </span>
            {t ? (
                <Input name="rReward" type="number" step="any" defaultValue={t.rv ?? ""} placeholder="—" className={inCls} />
            ) : (
                <span className={dashCls}>—</span>
            )}
        </>
    );
}

// Save (✓) / cancel (✕) buttons in the trailing cell.
function FormIcons({ pending, onCancel }: { pending: boolean; onCancel: () => void }) {
    const cls = "bg-transparent border-none p-0 cursor-pointer text-[13px] leading-none";
    return (
        <span className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={pending} title="Save" variant="ghost" size="icon-xs" className={`${cls} text-primary hover:bg-transparent hover:text-primary-hover`}>
                ✓
            </Button>
            <Button type="button" onClick={onCancel} title="Cancel" variant="ghost" size="icon-xs" className={`${cls} text-content-faint hover:bg-transparent hover:text-secondary-foreground`}>
                ✕
            </Button>
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
        <form onSubmit={onSubmit} className="border-t border-border-faint bg-accent">
            <div className={`${LOG_GRID} items-center px-[22px] py-[7px]`}>
                <FormCells t={t} />
                <span />
                <FormIcons pending={pending} onCancel={onCancel} />
            </div>
            {error && <p className={`${errorCls} px-[22px] pb-2 font-mono text-[11px]`}>{error}</p>}
        </form>
    );
}
