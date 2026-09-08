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
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <div className="px-4 lg:px-6">
                        <PageHeader kicker="" title="Performance" />
                    </div>
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
