'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Tape, TOP_TICKS } from '@/components/tape';
import { useAccountStore } from '@/stores/accounts';
import { useSessionStore } from '@/stores/session';
import { Sidebar } from './sidebar';

// Dashboard shell: sidebar + tape, gated on the restored session.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const status = useSessionStore((s) => s.session.status);
    const restore = useSessionStore((s) => s.restore);
    const loadAccounts = useAccountStore((s) => s.load);
    const router = useRouter();

    // Restore the session, then load accounts (which sets the active account
    // and cascades into the trades/notes stores via their subscriptions).
    useEffect(() => {
        restore().then(loadAccounts);
    }, [restore, loadAccounts]);

    // No guest dashboard — send unauthenticated visitors to sign in.
    useEffect(() => {
        if (status === 'anon') router.replace('/login');
    }, [status, router]);

    return (
        <div className="flex min-h-screen bg-[#0b0e10]">
            <Sidebar />
            <main className="flex-1 min-w-0 flex flex-col">
                <Tape
                    items={TOP_TICKS}
                    duration="46s"
                    className="h-10 border-b border-[#1b2226] flex-none"
                />
                {status === 'user' && children}
            </main>
        </div>
    );
}
