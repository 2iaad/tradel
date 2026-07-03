'use client';

import { Tape, TOP_TICKS } from '@/components/tape';
import { SessionContext } from './session';
import { Sidebar } from './sidebar';
import { useRestoredSession } from './use-restored-session';

// Dashboard shell: sidebar + tape, gated on the restored session.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = useRestoredSession();

    return (
        <SessionContext.Provider value={session}>
            <div className="flex min-h-screen bg-[#0b0e10]">
                <Sidebar />
                <main className="flex-1 min-w-0 flex flex-col">
                    <Tape
                        items={TOP_TICKS}
                        duration="46s"
                        className="h-10 border-b border-[#1b2226] flex-none"
                    />
                    {session.status !== 'checking' && children}
                </main>
            </div>
        </SessionContext.Provider>
    );
}
