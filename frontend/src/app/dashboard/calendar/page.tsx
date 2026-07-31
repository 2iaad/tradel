'use client';

import { useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signedMoney } from '@/lib/format';
import { cardCls, G, R } from '@/lib/ui';
import { useCalendarStore } from '@/stores/calendar';
import { PageHeader } from '../page-header';
import { CalendarChart } from './calendar-chart';

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

// Prev/next month buttons + current month label.
function MonthNav({ month, onShift }: { month: string; onShift: (n: number) => void }) {
    return (
        <div className="flex items-center gap-3">
            <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Previous month"
                onClick={() => onShift(-1)}
                className="border-border-subtle bg-muted font-mono text-ui-sm text-secondary-foreground hover:bg-accent hover:text-card-foreground"
            >
                ‹
            </Button>
            <span className="min-w-[140px] text-center text-ui-md font-medium text-card-foreground">
                {monthLabel(month)}
            </span>
            <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Next month"
                onClick={() => onShift(1)}
                className="border-border-subtle bg-muted font-mono text-ui-sm text-secondary-foreground hover:bg-accent hover:text-card-foreground"
            >
                ›
            </Button>
        </div>
    );
}

export default function CalendarPage() {
    const month = useCalendarStore((s) => s.month);
    const days = useCalendarStore((s) => s.days);
    const loading = useCalendarStore((s) => s.loading);
    const error = useCalendarStore((s) => s.error);
    const load = useCalendarStore((s) => s.load);

    // Load once on mount; month changes go through MonthNav → load directly.
    useEffect(() => {
        load(month);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]);

    const monthNet = useMemo(() => days.reduce((s, d) => s + d.pnl, 0), [days]);
    const totalTrades = useMemo(() => days.reduce((s, d) => s + d.trades, 0), [days]);
    const tradingDays = useMemo(() => days.filter((day) => day.trades > 0).length, [days]);

    return (
        <div className="box-border mx-auto flex w-full max-w-11/12 flex-col gap-5 px-9 pt-8 pb-12">
            <PageHeader kicker="PERFORMANCE CALENDAR" title="Daily P&L">
                <MonthNav month={month} onShift={(n) => load(shiftMonth(month, n))} />
            </PageHeader>
            <Card className={`${cardCls} flex flex-col overflow-hidden`}>
                <div className="flex items-center justify-between gap-4 border-b border-border-faint px-[22px] py-4">
                    <div className="flex items-center gap-5 font-mono text-ui-xs text-content-faint">
                        <span>
                            TRADING DAYS&nbsp;
                            <strong className="font-semibold text-secondary-foreground">{tradingDays}</strong>
                        </span>
                        <span>
                            TOTAL TRADES&nbsp;
                            <strong className="font-semibold text-secondary-foreground">{totalTrades}</strong>
                        </span>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-ui-xs text-content-faint">
                        <span className="flex items-center gap-1.5">
                            <i className="size-2 rounded-sm bg-profit" aria-hidden="true" />
                            PROFIT
                        </span>
                        <span className="flex items-center gap-1.5">
                            <i className="size-2 rounded-sm bg-loss" aria-hidden="true" />
                            LOSS
                        </span>
                    </div>
                </div>
                <div className="px-2 py-3">
                    <CalendarChart days={days} loading={loading} month={month} />
                </div>
                <div className="flex items-center justify-between px-[22px] py-3">
                    <span className="font-mono text-ui-xs text-loss">
                        {error ?? ''}
                    </span>
                    <span className="font-mono text-ui-sm text-content-faint">
                        MONTH NET&nbsp;
                        <strong className="font-semibold" style={{ color: monthNet >= 0 ? G : R }}>
                            {signedMoney(monthNet)}
                        </strong>
                    </span>
                </div>
            </Card>
        </div>
    );
}
