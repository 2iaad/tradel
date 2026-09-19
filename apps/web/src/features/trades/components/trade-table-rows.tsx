'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, type Row } from '@tanstack/react-table';
import { Check, GripVertical } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { useNotesStore } from '@/features/journal/store';
import type { useTradeLog } from '@/features/trades/hooks/use-trade-log';
import type { TradeLogRow } from '@/features/trades/lib/trade-log-row';
import type { TradePayload } from '@/features/trades/types';
import { G, R } from '@/lib/ui';
import { TradeRowForm } from './trade-row-form';

type Log = ReturnType<typeof useTradeLog>;

export function DragHandle({ id }: { id: string }) {
    const { attributes, listeners } = useSortable({ id });

    return (
        <Button
            {...attributes}
            {...listeners}
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 text-muted-foreground hover:bg-transparent"
        >
            <GripVertical className="size-3 text-muted-foreground" />
            <span className="sr-only">Drag to reorder</span>
        </Button>
    );
}

export function SideBadge({ side }: { side: TradeLogRow['side'] }) {
    const long = side === 'LONG';
    return (
        <Badge
            variant="outline"
            className="h-auto px-1.5 font-mono text-ui-xs font-semibold tracking-[0.06em]"
            style={{
                color: long ? G : R,
                background: long
                    ? 'color-mix(in srgb, var(--profit) 10%, transparent)'
                    : 'color-mix(in srgb, var(--loss) 10%, transparent)',
                borderColor: long
                    ? 'color-mix(in srgb, var(--profit) 28%, transparent)'
                    : 'color-mix(in srgb, var(--loss) 28%, transparent)',
            }}
        >
            {side}
        </Badge>
    );
}

function TradeDetails({ tradeId, onAddNote }: { tradeId: string; onAddNote: () => void }) {
    const notes = useNotesStore((state) => state.notes);
    const tradeNotes = notes.filter((note) => note.trade_id === tradeId);

    return (
        <div className="flex min-h-16 flex-col justify-center gap-3 px-3 py-2">
            {tradeNotes.length ? (
                tradeNotes.map((note) => (
                    <div key={note.id} className="flex flex-col gap-1.5 whitespace-normal">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground">{note.title}</span>
                            {note.tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="outline"
                                    className="px-1.5 text-muted-foreground"
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                            {note.body}
                        </p>
                    </div>
                ))
            ) : (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>No note attached to this trade.</span>
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={onAddNote}
                    >
                        Add note
                    </Button>
                </div>
            )}
        </div>
    );
}

export function EditorRow({
    trade,
    visibleColumnIds,
    onSave,
    onCancel,
}: {
    trade: TradeLogRow | null;
    visibleColumnIds: string[];
    onSave: (payload: TradePayload, id?: string) => Promise<void>;
    onCancel: () => void;
}) {
    return (
        <TradeRowForm
            t={trade}
            visibleColumnIds={visibleColumnIds}
            onSave={onSave}
            onCancel={onCancel}
        />
    );
}

export function DraggableRow({
    row,
    selected,
    log,
    onAddNote,
}: {
    row: Row<TradeLogRow>;
    selected: boolean;
    log: Log;
    onAddNote: (tradeId: string) => void;
}) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({ id: row.original.id });
    const isOpen = log.openId === row.original.id;

    if (log.editingId === row.original.id) {
        return (
            <EditorRow
                trade={row.original}
                visibleColumnIds={row.getVisibleCells().map((cell) => cell.column.id)}
                onSave={log.saveTrade}
                onCancel={log.cancelEdit}
            />
        );
    }

    return (
        <React.Fragment>
            <TableRow
                data-state={row.getIsSelected() ? 'selected' : undefined}
                data-dragging={isDragging}
                aria-expanded={isOpen}
                ref={setNodeRef}
                className="relative z-0 data-[state=selected]:bg-primary/[0.06] data-[state=selected]:shadow-[inset_3px_0_0_var(--primary)] data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
                style={{ transform: CSS.Transform.toString(transform), transition }}
            >
                {row.getVisibleCells().map((cell) => {
                    if (cell.column.id === 'select') {
                        return (
                            <TableCell key={cell.id}>
                                <div className="relative flex items-center justify-center">
                                    <Checkbox
                                        checked={selected}
                                        onCheckedChange={(checked) => row.toggleSelected(checked)}
                                        aria-label={`Select ${row.original.sym} trade`}
                                        className="[&_[data-slot=checkbox-indicator]]:hidden"
                                        style={{
                                            backgroundColor: selected
                                                ? 'var(--primary)'
                                                : 'transparent',
                                            borderColor: selected
                                                ? 'var(--primary)'
                                                : 'var(--input)',
                                        }}
                                    />
                                    {selected && (
                                        <Check className="pointer-events-none absolute size-3.5 text-primary-foreground" />
                                    )}
                                </div>
                            </TableCell>
                        );
                    }
                    return (
                        <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    );
                })}
            </TableRow>
            {isOpen && (
                <TableRow className="bg-muted/35 hover:bg-muted/35">
                    <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                        <TradeDetails
                            tradeId={row.original.id}
                            onAddNote={() => onAddNote(row.original.id)}
                        />
                    </TableCell>
                </TableRow>
            )}
        </React.Fragment>
    );
}
