'use client';

import * as React from 'react';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type Row,
    type RowSelectionState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import {
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Columns3,
    FileText,
    GripVertical,
    MoreVertical,
    Plus,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { signedMoney } from '@/lib/format';
import { G, R } from '@/lib/ui';
import { useAccountStore } from '@/stores/accounts';
import { useNotesStore } from '@/stores/notes';
import type { TradePayload } from '@/stores/trades';
import { AccountModal } from '@/app/dashboard/account-modal';
import { NoteModal } from '@/app/dashboard/journal/note-modal';
import { TradeRowForm } from './trade-row-form';
import type { TradeLogRow, useTradeLog } from './use-trade-log';

type Log = ReturnType<typeof useTradeLog>;

const VIEW_FILTERS = {
    all: { outcome: 'ALL', side: 'ALL' },
    winners: { outcome: 'WINS', side: 'ALL' },
    losers: { outcome: 'LOSSES', side: 'ALL' },
    long: { outcome: 'ALL', side: 'LONG' },
    short: { outcome: 'ALL', side: 'SHORT' },
} as const;

const COLUMN_LABELS: Record<string, string> = {
    date: 'Date',
    sym: 'Symbol',
    side: 'Side',
    entry: 'Entry',
    exit: 'Exit',
    lots: 'Lots',
    pnlv: 'P&L',
    rv: 'R:R',
};

const COLUMN_WIDTHS: Record<string, string> = {
    drag: 'w-10',
    select: 'w-10',
    date: 'w-56',
    side: 'w-28',
    entry: 'w-40',
    exit: 'w-40',
    lots: 'w-24',
    pnlv: 'w-36',
    rv: 'w-20',
    actions: 'w-16',
};

function DragHandle({ id }: { id: string }) {
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

function SideBadge({ side }: { side: TradeLogRow['side'] }) {
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

function EditorRow({
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

function DraggableRow({
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

function ConfirmDeleteModal({
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

export function TradeLogTable({ log }: { log: Log; dense: boolean }) {
    'use no memo';

    const notes = useNotesStore((state) => state.notes);
    const tradesWithNotes = React.useMemo(
        () => new Set(notes.map((note) => note.trade_id)),
        [notes],
    );
    const [data, setData] = React.useState(() => log.rows);
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
    const [addNoteFor, setAddNoteFor] = React.useState<string | null>(null);
    const [creatingAccount, setCreatingAccount] = React.useState(false);
    const activeAccountId = useAccountStore((state) => state.activeId);
    const accountsLoading = useAccountStore((state) => state.loading);
    const sortableId = React.useId();
    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(TouchSensor),
        useSensor(KeyboardSensor),
    );

    React.useEffect(() => {
        setData(log.rows);
    }, [log.rows]);

    const columns = React.useMemo<ColumnDef<TradeLogRow>[]>(
        () => [
            {
                id: 'drag',
                header: () => null,
                cell: ({ row }) => <DragHandle id={row.original.id} />,
                enableSorting: false,
                enableHiding: false,
            },
            {
                id: 'select',
                header: ({ table }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={table.getIsAllPageRowsSelected()}
                            indeterminate={table.getIsSomePageRowsSelected()}
                            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
                            aria-label="Select all trades"
                        />
                    </div>
                ),
                cell: () => null,
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'date',
                header: 'Date',
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-mono text-secondary-foreground">
                            {row.original.date}
                        </span>
                        <span className="font-mono text-ui-xs text-muted-foreground">
                            {row.original.clock}
                        </span>
                    </div>
                ),
                sortingFn: (a, b) => a.original.ts - b.original.ts,
            },
            {
                accessorKey: 'sym',
                header: 'Symbol',
                enableHiding: false,
                cell: ({ row }) => (
                    <Button
                        type="button"
                        variant="link"
                        className="h-auto gap-2 p-0 font-mono font-semibold text-foreground no-underline"
                        onClick={() => log.toggleOpen(row.original.id)}
                    >
                        {tradesWithNotes.has(row.original.id) && (
                            <FileText className="size-3 text-primary" />
                        )}
                        {row.original.sym}
                    </Button>
                ),
            },
            {
                accessorKey: 'side',
                header: 'Side',
                cell: ({ row }) => <SideBadge side={row.original.side} />,
            },
            {
                accessorKey: 'entry',
                header: 'Entry',
                cell: ({ row }) => (
                    <div className="font-mono text-muted-foreground">{row.original.entry}</div>
                ),
            },
            {
                accessorKey: 'exit',
                header: 'Exit',
                cell: ({ row }) => (
                    <div className="font-mono text-muted-foreground">
                        {row.original.exit ?? '—'}
                    </div>
                ),
            },
            {
                accessorKey: 'lots',
                header: 'Lots',
                cell: ({ row }) => (
                    <div className="font-mono text-muted-foreground">{row.original.lots}</div>
                ),
            },
            {
                accessorKey: 'pnlv',
                header: () => <div className="w-full text-right">P&amp;L</div>,
                cell: ({ row }) => {
                    const value = row.original.pnlv;
                    return (
                        <div
                            className="font-mono text-right font-semibold"
                            style={{ color: (value ?? 0) >= 0 ? G : R }}
                        >
                            {value === null ? '—' : signedMoney(value)}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'rv',
                header: () => <div className="w-full text-right">R:R</div>,
                cell: ({ row }) => {
                    const value = row.original.rv;
                    return (
                        <div
                            className="font-mono text-right font-medium"
                            style={{ color: (value ?? 0) >= 0 ? G : R }}
                        >
                            {value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(1)}R`}
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                enableHiding: false,
                cell: ({ row }) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                                />
                            }
                        >
                            <MoreVertical />
                            <span className="sr-only">Open trade menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => log.toggleOpen(row.original.id)}>
                                View notes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAddNoteFor(row.original.id)}>
                                Add note
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => log.startEdit(row.original.id)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => log.askDelete(row.original.id)}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [log, tradesWithNotes],
    );

    // TanStack Table manages mutable callbacks internally and is not compiler-memoized.
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns,
        state: { sorting, columnVisibility, rowSelection, pagination },
        getRowId: (row) => row.id,
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const dataIds = React.useMemo<UniqueIdentifier[]>(() => data.map((row) => row.id), [data]);

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            setData((current) => {
                const oldIndex = current.findIndex((row) => row.id === active.id);
                const newIndex = current.findIndex((row) => row.id === over.id);
                return arrayMove(current, oldIndex, newIndex);
            });
        }
    }

    const currentView =
        log.outcome === 'WINS'
            ? 'winners'
            : log.outcome === 'LOSSES'
              ? 'losers'
              : log.side === 'LONG'
                ? 'long'
                : log.side === 'SHORT'
                  ? 'short'
                  : 'all';
    const visibleColumnCount = table.getVisibleLeafColumns().length;
    const visibleColumnIds = table.getVisibleLeafColumns().map((column) => column.id);
    const pageCount = Math.max(1, table.getPageCount());

    function changeView(value: string | null) {
        if (!value || !(value in VIEW_FILTERS)) return;
        const filter = VIEW_FILTERS[value as keyof typeof VIEW_FILTERS];
        log.setOutcome(filter.outcome);
        log.setSide(filter.side);
        table.setPageIndex(0);
    }

    function startNewTrade() {
        if (activeAccountId) {
            log.startEdit('new');
            return;
        }
        setCreatingAccount(true);
    }

    return (
        <Tabs
            value={currentView}
            onValueChange={changeView}
            className="w-full flex-col justify-start gap-6"
        >
            <div className="flex items-center justify-between gap-3">
                <Label htmlFor="trade-view-selector" className="sr-only">
                    Trade view
                </Label>
                <Select value={currentView} onValueChange={changeView}>
                    <SelectTrigger
                        className="flex w-fit @4xl/main:hidden"
                        size="sm"
                        id="trade-view-selector"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All trades</SelectItem>
                        <SelectItem value="winners">Winners</SelectItem>
                        <SelectItem value="losers">Losers</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                    </SelectContent>
                </Select>
                <TabsList className="hidden @4xl/main:flex">
                    <TabsTrigger value="all">All trades</TabsTrigger>
                    <TabsTrigger value="winners">
                        Winners <Badge variant="secondary">{log.viewCounts.winners}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="losers">
                        Losers <Badge variant="secondary">{log.viewCounts.losers}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="long">
                        Long <Badge variant="secondary">{log.viewCounts.long}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="short">
                        Short <Badge variant="secondary">{log.viewCounts.short}</Badge>
                    </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                            <Columns3 />
                            <span className="hidden lg:inline">Customize Columns</span>
                            <span className="lg:hidden">Columns</span>
                            <ChevronDown />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(checked) =>
                                            column.toggleVisibility(checked)
                                        }
                                    >
                                        {COLUMN_LABELS[column.id] ?? column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startNewTrade}
                        disabled={accountsLoading}
                    >
                        <Plus />
                        <span className="hidden lg:inline">Add Trade</span>
                    </Button>
                </div>
            </div>

            <TabsContent
                value={currentView}
                className="relative flex min-w-0 flex-col gap-4 overflow-auto"
            >
                <div className="overflow-hidden rounded-lg border">
                    <DndContext
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragEnd={handleDragEnd}
                        sensors={sensors}
                        id={sortableId}
                    >
                        <Table className="min-w-[1100px] table-fixed">
                            <TableHeader className="sticky top-0 z-10 bg-muted">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                className={COLUMN_WIDTHS[header.column.id]}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column.columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody className="**:data-[slot=table-cell]:first:w-8">
                                {log.editingId === 'new' && (
                                    <EditorRow
                                        trade={null}
                                        visibleColumnIds={visibleColumnIds}
                                        onSave={log.saveTrade}
                                        onCancel={log.cancelEdit}
                                    />
                                )}
                                {table.getRowModel().rows.length ? (
                                    <SortableContext
                                        items={dataIds}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {table.getRowModel().rows.map((row) => (
                                            <DraggableRow
                                                key={row.id}
                                                row={row}
                                                selected={rowSelection[row.id] === true}
                                                log={log}
                                                onAddNote={setAddNoteFor}
                                            />
                                        ))}
                                    </SortableContext>
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={visibleColumnCount}
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            {log.loading
                                                ? 'Loading trades…'
                                                : log.error || 'No trades found.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </DndContext>
                </div>

                <div className="flex flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                    <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                        {table.getFilteredSelectedRowModel().rows.length} of {data.length} row(s)
                        selected.
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-4 lg:w-fit lg:gap-8">
                        <div className="hidden items-center gap-2 lg:flex">
                            <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                Rows per page
                            </Label>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => value && table.setPageSize(Number(value))}
                            >
                                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 40, 50].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-fit items-center justify-center text-sm font-medium">
                            Page {Math.min(table.getState().pagination.pageIndex + 1, pageCount)} of{' '}
                            {pageCount}
                        </div>
                        <div className="ml-auto flex items-center gap-2 lg:ml-0">
                            <Button
                                variant="outline"
                                className="hidden size-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to first page</span>
                                <ChevronsLeft />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <ChevronLeft />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <ChevronRight />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="hidden size-8 lg:flex"
                                onClick={() => table.setPageIndex(pageCount - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <ChevronsRight />
                            </Button>
                        </div>
                    </div>
                </div>
            </TabsContent>

            {log.deletingId && (
                <ConfirmDeleteModal
                    onCancel={log.cancelDelete}
                    onConfirm={log.confirmDelete}
                    pending={log.mutating}
                    error={log.deleteError}
                />
            )}
            {addNoteFor && (
                <NoteModal note={null} tradeId={addNoteFor} onClose={() => setAddNoteFor(null)} />
            )}
            {creatingAccount && (
                <AccountModal
                    account={null}
                    onClose={() => setCreatingAccount(false)}
                    onSaved={() => log.startEdit('new')}
                />
            )}
        </Tabs>
    );
}
