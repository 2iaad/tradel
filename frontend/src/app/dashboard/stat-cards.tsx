import { cardCls } from '@/lib/ui';
import { STATS } from './dashboard.data';

// Four demo stat cards across the top of the signed-in dashboard.
export function StatCards() {
    return (
        <div className="grid grid-cols-4 gap-4">
            {STATS.map((s) => (
                <div
                    key={s.label}
                    className={`${cardCls} px-5 py-[18px] flex flex-col gap-2 transition-[border-color,transform] duration-200 hover:border-[#2fd57f44] hover:-translate-y-0.5`}
                >
                    <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]">
                        {s.label}
                    </span>
                    <span
                        className="text-[26px] font-semibold tracking-[-0.01em]"
                        style={{ color: s.vCol }}
                    >
                        {s.value}
                    </span>
                    <span className="font-mono text-[11px] font-medium" style={{ color: s.sCol }}>
                        {s.sub}
                    </span>
                </div>
            ))}
        </div>
    );
}
