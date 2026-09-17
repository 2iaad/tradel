'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { FileText, MoreVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { useTradeLog } from '@/features/trades/hooks/use-trade-log';
import type { TradeLogRow } from '@/features/trades/lib/trade-log-row';
import { signedMoney } from '@/lib/format';
import { G, R } from '@/lib/ui';

import { DragHandle, SideBadge } from './trade-table-rows';

type Log = ReturnType<typeof useTradeLog>;

export function buildTradeColumns(
    log: Log,
    tradesWithNotes: Set<string | null>,
    setAddNoteFor: (tradeId: string) => void,
): ColumnDef<TradeLogRow>[] {
    return [
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
                    <span className="font-mono text-secondary-foreground">{row.original.date}</span>
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
                <div className="font-mono text-muted-foreground">{row.original.exit ?? '—'}</div>
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
    ];
}
