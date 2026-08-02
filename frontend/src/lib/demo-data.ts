import type { Account } from '@/stores/accounts';
import type { BreakdownEntry, Summary } from '@/stores/analytics';
import type { CalendarDay } from '@/stores/calendar';
import type { ApiNote } from '@/stores/notes';
import type { ApiTrade } from '@/stores/trades';

export const DEMO_ACCOUNT_ID = 'demo-account-main';

export const DEMO_ACCOUNT: Account = {
    id: DEMO_ACCOUNT_ID,
    name: 'Demo Portfolio',
    broker: 'Tradel Markets',
    currency: 'USD',
    starting_balance: '25000',
};

type DemoTradeSeed = Omit<ApiTrade, 'id' | 'account_id' | 'created_at'> & {
    daysAgo: number;
};

const TRADE_SEEDS: DemoTradeSeed[] = [
    { daysAgo: 0, symbol: 'NQ', side: 'LONG', entry: '21342.25', exit: '21403.25', lots: '1', risk_reward: '2.10', pnl: '610' },
    { daysAgo: 1, symbol: 'EURUSD', side: 'SHORT', entry: '1.0872', exit: '1.0816', lots: '1', risk_reward: '2.25', pnl: '560' },
    { daysAgo: 2, symbol: 'AAPL', side: 'LONG', entry: '221.40', exit: '220.50', lots: '100', risk_reward: '-0.45', pnl: '-90' },
    { daysAgo: 3, symbol: 'XAUUSD', side: 'LONG', entry: '2378.40', exit: '2386.80', lots: '0.5', risk_reward: '1.60', pnl: '420' },
    { daysAgo: 4, symbol: 'ES', side: 'SHORT', entry: '6074.50', exit: '6066.90', lots: '1', risk_reward: '1.90', pnl: '380' },
    { daysAgo: 6, symbol: 'NVDA', side: 'LONG', entry: '164.20', exit: '169.30', lots: '100', risk_reward: '2.55', pnl: '510' },
    { daysAgo: 8, symbol: 'GBPUSD', side: 'LONG', entry: '1.2710', exit: '1.2710', lots: '1', risk_reward: '0', pnl: '0' },
    { daysAgo: 10, symbol: 'BTCUSD', side: 'SHORT', entry: '118400', exit: '119600', lots: '0.1', risk_reward: '-0.60', pnl: '-120' },
    { daysAgo: 12, symbol: 'NQ', side: 'LONG', entry: '21188.50', exit: '21233.50', lots: '1', risk_reward: '1.82', pnl: '450' },
    { daysAgo: 14, symbol: 'TSLA', side: 'SHORT', entry: '329.80', exit: '326.60', lots: '100', risk_reward: '1.60', pnl: '320' },
    { daysAgo: 16, symbol: 'EURUSD', side: 'LONG', entry: '1.0804', exit: '1.0786', lots: '1', risk_reward: '-0.90', pnl: '-180' },
    { daysAgo: 18, symbol: 'ES', side: 'LONG', entry: '6021.25', exit: '6026.05', lots: '1', risk_reward: '1.20', pnl: '240' },
    { daysAgo: 20, symbol: 'XAUUSD', side: 'SHORT', entry: '2404.10', exit: '2404.10', lots: '0.5', risk_reward: '0', pnl: '0' },
    { daysAgo: 22, symbol: 'MSFT', side: 'LONG', entry: '497.20', exit: '494.30', lots: '100', risk_reward: '-1.00', pnl: '-290' },
    { daysAgo: 24, symbol: 'NQ', side: 'SHORT', entry: '20940.00', exit: '20922.00', lots: '1', risk_reward: '0.90', pnl: '180' },
    { daysAgo: 27, symbol: 'ETHUSD', side: 'LONG', entry: '3610', exit: '3542', lots: '5', risk_reward: '-1.36', pnl: '-340' },
    { daysAgo: 29, symbol: 'AAPL', side: 'LONG', entry: '212.10', exit: '206.90', lots: '100', risk_reward: '-2.60', pnl: '-520' },
    { daysAgo: 32, symbol: 'GBPUSD', side: 'SHORT', entry: '1.2844', exit: '1.2844', lots: '1', risk_reward: '0', pnl: '0' },
    { daysAgo: 35, symbol: 'ES', side: 'LONG', entry: '5960.00', exit: '5950.80', lots: '1', risk_reward: '-1.84', pnl: '-460' },
    { daysAgo: 38, symbol: 'NVDA', side: 'SHORT', entry: '158.40', exit: '162.20', lots: '100', risk_reward: '-1.52', pnl: '-380' },
    { daysAgo: 42, symbol: 'NQ', side: 'LONG', entry: '20721.00', exit: '20762.00', lots: '1', risk_reward: '2.05', pnl: '410' },
    { daysAgo: 46, symbol: 'EURUSD', side: 'SHORT', entry: '1.0910', exit: '1.0926', lots: '1', risk_reward: '-0.80', pnl: '-160' },
    { daysAgo: 50, symbol: 'TSLA', side: 'LONG', entry: '311.20', exit: '314.00', lots: '100', risk_reward: '1.40', pnl: '280' },
    { daysAgo: 54, symbol: 'XAUUSD', side: 'LONG', entry: '2340.10', exit: '2347.10', lots: '0.5', risk_reward: '1.75', pnl: '350' },
    { daysAgo: 58, symbol: 'BTCUSD', side: 'LONG', entry: '105400', exit: '103500', lots: '0.1', risk_reward: '-0.76', pnl: '-190' },
    { daysAgo: 63, symbol: 'MSFT', side: 'SHORT', entry: '481.45', exit: '478.85', lots: '100', risk_reward: '1.30', pnl: '260' },
    { daysAgo: 68, symbol: 'ES', side: 'LONG', entry: '5892.00', exit: '5900.60', lots: '1', risk_reward: '2.15', pnl: '430' },
    { daysAgo: 73, symbol: 'ETHUSD', side: 'SHORT', entry: '3442', exit: '3470', lots: '5', risk_reward: '-1.12', pnl: '-140' },
    { daysAgo: 79, symbol: 'NQ', side: 'LONG', entry: '20210.00', exit: '20241.00', lots: '1', risk_reward: '1.55', pnl: '310' },
    { daysAgo: 86, symbol: 'AAPL', side: 'SHORT', entry: '205.80', exit: '203.60', lots: '100', risk_reward: '1.47', pnl: '220' },
];

function demoTimestamp(daysAgo: number, index: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(9 + (index % 7), 12 + ((index * 7) % 43), 0, 0);
    return date.toISOString();
}

export function buildDemoTrades(accountId = DEMO_ACCOUNT_ID): ApiTrade[] {
    if (accountId !== DEMO_ACCOUNT_ID) return [];

    return TRADE_SEEDS.map(({ daysAgo, ...trade }, index) => ({
        ...trade,
        id: `demo-trade-${index + 1}`,
        account_id: accountId,
        created_at: demoTimestamp(daysAgo, index),
    }));
}

export function buildDemoNotes(trades: ApiTrade[]): ApiNote[] {
    const noteSeeds = [
        { trade: 0, title: 'Waited for the opening range', body: 'Took the breakout only after the retest held. Good patience and clean invalidation.', tags: ['BREAKOUT', 'DISCIPLINE'] },
        { trade: 2, title: 'Daily support reclaim', body: 'Strong relative strength after the first pullback. Entry was planned; exit followed the target.', tags: ['REVERSAL', 'A-SETUP'] },
        { trade: 5, title: 'Trend continuation', body: 'Momentum stayed intact above VWAP. Sized normally and avoided adding into extension.', tags: ['MOMENTUM', 'RISK'] },
        { trade: 9, title: 'Entered before confirmation', body: 'The short thesis was reasonable, but the trigger was early. Wait for structure to break next time.', tags: ['REVIEW', 'PATIENCE'] },
        { trade: 12, title: 'Clean rejection at resistance', body: 'Price rejected the level twice and order flow confirmed the short. Managed without interference.', tags: ['A-SETUP', 'DISCIPLINE'] },
        { trade: 20, title: 'Best execution this month', body: 'Clear pre-market level, defined risk, and no emotional management after entry.', tags: ['BREAKOUT', 'PROCESS'] },
    ];

    return noteSeeds.flatMap((seed, index) => {
        const trade = trades[seed.trade];
        if (!trade) return [];
        return [{
            id: `demo-note-${index + 1}`,
            account_id: trade.account_id,
            trade_id: trade.id,
            title: seed.title,
            body: seed.body,
            tags: seed.tags,
            created_at: trade.created_at,
        }];
    });
}

function breakdown(trades: ApiTrade[], key: 'symbol' | 'side'): BreakdownEntry[] {
    const groups = new Map<string, { net: number; wins: number; count: number }>();
    for (const trade of trades) {
        const label = trade[key];
        const pnl = trade.pnl === null ? 0 : Number(trade.pnl);
        const group = groups.get(label) ?? { net: 0, wins: 0, count: 0 };
        group.net += pnl;
        group.wins += pnl > 0 ? 1 : 0;
        group.count += 1;
        groups.set(label, group);
    }

    return [...groups.entries()]
        .map(([label, group]) => ({
            label,
            ...group,
            winRate: group.count ? (group.wins / group.count) * 100 : null,
        }))
        .sort((a, b) => b.count - a.count || b.net - a.net);
}

export function buildDemoAnalytics(trades: ApiTrade[]): {
    summary: Summary;
    bySymbol: BreakdownEntry[];
    bySide: BreakdownEntry[];
} {
    const closed = trades.filter((trade) => trade.pnl !== null);
    const pnls = closed.map((trade) => Number(trade.pnl));
    const wins = pnls.filter((pnl) => pnl > 0);
    const losses = pnls.filter((pnl) => pnl < 0);
    const grossProfit = wins.reduce((sum, pnl) => sum + pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, pnl) => sum + pnl, 0));
    const net = pnls.reduce((sum, pnl) => sum + pnl, 0);
    const rValues = closed
        .map((trade) => trade.risk_reward)
        .filter((value): value is string => value !== null)
        .map(Number);

    return {
        summary: {
            closed: closed.length,
            open: trades.length - closed.length,
            wins: wins.length,
            losses: losses.length,
            net,
            winRate: closed.length ? (wins.length / closed.length) * 100 : null,
            profitFactor: grossLoss ? grossProfit / grossLoss : null,
            expectancy: closed.length ? net / closed.length : null,
            avgR: rValues.length
                ? rValues.reduce((sum, value) => sum + value, 0) / rValues.length
                : null,
        },
        bySymbol: breakdown(trades, 'symbol'),
        bySide: breakdown(trades, 'side'),
    };
}

function localDayKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

export function buildDemoCalendar(trades: ApiTrade[], month: string): CalendarDay[] {
    const groups = new Map<string, CalendarDay>();
    for (const trade of trades) {
        const date = localDayKey(new Date(trade.created_at));
        if (!date.startsWith(month)) continue;
        const pnl = trade.pnl === null ? null : Number(trade.pnl);
        const day = groups.get(date) ?? { date, pnl: 0, trades: 0, items: [] };
        day.pnl += pnl ?? 0;
        day.trades += 1;
        day.items.push({ symbol: trade.symbol, pnl });
        groups.set(date, day);
    }

    return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
}
