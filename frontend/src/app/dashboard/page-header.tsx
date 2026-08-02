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
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                    <div className={kickerCls}>{kicker}</div>
                    <h1 className="m-0 text-display-sm font-semibold tracking-[-0.01em] text-card-foreground">
                        {title}
                    </h1>
                </div>
                <div className="flex items-center gap-3.5">
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
