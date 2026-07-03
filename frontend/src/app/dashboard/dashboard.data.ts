// Theme greens/reds shared by the dashboard demo data and rows.
export const G = '#2fd57f';
export const R = '#f0554e';

// ponytail: demo data straight from the design — swap for the trades
// API when those endpoints exist.
export const STATS = [
    { label: 'NET P&L · YTD', value: '+$14,382.40', vCol: G, sub: '▲ 4.2% THIS MONTH', sCol: G },
    { label: 'WIN RATE', value: '58.4%', vCol: '#eef4f2', sub: '▲ 2.1PT VS LAST 90D', sCol: G },
    { label: 'PROFIT FACTOR', value: '1.92', vCol: '#eef4f2', sub: '▼ 0.08 VS LAST 90D', sCol: R },
    {
        label: 'TRADES LOGGED',
        value: '127',
        vCol: '#eef4f2',
        sub: '94% WITH NOTES',
        sCol: '#5f6b70',
    },
];

export const TRADES = [
    {
        sym: 'NVDA',
        side: 'LONG',
        entry: '128.40',
        exit: '134.92',
        size: '120',
        r: '+2.1R',
        pnl: '+$782.40',
        win: true,
        date: 'JUL 01',
    },
    {
        sym: 'TSLA',
        side: 'SHORT',
        entry: '243.10',
        exit: '236.55',
        size: '80',
        r: '+1.6R',
        pnl: '+$524.00',
        win: true,
        date: 'JUL 01',
    },
    {
        sym: 'AAPL',
        side: 'LONG',
        entry: '231.20',
        exit: '229.84',
        size: '150',
        r: '-0.7R',
        pnl: '-$204.00',
        win: false,
        date: 'JUN 30',
    },
    {
        sym: 'AMD',
        side: 'LONG',
        entry: '182.66',
        exit: '189.10',
        size: '100',
        r: '+1.9R',
        pnl: '+$644.00',
        win: true,
        date: 'JUN 30',
    },
    {
        sym: 'SPY',
        side: 'SHORT',
        entry: '618.32',
        exit: '620.10',
        size: '40',
        r: '-0.5R',
        pnl: '-$71.20',
        win: false,
        date: 'JUN 27',
    },
    {
        sym: 'BTC',
        side: 'LONG',
        entry: '108,420',
        exit: '112,884',
        size: '0.5',
        r: '+2.4R',
        pnl: '+$2,232.00',
        win: true,
        date: 'JUN 27',
    },
    {
        sym: 'META',
        side: 'LONG',
        entry: '742.15',
        exit: '751.40',
        size: '30',
        r: '+1.1R',
        pnl: '+$277.50',
        win: true,
        date: 'JUN 26',
    },
    {
        sym: 'QQQ',
        side: 'SHORT',
        entry: '554.80',
        exit: '558.65',
        size: '60',
        r: '-0.9R',
        pnl: '-$231.00',
        win: false,
        date: 'JUN 26',
    },
];
export type Trade = (typeof TRADES)[number];

export const NOTES = [
    {
        title: 'Forced the NVDA entry',
        body: 'Went in before the retest confirmed. It worked, but it was luck — flag this pattern.',
        date: 'JUL 01',
        tags: ['discipline', 'momentum'],
    },
    {
        title: 'A+ setup on TSLA short',
        body: 'Waited the full 15 minutes for the failed breakout. Textbook execution, size was right.',
        date: 'JUL 01',
        tags: ['setup', 'short'],
    },
    {
        title: 'Overtraded the open again',
        body: 'Three entries in the first 20 minutes, two were noise. Cap myself at one until 10:00.',
        date: 'JUN 30',
        tags: ['risk', 'review'],
    },
];
export type Note = (typeof NOTES)[number];

export const STEPS = [
    { num: '01', title: 'Create your account', desc: 'Free. Takes under a minute.' },
    { num: '02', title: 'Log your first trade', desc: 'Entry, exit, size — and why you took it.' },
    {
        num: '03',
        title: 'Review your stats',
        desc: 'Win rate, R multiples, and your equity curve.',
    },
];

export const EMPTY_STATS = [
    { label: 'NET P&L', sub: 'AWAITING FIRST TRADE' },
    { label: 'WIN RATE', sub: 'AWAITING FIRST TRADE' },
    { label: 'PROFIT FACTOR', sub: 'AWAITING FIRST TRADE' },
];
