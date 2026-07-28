'use client';

import { useAuthSubmit } from '@/hooks/use-auth-submit';
import { apiMessage } from '@/lib/api';
import { errorCls, inputCls, labelCls } from '@/lib/ui';
import { useAccountStore } from '@/stores/accounts';
import type { Account, AccountPayload } from '@/stores/accounts';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

// Reads the create/edit form into an accounts API payload.
function toPayload(f: FormData): AccountPayload {
    const broker = (f.get('broker') as string).trim();
    return {
        name: (f.get('name') as string).trim(),
        broker: broker === '' ? undefined : broker,
        currency: f.get('currency') as string,
        startingBalance: Number(f.get('startingBalance')),
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
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[400px] border-border bg-card p-7 text-card-foreground">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold tracking-[-0.01em] text-card-foreground">
                        {editing ? 'Edit account' : 'Add an account'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Keep your trading account details in one place.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <div>
                        <Label className={labelCls}>Name</Label>
                        <Input
                            name="name"
                            defaultValue={account?.name}
                            required
                            maxLength={50}
                            placeholder="Prop challenge, Personal…"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <Label className={labelCls}>Broker (optional)</Label>
                        <Input
                            name="broker"
                            defaultValue={account?.broker ?? ''}
                            maxLength={60}
                            placeholder="FTMO, IBKR…"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <Label className={labelCls}>Currency</Label>
                        <Select
                            name="currency"
                            defaultValue={account?.currency ?? 'USD'}
                        >
                            <SelectTrigger className={`${inputCls} h-auto [color-scheme:dark]`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className={labelCls}>Starting balance</Label>
                        <Input
                            name="startingBalance"
                            type="number"
                            min={0}
                            step="0.01"
                            defaultValue={account?.starting_balance ?? '0'}
                            required
                            placeholder="10000"
                            className={inputCls}
                        />
                    </div>
                    {error && <p className={errorCls}>{error}</p>}
                    <DialogFooter className="mx-0 mt-2 mb-0 rounded-none border-0 bg-transparent p-0">
                        <Button type="submit" disabled={pending} className="w-full bg-primary text-primary-foreground hover:bg-primary-hover">
                            {editing ? 'Save changes' : 'Create account'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
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

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[380px] border-border bg-card p-7 text-card-foreground">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-card-foreground">
                        Delete “{account.name}”?
                    </DialogTitle>
                    <DialogDescription className="text-ui-sm text-content-dim">
                        Every trade and note in this account is removed too. This can&apos;t be undone.
                    </DialogDescription>
                </DialogHeader>
                {error && <p className={errorCls}>{error}</p>}
                <form onSubmit={onSubmit} className="flex gap-2.5 pt-1">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-border text-muted-foreground hover:border-border-hover hover:bg-transparent hover:text-secondary-foreground">
                        CANCEL
                    </Button>
                    <Button type="submit" disabled={pending} variant="destructive" className="flex-1 bg-loss text-loss-foreground hover:bg-loss-hover">
                        DELETE
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
