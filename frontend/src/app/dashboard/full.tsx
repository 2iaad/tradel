'use client';

import { ctaCls } from '@/lib/ui';
import { EquityCard } from './equity-card';
import { NotesList } from './notes-list';
import { PageHeader } from './page-header';
import { useSessionStore } from '@/stores/session';
import { StatCards } from './stat-cards';
import { TradesTable } from './trades-table';

// Time-of-day greeting for the signed-in header.
function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

// Signed-in dashboard: stats, equity curve, recent trades, and notes.
export function FullDashboard() {
    const session = useSessionStore((s) => s.session);
    const name = session.status === 'user' ? session.email.split('@')[0] : 'trader';

    return (
        <div className="w-full max-w-[1240px] box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader kicker="/// DASHBOARD" title={`${greeting()}, ${name}`}>
                <button type="button" className={ctaCls}>
                    + Log trade
                </button>
            </PageHeader>
            <StatCards />
            {/* <EquityCard /> */}
            <div className="grid grid-cols-[1.9fr_1fr] gap-4 items-start">
                <TradesTable />
                <NotesList />
            </div>
        </div>
    );
}
