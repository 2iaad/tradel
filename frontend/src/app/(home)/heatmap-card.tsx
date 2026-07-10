import { HEAT_CELLS } from './home.data';

const DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const dowCls = 'text-center font-mono text-[9px] font-medium tracking-[0.14em] text-[#4d5a5f]';
const cellCls =
    'box-border aspect-square rounded-[7px] border p-[7px] font-mono text-[10px] font-medium transition-[transform,border-color] duration-200 hover:scale-[1.07] hover:border-[#3a464d]';
const greenChipCls =
    'inline-flex rounded-[5px] border border-[rgba(47,213,127,0.25)] bg-[rgba(47,213,127,0.06)] px-[11px] py-1 font-mono text-[10px] font-semibold tracking-[0.08em] text-[#2fd57f]';
const grayChipCls =
    'inline-flex rounded-[5px] border border-[#222a2f] px-[11px] py-1 font-mono text-[10px] font-medium tracking-[0.08em] text-[#78878a]';

// Weekday labels + staggered daily P&L cells.
function HeatGrid() {
    return (
        <div className="grid grid-cols-5 gap-2">
            {DOW.map((d) => (
                <span key={d} className={dowCls}>
                    {d}
                </span>
            ))}
            {HEAT_CELLS.map((c, i) => (
                <div
                    key={i}
                    data-reveal="scale"
                    data-reveal-delay={c.delay}
                    className={cellCls}
                    style={{ background: c.bg, borderColor: c.border, color: c.txt }}
                >
                    {c.day}
                </div>
            ))}
        </div>
    );
}

// June calendar heatmap card — daily P&L intensity per weekday.
export function HeatmapCard() {
    return (
        <div
            data-reveal="up"
            className="flex flex-col gap-4 rounded-[14px] border border-[#1b2226] bg-[#0e1214] px-[26px] py-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
        >
            <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-semibold tracking-[0.14em] text-[#e9eef0]">
                    JUNE 2026
                </span>
                <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-[#5f6b70]">
                    DAILY P&amp;L
                </span>
            </div>
            <HeatGrid />
            <div className="flex flex-wrap gap-2">
                <span className={greenChipCls}>NET +$3,120</span>
                <span className={grayChipCls}>41 TRADES</span>
                <span className={grayChipCls}>61% GREEN DAYS</span>
            </div>
        </div>
    );
}
