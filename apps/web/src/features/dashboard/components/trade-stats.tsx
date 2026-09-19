'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cardCls, cardMetaLabelCls, G, R } from '@/lib/ui';
import { WinRateDonut } from './win-rate-donut';

import type { TradeStats } from '@/features/trades/lib/trade-stats';
import { MiniBars, MiniLine } from './stat-sparklines';

// One headline stat card: label + top-right chip, big value, two sublines.
function StatCard({
    label,
    chip,
    value,
    valueColor,
    children,
}: {
    label: string;
    chip: string | null;
    value: string;
    valueColor?: string;
    children: React.ReactNode;
}) {
    return (
        <Card className={`${cardCls} @container/card flex flex-col gap-2 px-[22px] py-5`}>
            <div className="flex items-center justify-between gap-2">
                <span className={cardMetaLabelCls}>{label}</span>
                {/* Always rendered so cards without a chip keep the same header height. */}
                <Badge
                    variant="outline"
                    className={`h-auto rounded px-2 py-1.5 font-mono text-ui-xs font-medium tracking-[0.06em] text-muted-foreground ${chip ? '' : 'invisible'}`}
                >
                    {chip ?? '—'}
                </Badge>
            </div>
            <span
                className="text-display-sm leading-none font-semibold"
                style={{ color: valueColor ?? 'var(--card-foreground)' }}
            >
                {value}
            </span>
            <div className="flex flex-col gap-0.5 text-ui-sm">{children}</div>
        </Card>
    );
}

const subCls = 'text-content-faint';

// The four headline cards (Total P&L / Win Rate / Best Trade / Avg R:R).
export function StatCards({ s }: { s: TradeStats }) {
    const netCol = s.netV > 0 ? G : s.netV < 0 ? R : undefined;
    return (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <StatCard label="TOTAL P&L" chip={s.ret} value={s.net} valueColor={netCol}>
                <span style={{ color: netCol ?? 'var(--content-faint)' }}>
                    Avg {s.avgTrade} per trade
                </span>
                <span className={subCls}>{s.count} trades recorded</span>
                {s.count > 0 && s.equityCurve.length > 1 && (
                    <MiniLine
                        values={s.equityCurve}
                        labels={s.equityLabels}
                        unit="money"
                        color={netCol ?? G}
                    />
                )}
            </StatCard>
            <StatCard
                label="WIN RATE"
                chip={s.count ? `${s.wins}W / ${s.losses}L` : null}
                value={s.win}
            >
                {s.count ? (
                    <WinRateDonut wins={s.wins} losses={s.losses} breakevens={s.breakevens} />
                ) : (
                    <span className={subCls}>No trades yet</span>
                )}
            </StatCard>
            <StatCard
                label="BEST TRADE"
                chip={s.bestSym}
                value={s.best}
                valueColor={s.bestSym ? G : undefined}
            >
                <span
                    style={{ color: s.bestSym ? R : undefined }}
                    className={s.bestSym ? '' : subCls}
                >
                    Worst: {s.worst}
                </span>
                <span className={subCls}>{s.count} total trades</span>
                {s.topBars.length > 0 && (
                    <MiniBars values={s.topBars} labels={s.topBarLabels} unit="money" showX />
                )}
            </StatCard>
            <StatCard
                label="AVG R:R"
                chip={s.rCount ? null : 'No data'}
                value={s.rCount ? s.avgR : '— —'}
                valueColor={s.rCount ? (s.avgRPos ? G : R) : undefined}
            >
                <span className={subCls}>PF: {s.pf === '—' ? '—' : `${s.pf}x`}</span>
                <span className={subCls}>{s.rCount} trades with R:R data</span>
                {s.rBars.length > 0 && (
                    <MiniBars
                        values={s.rBars}
                        labels={s.rBarLabels}
                        unit="r"
                        showX
                        colors={s.rBarColors}
                    />
                )}
            </StatCard>
        </div>
    );
}
