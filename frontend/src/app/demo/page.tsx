'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAccountStore } from '@/stores/accounts';
import { useSessionStore } from '@/stores/session';

export default function DemoPage() {
    const router = useRouter();
    const startDemo = useSessionStore((state) => state.startDemo);
    const loadAccounts = useAccountStore((state) => state.load);

    useEffect(() => {
        startDemo();
        loadAccounts().then(() => router.replace('/dashboard'));
    }, [loadAccounts, router, startDemo]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-background">
            <span className="font-mono text-ui-xs font-medium tracking-[0.16em] text-content-faint">
                PREPARING LIVE DEMO...
            </span>
        </main>
    );
}
