'use client';

import { useEffect } from 'react';

import { useAnalyticsStore } from './store';
import { useAccountStore } from '@/features/accounts/store';
import { useTradesStore } from '@/features/trades/store';
import { EquityCard } from '@/features/dashboard/components/equity-card';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { SymbolAnalyticsGrid } from '@/features/analytics/components/symbol-analytics';
import { StatCards, useTradeStats } from '@/features/dashboard/components/trade-stats';

export default function AnalyticsPage() {
    const summary = useAnalyticsStore((s) => s.summary);
    const bySymbol = useAnalyticsStore((s) => s.bySymbol);
    const loading = useAnalyticsStore((s) => s.loading);
    const loadError = useAnalyticsStore((s) => s.loadError);
    const stale = useAnalyticsStore((s) => s.stale);
    const load = useAnalyticsStore((s) => s.load);
    const loadTrades = useTradesStore((s) => s.load);
    const accounts = useAccountStore((s) => s.accounts);
    const activeId = useAccountStore((s) => s.activeId);
    const stats = useTradeStats();
    const currency = accounts.find((account) => account.id === activeId)?.currency ?? 'USD';

    useEffect(() => {
        void loadTrades();
    }, [loadTrades]);

    useEffect(() => {
        void load();
    }, [activeId, load, stale]);

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <div className="px-4 lg:px-6">
                        <PageHeader kicker="" title="Performance" />
                    </div>
                    {loadError && (
                        <p role="alert" className="px-4 font-mono text-ui-sm text-loss lg:px-6">
                            {loadError}
                        </p>
                    )}
                    {loading && !summary ? (
                        <p className="px-4 py-10 text-center font-mono text-ui-sm tracking-[0.22em] text-content-soft lg:px-6">
                            {'/// LOADING'}
                        </p>
                    ) : (
                        <>
                            <StatCards s={stats} />
                            <div className="px-4 lg:px-6">
                                <EquityCard />
                            </div>
                            <div className="px-4 lg:px-6">
                                <SymbolAnalyticsGrid rows={bySymbol} currency={currency} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
