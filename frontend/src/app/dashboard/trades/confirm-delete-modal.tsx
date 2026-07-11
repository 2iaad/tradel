"use client";

import { kickerCls } from "@/lib/ui";

const btn =
    "flex-1 rounded-lg px-4 py-2.5 font-mono text-[11px] font-semibold tracking-[0.1em] cursor-pointer transition-colors";

// Cancel / delete button pair.
function ConfirmButtons({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
    return (
        <div className="flex gap-2.5 mt-1">
            <button
                type="button"
                onClick={onCancel}
                className={`${btn} bg-transparent border border-[#222a2f] text-[#78878a] hover:text-[#c8d2d0] hover:border-[#2b353b]`}
            >
                CANCEL
            </button>
            <button
                type="button"
                onClick={onConfirm}
                className={`${btn} border-none bg-[#f0554e] text-[#140404] hover:bg-[#ff6f68]`}
            >
                DELETE
            </button>
        </div>
    );
}

// Confirmation card shown before a trade is deleted.
export function ConfirmDeleteModal({
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
                <span className={kickerCls}>{"/// DELETE TRADE"}</span>
                <h2 className="m-0 text-xl font-semibold text-[#eef4f2]">Delete this trade?</h2>
                <p className="m-0 text-[13px] text-[#8a9995]">
                    The trade is removed from your journal. This can&apos;t be undone.
                </p>
                <ConfirmButtons onCancel={onCancel} onConfirm={onConfirm} />
            </div>
        </div>
    );
}
