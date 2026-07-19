'use client';

import { useState } from 'react';
import Link from 'next/link';

import { cardCls, ctaCls, ghostBtnCls, h2Cls } from '@/lib/ui';
import { useSessionStore } from '@/stores/session';
import { CreateAccountModal } from './create-account-modal';
import { EquityCard, GhostEquityCard } from './equity-card';
import { PageHeader } from './page-header';
import { TradesTable } from './trades-table';
import { Stat, useDashboardData } from './use-dashboard-data';

// ---------------------------------------------------------------- signed-in

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

// Notes card for the signed-in dashboard.
// ponytail: notes have no backend yet — renders the empty state until it does.
function NotesList() {
    return (
        <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
                <h2 className={h2Cls}>Notes</h2>
                <button type="button" className={ghostBtnCls}>
                    + NEW
                </button>
            </div>
            <div className="border border-dashed border-[#1b2226] rounded-lg px-4 py-8 text-center font-mono text-[11px] tracking-[0.12em] text-[#5f6b70]">
                {'/// NO NOTES YET'}
            </div>
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

// ---------------------------------------------------------------- guest

// Guest-preview onboarding steps.
const STEPS = [
    { num: '01', title: 'Create your account', desc: 'Free. Takes under a minute.' },
    { num: '02', title: 'Log your first trade', desc: 'Entry, exit, size — and why you took it.' },
    {
        num: '03',
        title: 'Review your stats',
        desc: 'Win rate, R multiples, and your equity curve.',
    },
];

// Guest-preview placeholder stat cards.
const EMPTY_STATS = [
    { label: 'NET P&L', sub: 'AWAITING FIRST TRADE' },
    { label: 'WIN RATE', sub: 'AWAITING FIRST TRADE' },
    { label: 'PROFIT FACTOR', sub: 'AWAITING FIRST TRADE' },
];

type Step = (typeof STEPS)[number];

const accent = (a: boolean) => (a ? 'text-[#2fd57f]' : 'text-[#5f6b70]');

// Step number + START/LOCKED tag row.
function StepTop({ num, active }: { num: string; active: boolean }) {
    return (
        <span className="flex items-center justify-between">
            <span
                className={`font-mono text-[11px] font-semibold tracking-[0.14em] ${accent(active)}`}
            >
                {num}
            </span>
            <span
                className={`font-mono text-[9.5px] font-semibold tracking-[0.1em] ${accent(active)}`}
            >
                {active ? 'START →' : 'LOCKED'}
            </span>
        </span>
    );
}

const stepCls = (active: boolean) =>
    `text-left bg-[#0e1214] border rounded-[10px] px-5 py-[18px] flex flex-col gap-2 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 ${
        active ? 'border-[#2fd57f] cursor-pointer' : 'border-[#1b2226] opacity-55 cursor-default'
    }`;

// One onboarding step; only the active one is clickable.
function StepCard({ s, active, onStart }: { s: Step; active: boolean; onStart: () => void }) {
    return (
        <button type="button" onClick={active ? onStart : undefined} className={stepCls(active)}>
            <StepTop num={s.num} active={active} />
            <span
                className={`text-base font-semibold ${active ? 'text-[#eef4f2]' : 'text-[#93a09d]'}`}
            >
                {s.title}
            </span>
            <span className="text-[12.5px] leading-normal text-[#7e8d89]">{s.desc}</span>
        </button>
    );
}

// Guest onboarding checklist — step 01 active, rest locked.
function StepsGrid({ onStart }: { onStart: () => void }) {
    return (
        <div className="grid grid-cols-3 gap-4">
            {STEPS.map((s, i) => (
                <StepCard key={s.num} s={s} active={i === 0} onStart={onStart} />
            ))}
        </div>
    );
}

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
function EmptyStats() {
    return (
        <div className="grid grid-cols-4 gap-4">
            {EMPTY_STATS.map((s) => (
                <EmptyStatCard key={s.label} {...s} value="—" dim />
            ))}
            <EmptyStatCard label="TRADES LOGGED" value="0" sub="LOG A TRADE TO BEGIN" dim={false} />
        </div>
    );
}

const emptyBoxCls =
    'flex-1 flex flex-col items-center justify-center gap-2 border border-dashed border-[#2b343a] rounded-lg px-5 py-9';
const emptyKickerCls = 'font-mono text-[10.5px] font-medium tracking-[0.2em] text-[#5f6b70]';

// Dashed empty-state card with a kicker, blurb, and optional action.
function EmptyCard({
    title,
    kicker,
    text,
    maxW,
    children,
}: {
    title: string;
    kicker: string;
    text: string;
    maxW: string;
    children?: React.ReactNode;
}) {
    return (
        <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
            <h2 className={h2Cls}>{title}</h2>
            <div className={emptyBoxCls}>
                <span className={emptyKickerCls}>{kicker}</span>
                <span className={`text-[13.5px] text-[#7e8d89] text-center ${maxW}`}>{text}</span>
                {children}
            </div>
        </div>
    );
}

// Guest placeholders for the recent-trades and notes cards.
function EmptyLedger({ onLog }: { onLog: () => void }) {
    return (
        <div className="grid grid-cols-[1.9fr_1fr] gap-4 items-stretch">
            <EmptyCard
                title="Recent trades"
                kicker="/// EMPTY LEDGER"
                text="Every trade you log lands here — entry, exit, size, and R."
                maxW="max-w-[300px]"
            >
                <button
                    type="button"
                    onClick={onLog}
                    className="mt-1.5 bg-transparent border border-[rgba(47,213,127,0.3)] rounded-lg px-4 py-[9px] text-[#2fd57f] font-semibold text-[12.5px] cursor-pointer transition-colors hover:bg-[rgba(47,213,127,0.08)] hover:border-[#2fd57f]"
                >
                    + Log a trade
                </button>
            </EmptyCard>
            <EmptyCard
                title="Notes"
                kicker="/// NO NOTES"
                text="The reasoning behind each trade — the part that makes you better."
                maxW="max-w-[240px]"
            />
        </div>
    );
}

// Guest dashboard: onboarding steps and empty previews behind a signup CTA.
function GuestDashboard() {
    const [modal, setModal] = useState(false);
    const open = () => setModal(true);

    return (
        <div className="w-full max-w-[1240px] box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader kicker="" title="Welcome to Tradel">
                <button type="button" onClick={open} className={ctaCls}>
                    Create free account
                </button>
            </PageHeader>
            <StepsGrid onStart={open} />
            <EmptyStats />
            <GhostEquityCard onStart={open} />
            <EmptyLedger onLog={open} />
            {modal && <CreateAccountModal onClose={() => setModal(false)} />}
        </div>
    );
}

export default function DashboardPage() {
    const session = useSessionStore((s) => s.session);

    if (session.status === 'user') return <FullDashboard />;
    return <GuestDashboard />;
}
