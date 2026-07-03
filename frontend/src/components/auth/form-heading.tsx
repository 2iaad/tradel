import { kickerCls } from '@/lib/ui';

// Kicker + title block that opens each auth form.
export function FormHeading({ kicker, title }: { kicker: string; title: string }) {
    return (
        <div className="mb-2">
            <div className={`${kickerCls} mb-3`}>{kicker}</div>
            <h2 className="m-0 text-[30px] font-semibold tracking-[-0.01em] text-[#eef4f2]">
                {title}
            </h2>
        </div>
    );
}
