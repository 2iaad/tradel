'use client';

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
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type RowSelectionState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Columns3,
    Plus,
} from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
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
import { AccountModal } from '@/features/accounts/components/account-modal';
import { useAccountStore } from '@/features/accounts/store';
import { NoteModal } from '@/features/journal/components/note-modal';
import { useNotesStore } from '@/features/journal/store';
import type { useTradeLog } from '@/features/trades/hooks/use-trade-log';
import type { TradeLogRow } from '@/features/trades/lib/trade-log-row';

import { ConfirmDeleteModal } from './confirm-delete-modal';
import { buildTradeColumns } from './trade-table-columns';
import { DraggableRow, EditorRow } from './trade-table-rows';

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
        () => buildTradeColumns(log, tradesWithNotes, setAddNoteFor),
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
