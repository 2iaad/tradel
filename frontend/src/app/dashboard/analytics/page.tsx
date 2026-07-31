'use client';

import { useEffect } from 'react';

import { useAnalyticsStore } from '@/stores/analytics';
import { useAccountStore } from '@/stores/accounts';
import { useTradesStore } from '@/stores/trades';
import { EquityCard } from '../equity-card';
import { PageHeader } from '../page-header';
import { SymbolAnalyticsGrid } from '../symbol-analytics';
import { StatCards, useTradeStats } from '../trade-stats';

export default function AnalyticsPage() {
    const summary = useAnalyticsStore((s) => s.summary);
    const bySymbol = useAnalyticsStore((s) => s.bySymbol);
    const loading = useAnalyticsStore((s) => s.loading);
    const load = useAnalyticsStore((s) => s.load);
    const loadTrades = useTradesStore((s) => s.load);
    const accounts = useAccountStore((s) => s.accounts);
    const activeId = useAccountStore((s) => s.activeId);
    const stats = useTradeStats();
    const currency = accounts.find((account) => account.id === activeId)?.currency ?? 'USD';

    useEffect(() => {
        load();
        loadTrades(); // headline cards compute from the trade log
    }, [load, loadTrades]);

    return (
        <div className="w-full max-w-11/12 box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader kicker="" title="Performance" />
            {loading && !summary ? (
                <p className="font-mono text-ui-sm tracking-[0.22em] text-content-soft py-10 text-center">
                    {'/// LOADING'}
                </p>
            ) : (
                <>
                    <StatCards s={stats} />
                    <EquityCard />
                    <SymbolAnalyticsGrid rows={bySymbol} currency={currency} />
                </>
            )}
        </div>
    );
}
