'use client';

import { useEffect } from 'react';

import { Tape, TOP_TICKS } from '@/components/tape';
import { useSessionStore } from '@/stores/session';
import { Sidebar } from './sidebar';

// Dashboard shell: sidebar + tape, gated on the restored session.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const status = useSessionStore((s) => s.session.status);
    const restore = useSessionStore((s) => s.restore);

    useEffect(() => {
        restore();
    }, [restore]);

    return (
        <div className="flex min-h-screen bg-[#0b0e10]">
            <Sidebar />
            <main className="flex-1 min-w-0 flex flex-col">
                <Tape
                    items={TOP_TICKS}
                    duration="46s"
                    className="h-10 border-b border-[#1b2226] flex-none"
                />
                {status !== 'checking' && children}
            </main>
        </div>
    );
}
