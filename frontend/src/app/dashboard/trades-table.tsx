import Link from "next/link";

import { signedMoney } from "@/lib/format";
import { cardCls, G, ghostBtnCls, h2Cls, R } from "@/lib/ui";
import type { TradeLogRow } from "./trades/use-trade-log";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const tableGrid = "grid grid-cols-[78px_74px_1fr_1fr_56px_64px_104px_66px] gap-2";

// LONG/SHORT pill for a trade row.
function SideBadge({ side }: { side: string }) {
    const long = side === "LONG";
    return (
        <span>
            <Badge
                variant="outline"
                className="h-auto rounded px-2 py-0.5 font-mono text-ui-xs font-semibold tracking-[0.08em]"
                style={{
                    color: long ? G : R,
                    background: long ? "rgba(47,213,127,.08)" : "rgba(240,85,78,.08)",
                    borderColor: long ? "rgba(47,213,127,.25)" : "rgba(240,85,78,.25)",
                }}
            >
                {side}
            </Badge>
        </span>
    );
}

const numCls = "font-mono text-ui-sm text-content-muted";

// One row of the recent-trades table.
function TradeRow({ t }: { t: TradeLogRow }) {
    const winCol = { color: (t.pnlv ?? 0) >= 0 ? G : R };
    return (
        <div
            className={`${tableGrid} items-center px-[22px] py-[11px] border-t border-border-faint transition-colors cursor-default hover:bg-accent`}
        >
            <span className="font-mono text-ui-sm font-semibold text-content">{t.sym}</span>
            <SideBadge side={t.side} />
            <span className={numCls}>{t.entry}</span>
            <span className={numCls}>{t.exit ?? "—"}</span>
            <span className={numCls}>{t.lots}</span>
            <span className="font-mono text-ui-sm font-medium" style={winCol}>
                {t.rv === null ? "—" : `${t.rv > 0 ? "+" : ""}${t.rv.toFixed(1)}R`}
            </span>
            <span className="font-mono text-ui-sm font-semibold text-right" style={winCol}>
                {t.pnlv === null ? "—" : signedMoney(t.pnlv)}
            </span>
            <span className="font-mono text-ui-xs text-content-faint text-right">{t.date}</span>
        </div>
    );
}

// Column labels above the trade rows.
function TableHead() {
    return (
        <div
            className={`${tableGrid} px-[22px] py-2 border-t border-border-faint font-mono text-ui-xs font-medium tracking-[0.12em] text-content-faint`}
        >
            <span>SYMBOL</span>
            <span>SIDE</span>
            <span>ENTRY</span>
            <span>EXIT</span>
            <span>LOTS</span>
            <span>R:R</span>
            <span className="text-right">P&L</span>
            <span className="text-right">DATE</span>
        </div>
    );
}

// Centered placeholder shown while loading or when the log is empty.
function EmptyRows({ loading }: { loading: boolean }) {
    return (
        <div className="px-[22px] py-8 border-t border-border-faint text-center font-mono text-ui-xs tracking-[0.12em] text-content-faint">
            {loading ? "LOADING…" : "NO TRADES YET — LOG YOUR FIRST ONE"}
        </div>
    );
}

// Recent-trades card for the signed-in dashboard, backed by the trades API.
export function TradesTable({ rows, loading }: { rows: TradeLogRow[]; loading: boolean }) {
    return (
        <Card className={`${cardCls} pt-5 pb-1.5 flex flex-col`}>
            <div className="flex items-center justify-between px-[22px] pb-3.5">
                <h2 className={h2Cls}>Recent 5 trades</h2>
                <Button nativeButton={false} render={<Link href="/dashboard/trades" />} variant="ghost" size="sm" className={`${ghostBtnCls} h-auto px-0 hover:bg-transparent`}>
                    VIEW ALL →
                </Button>
            </div>
            <TableHead />
            {rows.length === 0 && <EmptyRows loading={loading} />}
            {rows.map((t) => (
                <TradeRow key={t.id} t={t} />
            ))}
        </Card>
    );
}
