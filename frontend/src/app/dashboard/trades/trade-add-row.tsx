"use client";

import type { TradePayload } from "@/stores/trades";
import { TradeRowForm } from "./trade-row-form";

// Always-visible last row: "+ ADD TRADE"; click flips it to the inline form.
export function TradeAddRow({
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
