import { cardCls, ctaCls } from '@/lib/ui';
import { EquityChart } from './equity-chart';
import { ChartTitle } from './equity-card';

// Centered call-to-action overlaid on the ghost curve.
function GhostOverlay({ onStart }: { onStart: () => void }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 pointer-events-none">
            <span className="font-mono text-[10.5px] font-medium tracking-[0.2em] text-[#5f6b70]">
                {'/// NO DATA YET'}
            </span>
            <span className="text-xl font-semibold text-[#eef4f2]">
                Your curve starts at trade #1
            </span>
            <span className="text-[13.5px] text-[#7e8d89] max-w-[340px] text-center">
                The dotted line is what a journaled year can look like.
            </span>
            <button
                type="button"
                onClick={onStart}
                className={`${ctaCls} pointer-events-auto mt-1.5 px-5`}
            >
                Log your first trade
            </button>
        </div>
    );
}

// Guest equity-curve card: dim dashed preview with the signup CTA on top.
export function GhostEquityCard({ onStart }: { onStart: () => void }) {
    return (
        <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
            <div className="flex items-center justify-between gap-4">
                <ChartTitle />
                <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-[#5f6b70] border border-dashed border-[#2b343a] rounded-md px-2.5 py-[5px]">
                    PREVIEW
                </span>
            </div>
            <div className="relative">
                <EquityChart ghost />
                <GhostOverlay onStart={onStart} />
            </div>
        </div>
    );
}
