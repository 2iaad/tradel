import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildEquityChartData } from '../src/features/dashboard/lib/equity-chart.ts';
import { toTradeLogRow } from '../src/features/trades/lib/trade-log-row.ts';
import { computeTradeStats } from '../src/features/trades/lib/trade-stats.ts';

function trade(id, pnl, createdAt, riskReward = null) {
    return {
        id,
        account_id: 'account-one',
        symbol: 'EURUSD',
        side: 'LONG',
        entry: '1.10',
        exit: pnl === null ? null : '1.11',
        lots: '1',
        pnl,
        risk_reward: riskReward,
        created_at: createdAt,
    };
}

test('empty trade history keeps the starting equity and empty display values', () => {
    const stats = computeTradeStats([], 10000);
    assert.deepEqual(stats.equityCurve, [10000]);
    assert.equal(stats.count, 0);
    assert.equal(stats.win, '—');
    assert.equal(stats.best, '—');
    assert.equal(stats.avgR, '—');
    assert.equal(stats.netV, 0);
});

test('trade rows preserve missing results and numeric precision', () => {
    const open = toTradeLogRow(trade('open', null, '2026-09-01T12:00:00Z'));
    const closed = toTradeLogRow(trade('closed', '-12.75', '2026-09-02T12:00:00Z', '-0.51'));
    assert.equal(open.pnlv, null);
    assert.equal(open.rv, null);
    assert.equal(closed.pnlv, -12.75);
    assert.equal(closed.rv, -0.51);
    assert.equal(closed.ts, Date.parse('2026-09-02T12:00:00Z'));
});

test('stats retain current open, breakeven, and chronological equity behavior', () => {
    const rows = [
        trade('loss', '-50', '2026-09-03T12:00:00Z', '-1'),
        trade('win', '100', '2026-09-01T12:00:00Z', '2'),
        trade('open', null, '2026-09-04T12:00:00Z'),
        trade('flat', '0', '2026-09-02T12:00:00Z', '0'),
    ].map(toTradeLogRow);
    const originalOrder = rows.map((row) => row.id);
    const stats = computeTradeStats(rows, 1000);
    assert.equal(stats.netV, 50);
    assert.equal(stats.wins, 1);
    assert.equal(stats.losses, 1);
    assert.equal(stats.breakevens, 1);
    // Preserve the existing denominator, which includes open trades.
    assert.equal(stats.winPctV, 25);
    assert.equal(stats.ret, '+5.0%');
    assert.equal(stats.avgR, '+0.33R');
    assert.deepEqual(stats.equityCurve, [1000, 1100, 1100, 1050]);
    assert.deepEqual(
        rows.map((row) => row.id),
        originalOrder,
    );
});

test('equity excludes invalid and open trades and groups daily profit and loss', () => {
    const trades = [
        trade('loss', '-150', '2026-09-02T12:00:00Z'),
        trade('win', '100', '2026-09-01T12:00:00Z'),
        trade('recovery', '25', '2026-09-02T12:30:00Z'),
        trade('open', null, '2026-09-03T12:00:00Z'),
        trade('invalid-pnl', 'invalid', '2026-09-03T12:00:00Z'),
        trade('invalid-date', '100', 'invalid'),
    ];
    const data = buildEquityChartData(trades);
    assert.deepEqual(
        data.tradePoints.map((point) => point.cumulative),
        [100, -50, -25],
    );
    assert.deepEqual(
        data.dailyPoints.map((point) => point.pnl),
        [100, -125],
    );
    assert.equal(data.net, -25);
    assert.equal(data.deepestDip, -150);
    assert.equal(data.peak, 100);
    assert.equal(data.greenDays, 1);
    assert.equal(data.redDays, 1);
    assert.equal(data.gradientOffset, 2 / 3);
    assert.equal(trades[0].id, 'loss');
});
