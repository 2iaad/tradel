'use client';

import { EquityCard } from '@/features/dashboard/components/equity-card';
import { StatCards, useTradeStats } from '@/features/dashboard/components/trade-stats';
import { TradesTable } from '@/features/dashboard/components/trades-table';
import { useDashboardData } from '@/features/dashboard/hooks/use-dashboard-data';

export default function DashboardPage() {
    const { recent, loading } = useDashboardData();
    const stats = useTradeStats();

    return (
        <div className="flex min-w-0 flex-1 flex-col">
            <div className="@container/main flex min-w-0 flex-1 flex-col gap-2">
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
