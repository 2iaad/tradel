import { cardCls, ghostBtnCls, h2Cls } from '@/lib/ui';
import { G, R, TRADES, Trade } from './dashboard.data';

const tableGrid = 'grid grid-cols-[78px_74px_1fr_1fr_56px_64px_104px_66px] gap-2';

// LONG/SHORT pill for a trade row.
function SideBadge({ side }: { side: string }) {
    const long = side === 'LONG';
    return (
        <span>
            <span
                className="inline-flex px-2 py-0.5 rounded font-mono text-[9.5px] font-semibold tracking-[0.08em] border"
                style={{
                    color: long ? G : R,
                    background: long ? 'rgba(47,213,127,.08)' : 'rgba(240,85,78,.08)',
                    borderColor: long ? 'rgba(47,213,127,.25)' : 'rgba(240,85,78,.25)',
                }}
            >
                {side}
            </span>
        </span>
    );
}

const numCls = 'font-mono text-[12.5px] text-[#93a09d]';

// One row of the recent-trades table.
function TradeRow({ t }: { t: Trade }) {
    const winCol = { color: t.win ? G : R };
    return (
        <div
            className={`${tableGrid} items-center px-[22px] py-[11px] border-t border-[#161c20] transition-colors cursor-default hover:bg-[#10161a]`}
        >
            <span className="font-mono text-[12.5px] font-semibold text-[#e9eef0]">{t.sym}</span>
            <SideBadge side={t.side} />
            <span className={numCls}>{t.entry}</span>
            <span className={numCls}>{t.exit}</span>
            <span className={numCls}>{t.size}</span>
            <span className="font-mono text-[12.5px] font-medium" style={winCol}>
                {t.r}
            </span>
            <span className="font-mono text-[12.5px] font-semibold text-right" style={winCol}>
                {t.pnl}
            </span>
            <span className="font-mono text-[10.5px] text-[#5f6b70] text-right">{t.date}</span>
        </div>
    );
}

// Column labels above the trade rows.
function TableHead() {
    return (
        <div
            className={`${tableGrid} px-[22px] py-2 border-t border-[#161c20] font-mono text-[10px] font-medium tracking-[0.12em] text-[#5f6b70]`}
        >
            <span>SYMBOL</span>
            <span>SIDE</span>
            <span>ENTRY</span>
            <span>EXIT</span>
            <span>SIZE</span>
            <span>R</span>
            <span className="text-right">P&L</span>
            <span className="text-right">DATE</span>
        </div>
    );
}

// Recent-trades card for the signed-in dashboard.
export function TradesTable() {
    return (
        <div className={`${cardCls} pt-5 pb-1.5 flex flex-col`}>
            <div className="flex items-center justify-between px-[22px] pb-3.5">
                <h2 className={h2Cls}>Recent trades</h2>
                <button type="button" className={ghostBtnCls}>
                    VIEW ALL →
                </button>
            </div>
            <TableHead />
            {TRADES.map((t) => (
                <TradeRow key={`${t.sym}-${t.date}`} t={t} />
            ))}
        </div>
    );
}
