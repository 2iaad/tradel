'use client';

import { useAuthSubmit } from '@/hooks/use-auth-submit';
import { apiMessage } from '@/lib/api';
import { errorCls, inputCls, labelCls } from '@/lib/ui';
import { useNotesStore } from '@/stores/notes';
import type { ApiNote, NotePayload } from '@/stores/notes';
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
import { Textarea } from '@/components/ui/textarea';

// Space-separated tag string → trimmed, non-empty, max 5 tags.
function toTags(raw: string): string[] {
    return raw
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t !== '')
        .slice(0, 5);
}

function toPayload(f: FormData): NotePayload {
    return {
        title: (f.get('title') as string).trim(),
        body: (f.get('body') as string).trim(),
        tags: toTags((f.get('tags') as string) ?? ''),
    };
}

// Create-or-edit note modal. `note` prefills for editing; creating attaches
// the note to `tradeId` (the row it was opened from — no trade picker).
export function NoteModal({
    note,
    tradeId,
    onClose,
}: {
    note: ApiNote | null;
    tradeId: string;
    onClose: () => void;
}) {
    const create = useNotesStore((s) => s.create);
    const update = useNotesStore((s) => s.update);
    const editing = note !== null;

    const { pending, error, onSubmit } = useAuthSubmit(async (f) => {
        try {
            if (editing) await update(note.id, toPayload(f));
            else await create(tradeId, toPayload(f));
        } catch (err) {
            throw new Error(apiMessage(err));
        }
    }, onClose);

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[440px] border-border bg-card p-7 text-card-foreground">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold tracking-[-0.01em] text-card-foreground">
                        {editing ? 'Edit note' : 'Add a note'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Capture the context behind this trade.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <div>
                        <Label className={labelCls}>Title</Label>
                        <Input
                            name="title"
                            defaultValue={note?.title}
                            required
                            maxLength={50}
                            placeholder="Chased the entry…"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <Label className={labelCls}>Note</Label>
                        <Textarea
                            name="body"
                            defaultValue={note?.body}
                            required
                            rows={5}
                            placeholder="What happened, what you learned…"
                            className={`${inputCls} h-auto resize-y`}
                        />
                    </div>
                    <div>
                        <Label className={labelCls}>Tags (space-separated, max 5)</Label>
                        <Input
                            name="tags"
                            defaultValue={note?.tags.join(' ')}
                            placeholder="fomo breakout revenge"
                            className={inputCls}
                        />
                    </div>
                    {error && <p className={errorCls}>{error}</p>}
                    <DialogFooter className="mx-0 mt-2 mb-0 rounded-none border-0 bg-transparent p-0">
                        <Button type="submit" disabled={pending} className="w-full bg-primary text-primary-foreground hover:bg-primary-hover">
                            {editing ? 'Save changes' : 'Add note'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
