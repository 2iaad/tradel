import type { TradeLogRow } from "./trade-log-row";

const tagCls =
    "inline-flex px-2 py-0.5 rounded font-mono text-[9.5px] font-medium tracking-[0.06em] text-[#78878a] border border-[#222a2f]";

// Empty state shown when a trade has no attached note.
function NoNote() {
    return (
        <div className="flex items-center gap-3.5">
            <span className="text-[12.5px] text-[#5f6b70]">
                No journal note attached to this trade.
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

// Expanded panel under a trade row: its journal note, or the add-note prompt.
export function JournalNote({ t }: { t: TradeLogRow }) {
    return (
        <div className="bg-[#0a0d0f] border-t border-[#161c20] px-[22px] pt-4 pb-[18px] flex flex-col gap-2">
            {t.noteTitle ? (
                <>
                    <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] font-medium tracking-[0.16em] text-[#2fd57f]">
                            {"/// JOURNAL NOTE"}
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
