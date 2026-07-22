'use client';

import { useAuthSubmit } from '@/hooks/use-auth-submit';
import { apiMessage } from '@/lib/api';
import { btnCls, errorCls, inputCls, labelCls } from '@/lib/ui';
import { useNotesStore } from '@/stores/notes';
import type { ApiNote, NotePayload } from '@/stores/notes';

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
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,6,8,0.7)] backdrop-blur-[6px] animate-[tradelFadeIn_0.25s_ease]"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-[440px] max-w-[calc(100vw-48px)] box-border bg-[#0e1214] border border-[#222a2f] rounded-xl px-[30px] py-7 flex flex-col gap-[18px] animate-[tradelPopIn_0.3s_cubic-bezier(0.34,1.4,0.44,1)]"
            >
                <div className="flex items-start justify-between gap-3">
                    <h2 className="m-0 text-2xl font-semibold tracking-[-0.01em] text-[#eef4f2]">
                        {editing ? 'Edit note' : 'Add a note'}
                    </h2>
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
                        <label className={labelCls}>Title</label>
                        <input
                            name="title"
                            defaultValue={note?.title}
                            required
                            maxLength={50}
                            placeholder="Chased the entry…"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Note</label>
                        <textarea
                            name="body"
                            defaultValue={note?.body}
                            required
                            rows={5}
                            placeholder="What happened, what you learned…"
                            className={`${inputCls} resize-y`}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Tags (space-separated, max 5)</label>
                        <input
                            name="tags"
                            defaultValue={note?.tags.join(' ')}
                            placeholder="fomo breakout revenge"
                            className={inputCls}
                        />
                    </div>
                    {error && <p className={errorCls}>{error}</p>}
                    <button type="submit" disabled={pending} className={btnCls}>
                        {editing ? 'Save changes' : 'Add note'}
                    </button>
                </form>
            </div>
        </div>
    );
}
