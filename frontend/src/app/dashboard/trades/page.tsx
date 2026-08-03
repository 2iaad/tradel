'use client';

import { G, R } from '@/lib/ui';
import { PageHeader } from '../page-header';
import { StatCards, useTradeStats } from '../trade-stats';
import { TradeLogTable } from './trade-log-table';
import { useTradeLog } from './use-trade-log';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, CalendarDays, Flame, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

type Log = ReturnType<typeof useTradeLog>;

// Search filters whichever table view is currently active.
function FilterToolbar({ log }: { log: Log }) {
    return (
        <div className="flex items-center gap-3 flex-wrap">
            <Input
                value={log.q}
                onChange={(e) => log.setQ(e.target.value)}
                placeholder="Search symbol or setup…"
                className="h-auto flex-1 min-w-[200px] max-w-[300px] box-border bg-muted border-border-subtle px-3.5 py-2.5 font-mono text-ui-sm text-content placeholder:text-content-placeholder"
            />
        </div>
    );
}

function Chip({
    label,
    value,
    color,
    icon,
}: {
    label: string;
    value: string;
    color?: string;
    icon: ReactNode;
}) {
    return (
        <Badge
            variant="outline"
            className="h-auto justify-start rounded-full px-3.5 py-2 font-mono text-ui-xs font-medium tracking-[0.04em] text-muted-foreground"
        >
                <span className="-translate-y-px mr-0.5">{icon}</span>
                {label && <span className="">{label}</span>}
                <span style={{ color: color ?? 'var(--secondary-foreground)' }}>{value}</span>
        </Badge>
    );
}

function ChipStrip({ s }: { s: Log['summary'] }) {
    return (
        <Card className="flex flex-row items-center gap-2 border-0 bg-transparent py-0.5 ring-0">
            <Chip
                icon={<BarChart3 aria-hidden="true" className="size-3" />}
                label=""
                value={`${s.count} trades`}
            />
            <Chip
                icon={<TrendingUp aria-hidden="true" className="size-3" />}
                label="Avg win"
                value={s.avgWin}
                color={G}
            />
            <Chip
                icon={<TrendingDown aria-hidden="true" className="size-3" />}
                label="Avg loss"
                value={s.avgLoss}
                color={R}
            />
            <Chip
                icon={<Scale aria-hidden="true" className="size-3" />}
                label="PF"
                value={s.pf}
            />
            <Chip
                icon={<Flame aria-hidden="true" className="size-3" />}
                label="Streak"
                value={s.streak}
                color={s.streak === '—' ? undefined : s.streakWin ? G : R}
            />
            <Chip
                icon={<CalendarDays aria-hidden="true" className="size-3.5" />}
                label="This month"
                value={s.monthNet}
                color={s.monthPos ? G : R}
            />
        </Card>
    );
}

// Trades route: filterable, sortable trade log backed by the trades API.
export default function TradesPage() {
    const log = useTradeLog();
    const stats = useTradeStats();
    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <div className="px-4 lg:px-6">
                        <PageHeader kicker="" title="Trade log" />
                    </div>
                    <StatCards s={stats} />
                    <div className="flex flex-col gap-5 px-4 lg:px-6">
                        <ChipStrip s={log.summary} />
                        <FilterToolbar log={log} />
                        <TradeLogTable log={log} dense={false} />
                    </div>
                </div>
            </div>
        </div>
    );
}
