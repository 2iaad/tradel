'use client';

import { useState } from 'react';

import { ctaCls } from '@/lib/ui';
import { CreateAccountModal } from './create-account-modal';
import { EmptyLedger } from './empty-ledger';
import { EmptyStats } from './empty-stats';
import { GhostEquityCard } from './ghost-equity-card';
import { PageHeader } from './page-header';
import { StepsGrid } from './steps-grid';

// Guest dashboard: onboarding steps and empty previews behind a signup CTA.
export function GuestDashboard() {
    const [modal, setModal] = useState(false);
    const open = () => setModal(true);

    return (
        <div className="w-full max-w-[1240px] box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader kicker="/// DASHBOARD · GUEST PREVIEW" title="Welcome to Tradel">
                <button type="button" onClick={open} className={ctaCls}>
                    Create free account
                </button>
            </PageHeader>
            <StepsGrid onStart={open} />
            <EmptyStats />
            <GhostEquityCard onStart={open} />
            <EmptyLedger onLog={open} />
            {modal && <CreateAccountModal onClose={() => setModal(false)} />}
        </div>
    );
}
