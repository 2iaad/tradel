import { Ticks } from './tape.data';

export { TOP_TICKS, BOTTOM_TICKS } from './tape.data';

// One run of tickers; rendered twice for the seamless loop.
function TickRow({ items }: { items: Ticks }) {
    return (
        <div className="flex items-center">
            {items.map(([sym, pct]) => (
                <span
                    key={sym}
                    className="inline-flex gap-2 px-6 font-mono text-[12.5px] font-medium text-[#78878a] whitespace-nowrap"
                >
                    {sym}
                    <span className={pct >= 0 ? 'text-[#2fd57f]' : 'text-[#f0554e]'}>
                        {pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
                    </span>
                </span>
            ))}
        </div>
    );
}

// Infinitely scrolling ticker tape.
export function Tape({
    items,
    duration,
    reverse,
    className,
}: {
    items: Ticks;
    duration: string;
    reverse?: boolean;
    className?: string;
}) {
    return (
        <div className={`overflow-hidden flex items-center ${className ?? ''}`}>
            <div
                className="flex w-max"
                style={{
                    animation: `tradelTape ${duration} linear infinite${reverse ? ' reverse' : ''}`,
                }}
            >
                <TickRow items={items} />
                <TickRow items={items} />
            </div>
        </div>
    );
}
