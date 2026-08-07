'use client';

import { EquityCard } from './equity-card';
import { StatCards, useTradeStats } from './trade-stats';
import { TradesTable } from './trades-table';
import { useDashboardData } from './use-dashboard-data';

export default function DashboardPage() {
    const { recent, loading } = useDashboardData();
    const stats = useTradeStats();

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <StatCards s={stats} />
                    <div className="px-4 lg:px-6">
                        <EquityCard />
                    </div>
                    <div className="px-4 lg:px-6">
                        <TradesTable rows={recent} loading={loading} />
                    </div>
                </div>
            </div>
        </div>
    );
}
