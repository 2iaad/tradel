'use client';

import { ctaCls, G, R } from '@/lib/ui';
import { PageHeader } from '../page-header';
import { StatCards, useTradeStats } from '../trade-stats';
import { TradeLogTable } from './trade-log-table';
import { useTradeLog } from './use-trade-log';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type Log = ReturnType<typeof useTradeLog>;

const SIDES = ['ALL', 'LONG', 'SHORT'] as const;
const OUTCOMES = ['ALL', 'WINS', 'LOSSES'] as const;

// Segmented pill toggle; the active option fills green.
function SegmentedTabs<T extends string>({
    options,
    active,
    onChange,
}: {
    options: readonly T[];
    active: T;
    onChange: (value: T) => void;
}) {
    return (
        <div className="flex gap-1 bg-muted border border-border-subtle rounded-lg p-[3px]">
            {options.map((opt) => {
                const on = opt === active;
                return (
                    <Button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        variant={on ? 'default' : 'ghost'}
                        size="sm"
                        className={`h-auto rounded-md px-[13px] py-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] ${on ? 'bg-primary text-primary-foreground hover:bg-primary-hover' : 'bg-transparent text-content-faint hover:bg-accent hover:text-secondary-foreground'}`}
                    >
                        {opt}
                    </Button>
                );
            })}
        </div>
    );
}

// Search box + side/outcome segmented filters + the date-range stamp.
function FilterToolbar({ log }: { log: Log }) {
    return (
        <div className="flex items-center gap-3 flex-wrap">
            <Input
                value={log.q}
                onChange={(e) => log.setQ(e.target.value)}
                placeholder="Search symbol or setup…"
                className="h-auto flex-1 min-w-[200px] max-w-[300px] box-border bg-muted border-border-subtle px-3.5 py-2.5 font-mono text-[12.5px] text-content placeholder:text-content-placeholder"
            />
            <SegmentedTabs options={SIDES} active={log.side} onChange={log.setSide} />
            <SegmentedTabs options={OUTCOMES} active={log.outcome} onChange={log.setOutcome} />
        </div>
    );
}

// One label+value pill in the quick-stats strip.
function Chip({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 bg-muted border border-border-subtle rounded-full px-3.5 py-1.5 font-mono text-[11px] font-medium tracking-[0.04em] text-muted-foreground">
            {label && <span>{label}</span>}
            <span style={{ color: color ?? 'var(--secondary-foreground)' }}>{value}</span>
        </span>
    );
}

// Quick-stats pill strip under the cards.
function ChipStrip({ s }: { s: Log['summary'] }) {
    return (
        <Card className="flex flex-row items-center gap-2 border-0 bg-transparent py-0.5 ring-0">
            <Chip label="" value={`${s.count} trades`} color={G} />
            <Chip label="Avg win" value={s.avgWin} color={G} />
            <Chip label="Avg loss" value={s.avgLoss} color={R} />
            <Chip label="PF" value={s.pf} />
            <Chip
                label="Streak"
                value={s.streak}
                color={s.streak === '—' ? undefined : s.streakWin ? G : R}
            />
            <Chip label="This month" value={s.monthNet} color={s.monthPos ? G : R} />
        </Card>
    );
}

// Trades route: filterable, sortable trade log backed by the trades API.
export default function TradesPage() {
    const log = useTradeLog();
    const stats = useTradeStats();
    return (
        <div className="w-full max-w-11/12 box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader kicker="" title="Trade log">
                <Button
                    type="button"
                    onClick={() => log.startEdit('new')}
                    className={`${ctaCls} h-auto whitespace-nowrap`}
                >
                    + Log trade
                </Button>
            </PageHeader>
            <StatCards s={stats} />
            <ChipStrip s={log.summary} />
            <FilterToolbar log={log} />
            <TradeLogTable log={log} dense={false} />
        </div>
    );
}
