import { kickerCls } from '@/lib/ui';
import { dateStamp } from '@/lib/format';

// Dashboard page header: kicker + title left, date stamp + action right.
export function PageHeader({
    kicker,
    title,
    children,
}: {
    kicker: string;
    title: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
                <div className={kickerCls}>{kicker}</div>
                <h1 className="m-0 text-[26px] font-semibold tracking-[-0.01em] text-[#eef4f2]">
                    {title}
                </h1>
            </div>
            <div className="flex items-center gap-3.5">
                <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-[#5f6b70]">
                    {dateStamp()}
                </span>
                {children}
            </div>
        </div>
    );
}
