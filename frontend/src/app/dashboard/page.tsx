'use client';

import { useMemo, type ReactNode } from 'react';
import { BarChart3, DollarSign, Flame, Target } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cardCls, ghostBtnCls, h2Cls } from '@/lib/ui';
import { useNotesStore } from '@/stores/notes';
import { useSessionStore } from '@/stores/session';
import type { ApiTrade } from '@/stores/trades';
import { EquityCard } from './equity-card';
import { PageHeader } from './page-header';
import type { TradeStats } from './trade-stats';
import { StatCards, useTradeStats } from './trade-stats';
import { TradesTable } from './trades-table';
import { useDashboardData } from './use-dashboard-data';

// Time-of-day greeting for the signed-in header.
function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

function dayKey(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

function loggingStreak(trades: ApiTrade[]) {
    if (!trades.length) return 0;

    const days = new Set(trades.map((trade) => dayKey(new Date(trade.created_at))));
    const latest = new Date(
        trades.reduce((max, trade) => Math.max(max, new Date(trade.created_at).getTime()), 0),
    );
    latest.setHours(0, 0, 0, 0);

    let streak = 0;
    while (days.has(dayKey(latest))) {
        streak += 1;
        latest.setDate(latest.getDate() - 1);
    }

    return streak;
}

function HeaderBadge({
    icon,
    label,
    value,
    tone = 'primary',
}: {
    icon: ReactNode;
    label: string;
    value?: string;
    tone?: 'primary' | 'profit' | 'loss';
}) {
    const valueClass = {
        primary: 'text-primary',
        profit: 'text-profit',
        loss: 'text-loss',
    }[tone];

    return (
        <Badge
            variant="outline"
            className="h-auto justify-start rounded-full px-3.5 py-2 font-mono text-ui-xs font-medium tracking-[0.04em] text-muted-foreground"
        >
            <span className="-translate-y-px mr-0.5 text-content-faint">{icon}</span>
            <span className={`whitespace-nowrap ${value ? '' : valueClass}`}>{label}</span>
            {value && <span className={`whitespace-nowrap ${valueClass}`}>{value}</span>}
        </Badge>
    );
}

function HeaderBadges({ stats, streak }: { stats: TradeStats; streak: number }) {
    const winRate = stats.winPctV === null ? '—' : `${Math.round(stats.winPctV)}%`;

    return (
        <>
            <HeaderBadge
                icon={<BarChart3 aria-hidden="true" className="size-3" />}
                label={`${stats.count} trades`}
            />
            <HeaderBadge
                icon={<Flame aria-hidden="true" className="size-3" />}
                label={`${streak}-day logging streak`}
            />
            <HeaderBadge
                icon={<DollarSign aria-hidden="true" className="size-3" />}
                label={`${stats.net} P&L`}
                tone={stats.netV >= 0 ? 'profit' : 'loss'}
            />
            <HeaderBadge
                icon={<Target aria-hidden="true" className="size-3" />}
                label={`${winRate} win rate`}
                tone="profit"
            />
        </>
    );
}

// Notes card for the signed-in dashboard, backed by the notes API.
function NotesList() {
    const notes = useNotesStore((s) => s.notes);
    const loading = useNotesStore((s) => s.loading);

    return (
        <Card className={`${cardCls} px-[22px] py-5 flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
                <h2 className={h2Cls}>Notes</h2>
                <Button type="button" variant="ghost" size="sm" className={`${ghostBtnCls} h-auto px-0 hover:bg-transparent`}>
                    + NEW
                </Button>
            </div>
            {notes.length === 0 ? (
                <p className="font-mono text-ui-xs tracking-[0.12em] text-content-faint py-2">
                    {loading ? 'LOADING…' : 'NO NOTES YET'}
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {notes.map((n) => (
                        <li key={n.id} className="flex flex-col gap-0.5">
                            <span className="text-ui-sm font-medium text-content truncate">
                                {n.title}
                            </span>
                            <span className="text-ui-sm text-content-soft line-clamp-2">
                                {n.body}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

export default function DashboardPage() {
    const session = useSessionStore((s) => s.session);
    const name =
        session.status === 'demo'
            ? 'Demo'
            : session.status === 'user'
              ? session.email.split('@')[0]
              : 'trader';
    const { recent, loading, trades } = useDashboardData();
    const stats = useTradeStats();
    const streak = useMemo(() => loggingStreak(trades), [trades]);

    return (
        <div className="w-full max-w-11/12 box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader
                kicker=""
                title={`${greeting()}, ${name}`}
                summary={<HeaderBadges stats={stats} streak={streak} />}
            />
            <StatCards s={stats} />
            <EquityCard />
            <div className="grid grid-cols-[1.9fr_1fr] gap-4 items-start">
                <TradesTable rows={recent} loading={loading} />
                <NotesList />
            </div>
        </div>
    );
}
