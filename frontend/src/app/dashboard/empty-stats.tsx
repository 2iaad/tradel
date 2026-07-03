import { cardCls } from '@/lib/ui';
import { EMPTY_STATS } from './dashboard.data';

const emptyCardCls = `${cardCls} px-5 py-[18px] flex flex-col gap-2 transition-colors hover:border-[#2b343a]`;
const emptyLabelCls = 'font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]';

// One placeholder stat card on the guest dashboard.
function EmptyStatCard({
    label,
    value,
    sub,
    dim,
}: {
    label: string;
    value: string;
    sub: string;
    dim: boolean;
}) {
    return (
        <div className={emptyCardCls}>
            <span className={emptyLabelCls}>{label}</span>
            <span
                className={`text-[26px] font-semibold ${dim ? 'text-[#3d4a4f]' : 'text-[#eef4f2]'}`}
            >
                {value}
            </span>
            <span className="font-mono text-[11px] font-medium text-[#5f6b70]">{sub}</span>
        </div>
    );
}

// Guest stat row: three awaiting-data cards plus the zero trade counter.
export function EmptyStats() {
    return (
        <div className="grid grid-cols-4 gap-4">
            {EMPTY_STATS.map((s) => (
                <EmptyStatCard key={s.label} {...s} value="—" dim />
            ))}
            <EmptyStatCard label="TRADES LOGGED" value="0" sub="LOG A TRADE TO BEGIN" dim={false} />
        </div>
    );
}
