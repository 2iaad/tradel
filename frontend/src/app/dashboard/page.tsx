'use client';

import { FullDashboard } from './full';
import { GuestDashboard } from './guest';
import { useSessionStore } from '@/stores/session';

export default function DashboardPage() {
    const session = useSessionStore((s) => s.session);

    if (session.status === 'user')
        return <FullDashboard />;
    return <GuestDashboard />;
}
