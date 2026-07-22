'use client';

import { useAuthSubmit } from '@/hooks/use-auth-submit';
import { apiMessage } from '@/lib/api';
import { btnCls, errorCls, inputCls, kickerCls, labelCls } from '@/lib/ui';
import { useAccountStore } from '@/stores/accounts';
import type { Account, AccountPayload } from '@/stores/accounts';

const CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

// Reads the create/edit form into an accounts API payload.
function toPayload(f: FormData): AccountPayload {
    const broker = (f.get('broker') as string).trim();
    return {
        name: (f.get('name') as string).trim(),
        broker: broker === '' ? undefined : broker,
        currency: f.get('currency') as string,
    };
}

// Create-or-edit account modal. `account` prefills for editing; null creates.
export function AccountModal({
    account,
    onClose,
}: {
    account: Account | null;
    onClose: () => void;
}) {
    const create = useAccountStore((s) => s.create);
    const rename = useAccountStore((s) => s.rename);
    const editing = account !== null;

    const { pending, error, onSubmit } = useAuthSubmit(async (f) => {
        try {
            if (editing) await rename(account.id, toPayload(f));
            else await create(toPayload(f));
        } catch (err) {
            throw new Error(apiMessage(err));
        }
    }, onClose);

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,6,8,0.7)] backdrop-blur-[6px] animate-[tradelFadeIn_0.25s_ease]"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-[400px] max-w-[calc(100vw-48px)] box-border bg-[#0e1214] border border-[#222a2f] rounded-xl px-[30px] py-7 flex flex-col gap-[18px] animate-[tradelPopIn_0.3s_cubic-bezier(0.34,1.4,0.44,1)]"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-2.5">
                        <h2 className="m-0 text-2xl font-semibold tracking-[-0.01em] text-[#eef4f2]">
                            {editing ? 'Edit account' : 'Add an account'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-transparent border-none p-0.5 text-[#5f6b70] text-lg leading-none cursor-pointer hover:text-[#eef4f2]"
                    >
                        ×
                    </button>
                </div>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className={labelCls}>Name</label>
                        <input
                            name="name"
                            defaultValue={account?.name}
                            required
                            maxLength={50}
                            placeholder="Prop challenge, Personal…"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Broker (optional)</label>
                        <input
                            name="broker"
                            defaultValue={account?.broker ?? ''}
                            maxLength={60}
                            placeholder="FTMO, IBKR…"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Currency</label>
                        <select
                            name="currency"
                            defaultValue={account?.currency ?? 'USD'}
                            className={`${inputCls} [color-scheme:dark]`}
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    {error && <p className={errorCls}>{error}</p>}
                    <button type="submit" disabled={pending} className={btnCls}>
                        {editing ? 'Save changes' : 'Create account'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Confirmation card shown before an account (and its trades/notes) is deleted.
export function DeleteAccountModal({
    account,
    onClose,
}: {
    account: Account;
    onClose: () => void;
}) {
    const remove = useAccountStore((s) => s.remove);
    const { pending, error, onSubmit } = useAuthSubmit(async () => {
        try {
            await remove(account.id);
        } catch (err) {
            throw new Error(apiMessage(err));
        }
    }, onClose);

    const btn =
        'flex-1 rounded-lg px-4 py-2.5 font-mono text-[11px] font-semibold tracking-[0.1em] cursor-pointer transition-colors';

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,6,8,0.7)] backdrop-blur-[6px] animate-[tradelFadeIn_0.25s_ease]"
        >
            <form
                onSubmit={onSubmit}
                onClick={(e) => e.stopPropagation()}
                className="w-[380px] max-w-[calc(100vw-48px)] box-border bg-[#0e1214] border border-[#222a2f] rounded-xl px-[30px] py-7 flex flex-col gap-4 animate-[tradelPopIn_0.3s_cubic-bezier(0.34,1.4,0.44,1)]"
            >
                <h2 className="m-0 text-xl font-semibold text-[#eef4f2]">
                    Delete “{account.name}”?
                </h2>
                <p className="m-0 text-[13px] text-[#8a9995]">
                    Every trade and note in this account is removed too. This can&apos;t be undone.
                </p>
                {error && <p className={errorCls}>{error}</p>}
                <div className="flex gap-2.5 mt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`${btn} bg-transparent border border-[#222a2f] text-[#78878a] hover:text-[#c8d2d0] hover:border-[#2b353b]`}
                    >
                        CANCEL
                    </button>
                    <button
                        type="submit"
                        disabled={pending}
                        className={`${btn} border-none bg-[#f0554e] text-[#140404] hover:bg-[#ff6f68] disabled:opacity-50`}
                    >
                        DELETE
                    </button>
                </div>
            </form>
        </div>
    );
}
