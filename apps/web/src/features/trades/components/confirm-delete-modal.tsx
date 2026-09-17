'use client';

import { Button } from '@/components/ui/button';

export function ConfirmDeleteModal({
    onCancel,
    onConfirm,
    pending,
    error,
}: {
    onCancel: () => void;
    onConfirm: () => Promise<void>;
    pending: boolean;
    error: string | null;
}) {
    return (
        <div
            onClick={onCancel}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[6px]"
        >
            <div
                onClick={(event) => event.stopPropagation()}
                className="flex w-[360px] max-w-[calc(100vw-48px)] flex-col gap-4 rounded-lg border bg-card px-[30px] py-7"
            >
                <h2 className="text-xl font-semibold text-card-foreground">Delete this trade?</h2>
                <p className="text-ui-sm text-muted-foreground">
                    The trade is removed from your journal. This can&apos;t be undone.
                </p>
                {error && (
                    <p role="alert" className="text-ui-sm text-destructive">
                        {error}
                    </p>
                )}
                <div className="mt-1 flex gap-2.5">
                    <Button
                        type="button"
                        disabled={pending}
                        onClick={onCancel}
                        variant="outline"
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={pending}
                        onClick={onConfirm}
                        variant="destructive"
                        className="flex-1"
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
}
