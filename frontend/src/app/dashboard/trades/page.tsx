"use client";

import { ctaCls } from "@/lib/ui";
import { PageHeader } from "../page-header";
import { FilterToolbar } from "./filter-toolbar";
import { SummaryStrip } from "./summary-strip";
import { TradeLogTable } from "./trade-log-table";
import { useTradeLog } from "./use-trade-log";

// Trades route: filterable, sortable trade log backed by the trades API.
export default function TradesPage() {
    const log = useTradeLog();
    return (
        <div className="w-full max-w-[1240px] box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            <PageHeader kicker="/// TRADES" title="Trade log">
                <button
                    type="button"
                    onClick={() => log.startEdit("new")}
                    className={`${ctaCls} whitespace-nowrap`}
                >
                    + Log trade
                </button>
            </PageHeader>
            <FilterToolbar log={log} />
            <SummaryStrip summary={log.summary} />
            <TradeLogTable log={log} dense={false} />
        </div>
    );
}
