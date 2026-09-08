'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAccountStore } from '@/stores/accounts';
import { hasDashboardSession, useSessionStore } from '@/stores/session';
import { Sidebar } from './sidebar';

// Dashboard shell: sidebar + tape, gated on the restored session.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = useSessionStore((s) => s.session);
    const restore = useSessionStore((s) => s.restore);
    const loadAccounts = useAccountStore((s) => s.load);
    const router = useRouter();
    const pathname = usePathname();
    const title =
        {
            '/dashboard': 'Dashboard',
            '/dashboard/trades': 'Trades',
            '/dashboard/analytics': 'Analytics',
            '/dashboard/calendar': 'Calendar',
            '/dashboard/journal': 'Journal',
            '/dashboard/settings': 'Settings',
        }[pathname] ?? 'Dashboard';

    // Restore the session, then load accounts (which sets the active account
    // and cascades into the trades/notes stores via their subscriptions).
    useEffect(() => {
        restore().then(loadAccounts);
    }, [restore, loadAccounts]);

    // No guest dashboard — send unauthenticated visitors to sign in.
    useEffect(() => {
        if (session.status === 'anon') router.replace('/login');
    }, [session.status, router]);

    return (
        <SidebarProvider
            className="has-data-[variant=inset]:bg-background"
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 60)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as CSSProperties
            }
        >
            <Sidebar />
            <SidebarInset className="min-w-0 overflow-x-hidden">
                <header className="flex h-12 shrink-0 items-center border-b border-border-subtle md:h-(--header-height) md:border-b-0">
                    <div className="flex min-w-0 w-full items-center gap-2 px-3 sm:px-4 lg:px-6">
                        <SidebarTrigger className="-ml-1 size-9 md:size-8" />
                        <h1 className="truncate text-base font-medium normal-case">{title}</h1>
                    </div>
                </header>
                {hasDashboardSession(session) && children}
            </SidebarInset>
        </SidebarProvider>
    );
}
