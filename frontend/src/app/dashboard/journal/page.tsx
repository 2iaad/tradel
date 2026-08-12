'use client';

import { useEffect, useMemo, useState } from 'react';

import { cardCls } from '@/lib/ui';
import { useNotesStore } from '@/stores/notes';
import type { ApiNote } from '@/stores/notes';
import { useTradesStore } from '@/stores/trades';
import { PageHeader } from '../page-header';
import { NoteModal } from './note-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const tagChip =
    'inline-flex px-2 py-0.5 rounded font-mono text-ui-xs font-medium tracking-[0.06em] text-muted-foreground border border-border';

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
        'bg-transparent border-none p-0 cursor-pointer text-ui-sm leading-none transition-colors';
    const date = new Date(note.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
    return (
        <Card className={`${cardCls} p-5 flex flex-col gap-2.5`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <Badge variant="outline" className="h-auto rounded px-1.5 py-0.5 font-mono text-ui-xs font-semibold tracking-[0.08em] text-primary whitespace-nowrap">
                        {symbol}
                    </Badge>
                    <span className="font-mono text-ui-xs text-content-placeholder">{date}</span>
                </div>
                <span className="flex items-center gap-3 shrink-0">
                    <Button
                        type="button"
                        onClick={onEdit}
                        title="Edit note"
                        variant="ghost"
                        size="icon-sm"
                        className={`${iconCls} text-content-faint hover:bg-transparent hover:text-primary`}
                    >
                        ✎
                    </Button>
                    <Button
                        type="button"
                        onClick={onDelete}
                        title="Delete note"
                        variant="ghost"
                        size="icon-sm"
                        className={`${iconCls} text-content-faint hover:bg-transparent hover:text-loss`}
                    >
                        ✕
                    </Button>
                </span>
            </div>
            <span className="text-ui-md font-semibold text-content">{note.title}</span>
            <span className="text-ui-sm leading-[1.6] text-content-dim">{note.body}</span>
            {note.tags.length > 0 && (
                <span className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {note.tags.map((t) => (
                        <span key={t} className={tagChip}>
                            {t}
                        </span>
                    ))}
                </span>
            )}
        </Card>
    );
}

// Confirmation card shown before a note is deleted.
function ConfirmDelete({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
    const btn =
        'flex-1 font-mono font-semibold tracking-[0.1em] cursor-pointer transition-colors';
    return (
        <div
            onClick={onCancel}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[6px] animate-[tradelFadeIn_0.25s_ease]"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-[360px] max-w-[calc(100vw-48px)] box-border bg-card border border-border rounded-xl px-[30px] py-7 flex flex-col gap-4 animate-[tradelPopIn_0.3s_cubic-bezier(0.34,1.4,0.44,1)]"
            >
                {/* <span className={kickerCls}>{'/// DELETE NOTE'}</span> */}
                <h2 className="m-0 text-xl font-semibold text-card-foreground">Delete this note?</h2>
                <p className="m-0 text-ui-sm text-content-dim">This can&apos;t be undone.</p>
                <div className="flex gap-2.5 mt-1">
                    <Button
                        type="button"
                        onClick={onCancel}
                        variant="outline"
                        className={`${btn} border-border bg-transparent text-muted-foreground hover:bg-transparent hover:text-secondary-foreground hover:border-border-hover`}
                    >
                        CANCEL
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        variant="destructive"
                        className={`${btn} bg-loss text-loss-foreground hover:bg-loss-hover`}
                    >
                        DELETE
                    </Button>
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
        <div className="w-full max-w-11/12 box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader kicker="" title="Trade notes" />

            <div className="flex items-center gap-3 flex-wrap">
            <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search notes…"
                className="h-auto flex-1 min-w-[200px] max-w-[320px] box-border bg-muted border-border-subtle px-3.5 py-2.5 font-mono text-ui-sm text-content placeholder:text-content-placeholder"
            />
                <Select value={tag} onValueChange={(value) => value && setTag(value)}>
                    <SelectTrigger className="h-auto min-w-[130px] border-border-subtle bg-muted px-3 py-2.5 font-mono text-ui-sm text-secondary-foreground hover:bg-muted">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {allTags.map((t) => (
                            <SelectItem key={t} value={t}>{t === 'ALL' ? 'ALL TAGS' : t}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <p className="font-mono text-ui-sm tracking-[0.14em] text-content-faint px-1">
                    LOADING NOTES…
                </p>
            ) : error ? (
                <p className="font-mono text-ui-sm tracking-[0.14em] text-loss px-1">
                    {error.toUpperCase()}
                </p>
            ) : rows.length === 0 ? (
                <Card className={`${cardCls} flex flex-col items-center gap-4 py-16 px-6`}>
                    <span className="font-mono text-ui-xs font-medium tracking-[0.16em] text-content-faint">
                        {notes.length === 0 ? 'NO NOTES YET' : 'NO NOTES MATCH YOUR FILTERS'}
                    </span>
                    {notes.length === 0 && (
                        <p className="m-0 text-ui-sm text-content-dim text-center max-w-[380px]">
                            Attach a note to a trade to record what you saw, what you did, and what
                            you learned.
                        </p>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-2 gap-6 max-[720px]:grid-cols-1">
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
