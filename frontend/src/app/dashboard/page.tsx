'use client';

import { FullDashboard } from './full';
import { GuestDashboard } from './guest';
import { useSession } from '@/stores/session';

export default function DashboardPage() {
    const session = useSession();
    return session.status === 'user' ? <FullDashboard /> : <GuestDashboard />;
}
