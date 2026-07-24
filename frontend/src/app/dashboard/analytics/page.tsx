'use client';

import { useEffect } from 'react';

import { signedMoney } from '@/lib/format';
import { cardCls, G, h2Cls, R } from '@/lib/ui';
import { useAnalyticsStore } from '@/stores/analytics';
import type { BreakdownEntry, Summary } from '@/stores/analytics';
import { EquityCard } from '../equity-card';
import { PageHeader } from '../page-header';

const pct = (v: number | null) => (v === null ? '—' : `${(v * 100).toFixed(1)}%`);
const ratio = (v: number | null) => (v === null ? '—' : v.toFixed(2));
const rr = (v: number | null) => (v === null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(2)}R`);

// Headline metrics as {label, value, color, sub} tiles.
function tiles(s: Summary) {
    return [
        { label: 'NET P&L', value: s.closed ? signedMoney(s.net) : '—', col: s.net >= 0 ? G : R, sub: `${s.closed} CLOSED` },
        { label: 'WIN RATE', value: pct(s.winRate), col: '#eef4f2', sub: `${s.wins}W · ${s.losses}L` },
        { label: 'PROFIT FACTOR', value: ratio(s.profitFactor), col: '#eef4f2', sub: 'GROSS PROFIT / LOSS' },
        { label: 'EXPECTANCY', value: s.expectancy === null ? '—' : signedMoney(s.expectancy), col: (s.expectancy ?? 0) >= 0 ? G : R, sub: 'AVG P&L / TRADE' },
        { label: 'AVG R', value: rr(s.avgR), col: (s.avgR ?? 0) >= 0 ? G : R, sub: 'MEAN R MULTIPLE' },
        { label: 'OPEN', value: String(s.open), col: '#eef4f2', sub: 'TRADES RUNNING' },
    ];
}

// Six summary stat cards across the top.
function StatGrid({ summary }: { summary: Summary }) {
    return (
        <div className="grid grid-cols-3 gap-4">
            {tiles(summary).map((t) => (
                <div key={t.label} className={`${cardCls} px-5 py-[18px] flex flex-col gap-2`}>
                    <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]">
                        {t.label}
                    </span>
                    <span className="text-[26px] font-semibold tracking-[-0.01em]" style={{ color: t.col }}>
                        {t.value}
                    </span>
                    <span className="font-mono text-[11px] font-medium text-[#5f6b70]">{t.sub}</span>
                </div>
            ))}
        </div>
    );
}

// One row of the breakdown bar chart: label, proportional bar, net P&L.
function BreakdownRow({ row, max }: { row: BreakdownEntry; max: number }) {
    const w = max > 0 ? (Math.abs(row.net) / max) * 100 : 0;
    const pos = row.net >= 0;
    return (
        <div className="flex items-center gap-3">
            <span className="w-20 shrink-0 truncate text-[13px] text-[#c8d2d0]">{row.label}</span>
            <div className="flex-1 h-2 rounded-full bg-[#0a0d0f] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${w}%`, background: pos ? G : R }} />
            </div>
            <span className="w-24 shrink-0 text-right font-mono text-[12px]" style={{ color: pos ? G : R }}>
                {signedMoney(row.net)}
            </span>
            <span className="w-16 shrink-0 text-right font-mono text-[11px] text-[#5f6b70]">
                {pct(row.winRate)}
            </span>
        </div>
    );
}

// A breakdown card (P&L by symbol or side).
function BreakdownCard({ title, rows }: { title: string; rows: BreakdownEntry[] }) {
    const max = Math.max(0, ...rows.map((r) => Math.abs(r.net)));
    return (
        <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
            <h2 className={h2Cls}>{title}</h2>
            {rows.length === 0 ? (
                <p className="font-mono text-[11px] tracking-[0.12em] text-[#5f6b70] py-2">NO CLOSED TRADES</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {rows.map((r) => (
                        <BreakdownRow key={r.label} row={r} max={max} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AnalyticsPage() {
    const summary = useAnalyticsStore((s) => s.summary);
    const bySymbol = useAnalyticsStore((s) => s.bySymbol);
    const bySide = useAnalyticsStore((s) => s.bySide);
    const loading = useAnalyticsStore((s) => s.loading);
    const load = useAnalyticsStore((s) => s.load);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="w-full max-w-[1240px] box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader kicker="ANALYTICS" title="Performance" />
            {loading && !summary ? (
                <p className="font-mono text-[13px] tracking-[0.22em] text-[#7e8d89] py-10 text-center">
                    {'/// LOADING'}
                </p>
            ) : (
                <>
                    {summary && <StatGrid summary={summary} />}
                    <EquityCard />
                    <div className="grid grid-cols-2 gap-4 items-start">
                        <BreakdownCard title="P&L by symbol" rows={bySymbol} />
                        <BreakdownCard title="P&L by side" rows={bySide} />
                    </div>
                </>
            )}
        </div>
    );
}
