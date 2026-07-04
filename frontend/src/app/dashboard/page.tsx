'use client';

import { FullDashboard } from './full';
import { GuestDashboard } from './guest';
import { useSessionStore } from '@/stores/session';

export default function DashboardPage() {
    const session = useSessionStore((s) => s.session);
    return session.status === 'user' ? <FullDashboard /> : <GuestDashboard />;
}
