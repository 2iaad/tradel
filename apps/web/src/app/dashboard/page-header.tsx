import type { ReactNode } from 'react';

import { kickerCls } from '@/lib/ui';
import { dateStamp } from '@/lib/format';

// Dashboard page header: kicker + title left, date stamp + action right.
export function PageHeader({
    kicker,
    title,
    children,
    summary,
}: {
    kicker: string;
    title: string;
    children?: ReactNode;
    summary?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1.5">
                    <div className={kickerCls}>{kicker}</div>
                    <h1 className="m-0 text-2xl font-semibold tracking-[-0.01em] text-card-foreground sm:text-display-sm">
                        {title}
                    </h1>
                </div>
                <div className="flex w-full items-center justify-between gap-3.5 sm:w-auto sm:justify-end">
                    <span className="font-mono text-ui-xs font-medium tracking-[0.1em] text-content-faint">
                        {dateStamp()}
                    </span>
                    {children}
                </div>
            </div>
            {summary && <div className="flex flex-wrap items-center gap-4">{summary}</div>}
        </div>
    );
}
