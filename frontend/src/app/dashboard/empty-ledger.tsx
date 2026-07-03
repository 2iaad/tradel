import { cardCls, h2Cls } from '@/lib/ui';

const emptyBoxCls =
    'flex-1 flex flex-col items-center justify-center gap-2 border border-dashed border-[#2b343a] rounded-lg px-5 py-9';
const emptyKickerCls = 'font-mono text-[10.5px] font-medium tracking-[0.2em] text-[#5f6b70]';

// Dashed empty-state card with a kicker, blurb, and optional action.
function EmptyCard({
    title,
    kicker,
    text,
    maxW,
    children,
}: {
    title: string;
    kicker: string;
    text: string;
    maxW: string;
    children?: React.ReactNode;
}) {
    return (
        <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
            <h2 className={h2Cls}>{title}</h2>
            <div className={emptyBoxCls}>
                <span className={emptyKickerCls}>{kicker}</span>
                <span className={`text-[13.5px] text-[#7e8d89] text-center ${maxW}`}>{text}</span>
                {children}
            </div>
        </div>
    );
}

// Guest placeholders for the recent-trades and journal-notes cards.
export function EmptyLedger({ onLog }: { onLog: () => void }) {
    return (
        <div className="grid grid-cols-[1.9fr_1fr] gap-4 items-stretch">
            <EmptyCard
                title="Recent trades"
                kicker="/// EMPTY LEDGER"
                text="Every trade you log lands here — entry, exit, size, and R."
                maxW="max-w-[300px]"
            >
                <button
                    type="button"
                    onClick={onLog}
                    className="mt-1.5 bg-transparent border border-[rgba(47,213,127,0.3)] rounded-lg px-4 py-[9px] text-[#2fd57f] font-semibold text-[12.5px] cursor-pointer transition-colors hover:bg-[rgba(47,213,127,0.08)] hover:border-[#2fd57f]"
                >
                    + Log a trade
                </button>
            </EmptyCard>
            <EmptyCard
                title="Journal notes"
                kicker="/// NO NOTES"
                text="The reasoning behind each trade — the part that makes you better."
                maxW="max-w-[240px]"
            />
        </div>
    );
}
