'use client';

import { useState } from 'react';

import { cardCls, ctaCls } from '@/lib/ui';
import { useAccountStore } from '@/stores/accounts';
import type { Account } from '@/stores/accounts';
import { PageHeader } from '../page-header';
import { AccountModal, DeleteAccountModal } from '../account-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// One account row: name/broker/currency + edit / delete actions.
function AccountRow({
    account,
    active,
    onEdit,
    onDelete,
}: {
    account: Account;
    active: boolean;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const iconCls =
        'bg-transparent border-none p-0 cursor-pointer text-[13px] leading-none transition-colors';
    return (
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-border-faint first:border-t-0">
            <div className="flex flex-col gap-1 min-w-0">
                <span className="flex items-center gap-2">
                    <span className="text-[14.5px] font-medium text-content truncate">
                        {account.name}
                    </span>
                    {active && (
                        <Badge variant="outline" className="h-auto rounded px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-[0.12em] text-primary">
                            ACTIVE
                        </Badge>
                    )}
                </span>
                <span className="font-mono text-[11px] text-content-faint">
                    {account.broker || 'No broker'} · {account.currency}
                </span>
            </div>
            <span className="flex items-center gap-3">
                <Button
                    type="button"
                    onClick={onEdit}
                    title="Edit account"
                    variant="ghost"
                    size="icon-sm"
                    className={`${iconCls} text-content-faint hover:bg-transparent hover:text-primary`}
                >
                    ✎
                </Button>
                <Button
                    type="button"
                    onClick={onDelete}
                    title="Delete account"
                    variant="ghost"
                    size="icon-sm"
                    className={`${iconCls} text-content-faint hover:bg-transparent hover:text-loss`}
                >
                    ✕
                </Button>
            </span>
        </div>
    );
}

// Settings route: manage trading accounts (create / rename / delete).
export default function SettingsPage() {
    const accounts = useAccountStore((s) => s.accounts);
    const activeId = useAccountStore((s) => s.activeId);
    const loading = useAccountStore((s) => s.loading);

    // null = closed; 'new' = create; Account = edit that account.
    const [editing, setEditing] = useState<Account | 'new' | null>(null);
    const [deleting, setDeleting] = useState<Account | null>(null);

    return (
        <div className="w-full max-w-[820px] box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader kicker="SETTINGS" title="Accounts">
                <Button
                    type="button"
                    onClick={() => setEditing('new')}
                    className={`${ctaCls} h-auto whitespace-nowrap`}
                >
                    + Add account
                </Button>
            </PageHeader>

            {loading ? (
                <p className="font-mono text-[12px] tracking-[0.14em] text-content-faint px-1">
                    LOADING ACCOUNTS…
                </p>
            ) : accounts.length === 0 ? (
                <Card className={`${cardCls} flex flex-col items-center gap-4 py-16 px-6`}>
                    <span className="font-mono text-[11px] font-medium tracking-[0.16em] text-content-faint">
                        NO ACCOUNTS YET
                    </span>
                    <p className="m-0 text-[13px] text-content-dim text-center max-w-[360px]">
                        Create your first trading account to start logging trades and notes.
                    </p>
                    <Button type="button" onClick={() => setEditing('new')} className={`${ctaCls} h-auto`}>
                        Create your first account
                    </Button>
                </Card>
            ) : (
                <Card className={`${cardCls} overflow-hidden`}>
                    {accounts.map((a) => (
                        <AccountRow
                            key={a.id}
                            account={a}
                            active={a.id === activeId}
                            onEdit={() => setEditing(a)}
                            onDelete={() => setDeleting(a)}
                        />
                    ))}
                </Card>
            )}

            {editing && (
                <AccountModal
                    account={editing === 'new' ? null : editing}
                    onClose={() => setEditing(null)}
                />
            )}
            {deleting && (
                <DeleteAccountModal account={deleting} onClose={() => setDeleting(null)} />
            )}
        </div>
    );
}
