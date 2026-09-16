'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';

import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { errorCls } from '@/lib/ui';
import { useAccountStore } from '@/stores/accounts';
import { hasDashboardSession, useSessionStore } from '@/stores/session';
import { Sidebar } from './sidebar';

// Dashboard shell: sidebar + tape, gated on the restored session.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = useSessionStore((s) => s.session);
    const restore = useSessionStore((s) => s.restore);
    const loadAccounts = useAccountStore((s) => s.load);
    const accountsLoading = useAccountStore((s) => s.loading);
    const accountsError = useAccountStore((s) => s.loadError);
    const router = useRouter();
    const pathname = usePathname();
    const restoring = useSessionStore((state) => state.restoring);
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
        let active = true;

        restore()
            .then(() => {
                if (active && hasDashboardSession(useSessionStore.getState().session)) {
                    return loadAccounts();
                }
            })
            .catch(() => {
                // The session store records the error; keep it visible here.
            });

        return () => {
            active = false;
        };
    }, [restore, loadAccounts]);

    const retryRestore = async () => {
        try {
            await restore();
            if (hasDashboardSession(useSessionStore.getState().session)) {
                await loadAccounts();
            }
        } catch {
            // The session store records the error for the panel below.
        }
    };

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
                {session.status === 'error' || accountsError ? (
                    <div className="flex flex-1 items-center justify-center p-6">
                        <div className="flex max-w-md flex-col items-center gap-4 text-center">
                            <h2 className="m-0 text-lg font-semibold text-card-foreground">
                                {session.status === 'error'
                                    ? "We couldn't verify your session"
                                    : "We couldn't load your accounts"}
                            </h2>
                            <p className={errorCls} role="alert">
                                {session.status === 'error' ? session.message : accountsError}
                            </p>
                            <Button
                                type="button"
                                onClick={retryRestore}
                                disabled={restoring || accountsLoading}
                            >
                                {restoring || accountsLoading ? 'Trying again…' : 'Try again'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    hasDashboardSession(session) && children
                )}
            </SidebarInset>
        </SidebarProvider>
    );
}
