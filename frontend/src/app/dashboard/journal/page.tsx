'use client';

import { useEffect, useMemo, useState } from 'react';

import { cardCls } from '@/lib/ui';
import { useNotesStore } from '@/stores/notes';
import type { ApiNote } from '@/stores/notes';
import { useTradesStore } from '@/stores/trades';
import { PageHeader } from '../page-header';
import { NoteModal } from './note-modal';

const tagChip =
    'inline-flex px-2 py-0.5 rounded font-mono text-[9.5px] font-medium tracking-[0.06em] text-[#78878a] border border-[#222a2f]';

// One note card: title, body preview, linked trade symbol, tags, edit/delete.
function NoteCard({
    note,
    symbol,
    onEdit,
    onDelete,
}: {
    note: ApiNote;
    symbol: string;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const iconCls =
        'bg-transparent border-none p-0 cursor-pointer text-[13px] leading-none transition-colors';
    const date = new Date(note.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
    return (
        <div className={`${cardCls} p-5 flex flex-col gap-2.5`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-[#2fd57f] border border-[#2fd57f33] rounded px-1.5 py-0.5 whitespace-nowrap">
                        {symbol}
                    </span>
                    <span className="font-mono text-[10px] text-[#4d5a5f]">{date}</span>
                </div>
                <span className="flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onEdit}
                        title="Edit note"
                        className={`${iconCls} text-[#5f6b70] hover:text-[#2fd57f]`}
                    >
                        ✎
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        title="Delete note"
                        className={`${iconCls} text-[#5f6b70] hover:text-[#f0554e]`}
                    >
                        ✕
                    </button>
                </span>
            </div>
            <span className="text-[15px] font-semibold text-[#e9eef0]">{note.title}</span>
            <span className="text-[13px] leading-[1.6] text-[#8a9995]">{note.body}</span>
            {note.tags.length > 0 && (
                <span className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {note.tags.map((t) => (
                        <span key={t} className={tagChip}>
                            {t}
                        </span>
                    ))}
                </span>
            )}
        </div>
    );
}

// Confirmation card shown before a note is deleted.
function ConfirmDelete({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
    const btn =
        'flex-1 rounded-lg px-4 py-2.5 font-mono text-[11px] font-semibold tracking-[0.1em] cursor-pointer transition-colors';
    return (
        <div
            onClick={onCancel}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,6,8,0.7)] backdrop-blur-[6px] animate-[tradelFadeIn_0.25s_ease]"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-[360px] max-w-[calc(100vw-48px)] box-border bg-[#0e1214] border border-[#222a2f] rounded-xl px-[30px] py-7 flex flex-col gap-4 animate-[tradelPopIn_0.3s_cubic-bezier(0.34,1.4,0.44,1)]"
            >
                {/* <span className={kickerCls}>{'/// DELETE NOTE'}</span> */}
                <h2 className="m-0 text-xl font-semibold text-[#eef4f2]">Delete this note?</h2>
                <p className="m-0 text-[13px] text-[#8a9995]">This can&apos;t be undone.</p>
                <div className="flex gap-2.5 mt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        className={`${btn} bg-transparent border border-[#222a2f] text-[#78878a] hover:text-[#c8d2d0] hover:border-[#2b353b]`}
                    >
                        CANCEL
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`${btn} border-none bg-[#f0554e] text-[#140404] hover:bg-[#ff6f68]`}
                    >
                        DELETE
                    </button>
                </div>
            </div>
        </div>
    );
}

// Journal route: browse, filter, and manage trade notes for the active account.
export default function JournalPage() {
    const notes = useNotesStore((s) => s.notes);
    const loading = useNotesStore((s) => s.loading);
    const error = useNotesStore((s) => s.error);
    const loadNotes = useNotesStore((s) => s.load);
    const removeNote = useNotesStore((s) => s.remove);
    const trades = useTradesStore((s) => s.trades);
    const loadTrades = useTradesStore((s) => s.load);

    // Notes need the trade list too (linked symbol + the create-form select).
    useEffect(() => {
        loadNotes();
        loadTrades();
    }, [loadNotes, loadTrades]);

    const symbolOf = useMemo(() => {
        const map = new Map(trades.map((t) => [t.id, t.symbol]));
        return (tradeId: string) => map.get(tradeId) ?? '—';
    }, [trades]);

    const [q, setQ] = useState('');
    const [tag, setTag] = useState('ALL');
    // Note being edited (null = closed). Notes are created from a trade row.
    const [editing, setEditing] = useState<ApiNote | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const allTags = useMemo(() => {
        const set = new Set<string>();
        notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
        return ['ALL', ...[...set].sort()];
    }, [notes]);

    const rows = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return notes.filter((n) => {
            if (tag !== 'ALL' && !n.tags.includes(tag)) return false;
            if (
                needle &&
                !n.title.toLowerCase().includes(needle) &&
                !n.body.toLowerCase().includes(needle)
            )
                return false;
            return true;
        });
    }, [notes, q, tag]);

    return (
        <div className="w-full max-w-[1000px] box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader kicker="" title="Trade notes" />

            <div className="flex items-center gap-3 flex-wrap">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search notes…"
                    className="flex-1 min-w-[200px] max-w-[320px] box-border bg-[#0a0d0f] border border-[#1b2226] rounded-lg px-3.5 py-2.5 text-[#e9eef0] font-mono text-[12.5px] outline-none transition-colors focus:border-[#2fd57f66] placeholder:text-[#4d5a5f]"
                />
                <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="box-border bg-[#0a0d0f] border border-[#1b2226] rounded-lg px-3 py-2.5 text-[#c8d2d0] font-mono text-[12px] outline-none focus:border-[#2fd57f66] [color-scheme:dark]"
                >
                    {allTags.map((t) => (
                        <option key={t} value={t}>
                            {t === 'ALL' ? 'ALL TAGS' : t}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <p className="font-mono text-[12px] tracking-[0.14em] text-[#5f6b70] px-1">
                    LOADING NOTES…
                </p>
            ) : error ? (
                <p className="font-mono text-[12px] tracking-[0.14em] text-[#f0554e] px-1">
                    {error.toUpperCase()}
                </p>
            ) : rows.length === 0 ? (
                <div className={`${cardCls} flex flex-col items-center gap-4 py-16 px-6`}>
                    <span className="font-mono text-[11px] font-medium tracking-[0.16em] text-[#5f6b70]">
                        {notes.length === 0 ? 'NO NOTES YET' : 'NO NOTES MATCH YOUR FILTERS'}
                    </span>
                    {notes.length === 0 && (
                        <p className="m-0 text-[13px] text-[#8a9995] text-center max-w-[380px]">
                            Attach a note to a trade to record what you saw, what you did, and what
                            you learned.
                        </p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">
                    {rows.map((n) => (
                        <NoteCard
                            key={n.id}
                            note={n}
                            symbol={symbolOf(n.trade_id)}
                            onEdit={() => setEditing(n)}
                            onDelete={() => setDeletingId(n.id)}
                        />
                    ))}
                </div>
            )}

            {editing && (
                <NoteModal
                    note={editing}
                    tradeId={editing.trade_id}
                    onClose={() => setEditing(null)}
                />
            )}
            {deletingId && (
                <ConfirmDelete
                    onCancel={() => setDeletingId(null)}
                    onConfirm={() => {
                        removeNote(deletingId);
                        setDeletingId(null);
                    }}
                />
            )}
        </div>
    );
}
