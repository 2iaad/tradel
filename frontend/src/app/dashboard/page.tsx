'use client';

import Link from 'next/link';

import { cardCls, ctaCls, ghostBtnCls, h2Cls } from '@/lib/ui';
import { useNotesStore } from '@/stores/notes';
import { useSessionStore } from '@/stores/session';
import { EquityCard } from './equity-card';
import { PageHeader } from './page-header';
import { TradesTable } from './trades-table';
import { Stat, useDashboardData } from './use-dashboard-data';

// Time-of-day greeting for the signed-in header.
function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

// Four stat cards across the top of the signed-in dashboard.
function StatCards({ stats }: { stats: Stat[] }) {
    return (
        <div className="grid grid-cols-4 gap-4">
            {stats.map((s) => (
                <div
                    key={s.label}
                    className={`${cardCls} px-5 py-[18px] flex flex-col gap-2 transition-[border-color] duration-200 hover:border-[#2fd57f44]`}
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

// Notes card for the signed-in dashboard, backed by the notes API.
function NotesList() {
    const notes = useNotesStore((s) => s.notes);
    const loading = useNotesStore((s) => s.loading);

    return (
        <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
                <h2 className={h2Cls}>Notes</h2>
                <button type="button" className={ghostBtnCls}>
                    + NEW
                </button>
            </div>
            {notes.length === 0 ? (
                <p className="font-mono text-[11px] tracking-[0.12em] text-[#5f6b70] py-2">
                    {loading ? 'LOADING…' : 'NO NOTES YET'}
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {notes.map((n) => (
                        <li key={n.id} className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-medium text-[#e9eef0] truncate">
                                {n.title}
                            </span>
                            <span className="text-[12px] text-[#7e8d89] line-clamp-2">
                                {n.body}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Signed-in dashboard: real stats, recent trades, and notes from the trades API.
function FullDashboard() {
    const session = useSessionStore((s) => s.session);
    const name = session.status === 'user' ? session.email.split('@')[0] : 'trader';
    const { stats, recent, loading } = useDashboardData();

    return (
        <div className="w-full max-w-[1240px] box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader kicker="" title={`${greeting()}, ${name}`}>
                <Link href="/dashboard/trades" className={ctaCls}>
                    + Log trade
                </Link>
            </PageHeader>
            <StatCards stats={stats} />
            <EquityCard />
            <div className="grid grid-cols-[1.9fr_1fr] gap-4 items-start">
                <TradesTable rows={recent} loading={loading} />
                <NotesList />
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return <FullDashboard />;
}
