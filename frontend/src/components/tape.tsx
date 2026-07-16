// Demo ticker symbols for the scrolling tapes.
export const TOP_TICKS = [
    ['AAPL', 1.24],
    ['NVDA', -0.86],
    ['TSLA', 2.31],
    ['SPY', 0.42],
    ['BTC', -1.12],
    ['ETH', 0.77],
    ['MSFT', -0.22],
    ['AMD', 1.92],
] as const;

export const BOTTOM_TICKS = [
    ['GOOG', 0.58],
    ['META', -0.44],
    ['QQQ', 0.31],
    ['AMZN', 0.35],
    ['SOL', -2.05],
    ['GLD', 0.19],
    ['OIL', -0.63],
    ['DXY', 0.08],
] as const;

type Ticks = readonly (readonly [string, number])[];

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
