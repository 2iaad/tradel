'use client';

import { EquityCard } from './equity-card';
import { StatCards, useTradeStats } from './trade-stats';
import { TradesTable } from './trades-table';
import { useDashboardData } from './use-dashboard-data';

export default function DashboardPage() {
    const { recent, loading } = useDashboardData();
    const stats = useTradeStats();

    return (
        <div className="flex min-w-0 flex-1 flex-col">
            <div className="grid gap-4 px-3 py-4 sm:px-4 md:gap-6 md:py-6 lg:px-6">
                <StatCards s={stats} />
                <EquityCard />
                <TradesTable rows={recent} loading={loading} />
            </div>
        </div>
    );
}
