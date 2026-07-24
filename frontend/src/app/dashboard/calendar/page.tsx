'use client';

import { useEffect, useMemo } from 'react';

import { signedMoney } from '@/lib/format';
import { cardCls, G, R } from '@/lib/ui';
import { useCalendarStore } from '@/stores/calendar';
import type { CalendarDay } from '@/stores/calendar';
import { PageHeader } from '../page-header';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Shift a 'YYYY-MM' by n months.
function shiftMonth(month: string, n: number): string {
    const [y, m] = month.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

// "July 2026" label for a 'YYYY-MM'.
function monthLabel(month: string): string {
    const [y, m] = month.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

// Grid cells for a month: leading nulls pad to the first day's weekday, then
// one entry per day carrying its P&L data (zeroed when no trades that day).
function buildCells(month: string, byDate: Map<string, CalendarDay>): (CalendarDay | null)[] {
    const [y, m] = month.split('-').map(Number);
    const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells: (CalendarDay | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
        const date = `${month}-${String(d).padStart(2, '0')}`;
        cells.push(byDate.get(date) ?? { date, pnl: 0, trades: 0 });
    }
    return cells;
}

// One day cell: date number, tinted background + P&L when there were trades.
function DayCell({ day }: { day: CalendarDay | null }) {
    if (!day) return <div />; // padding slot before the 1st
    const dayNum = Number(day.date.slice(-2));
    const active = day.trades > 0;
    const pos = day.pnl >= 0;
    const tint = !active ? undefined : pos ? 'rgba(47,213,127,0.12)' : 'rgba(240,85,78,0.12)';
    return (
        <div
            className="aspect-square rounded-lg border border-[#1b2226] p-2 flex flex-col justify-between"
            style={{ background: tint }}
        >
            <span className="font-mono text-[11px] text-[#5f6b70]">{dayNum}</span>
            {active && (
                <span className="flex flex-col gap-0.5">
                    <span className="font-mono text-[12px] font-semibold" style={{ color: pos ? G : R }}>
                        {signedMoney(day.pnl)}
                    </span>
                    <span className="font-mono text-[9.5px] text-[#5f6b70]">
                        {day.trades} {day.trades === 1 ? 'TRADE' : 'TRADES'}
                    </span>
                </span>
            )}
        </div>
    );
}

// Prev/next month buttons + current month label.
function MonthNav({ month, onShift }: { month: string; onShift: (n: number) => void }) {
    const btn =
        'rounded-lg px-3 py-1.5 bg-[#0a0d0f] border border-[#1b2226] font-mono text-[13px] text-[#c8d2d0] cursor-pointer hover:border-[#2b353b]';
    return (
        <div className="flex items-center gap-3">
            <button type="button" onClick={() => onShift(-1)} className={btn}>
                ‹
            </button>
            <span className="min-w-[140px] text-center text-[14px] font-medium text-[#eef4f2]">
                {monthLabel(month)}
            </span>
            <button type="button" onClick={() => onShift(1)} className={btn}>
                ›
            </button>
        </div>
    );
}

export default function CalendarPage() {
    const month = useCalendarStore((s) => s.month);
    const days = useCalendarStore((s) => s.days);
    const load = useCalendarStore((s) => s.load);

    // Load once on mount; month changes go through MonthNav → load directly.
    useEffect(() => {
        load(month);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]);

    const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
    const cells = useMemo(() => buildCells(month, byDate), [month, byDate]);
    const monthNet = useMemo(() => days.reduce((s, d) => s + d.pnl, 0), [days]);

    return (
        <div className="w-full max-w-[1240px] box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader kicker="CALENDAR" title="Daily P&L">
                <MonthNav month={month} onShift={(n) => load(shiftMonth(month, n))} />
            </PageHeader>
            <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-4`}>
                <div className="grid grid-cols-7 gap-2">
                    {WEEKDAYS.map((w) => (
                        <span
                            key={w}
                            className="text-center font-mono text-[10px] font-medium tracking-[0.12em] text-[#5f6b70]"
                        >
                            {w}
                        </span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {cells.map((c, i) => (
                        <DayCell key={c ? c.date : `pad-${i}`} day={c} />
                    ))}
                </div>
                <div className="flex justify-end border-t border-[#161c20] pt-3">
                    <span className="font-mono text-[12px] text-[#5f6b70]">
                        MONTH NET&nbsp;
                        <span style={{ color: monthNet >= 0 ? G : R }}>{signedMoney(monthNet)}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
