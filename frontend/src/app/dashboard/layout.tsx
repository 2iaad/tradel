'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';

import { Tape, TOP_TICKS } from '@/components/tape';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
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
        <SidebarProvider
            className="min-h-screen bg-background"
            style={{ '--sidebar-width': '14.5rem' } as CSSProperties}
        >
            <Sidebar />
            <SidebarInset className="min-w-0 bg-background">
                <Tape
                    items={TOP_TICKS}
                    duration="46s"
                    className="h-10 border-b border-border-subtle flex-none"
                />
                {status === 'user' && children}
            </SidebarInset>
        </SidebarProvider>
    );
}
