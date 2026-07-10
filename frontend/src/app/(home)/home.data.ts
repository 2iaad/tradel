// Demo content for the landing page sections.

export interface Note {
    sym: string;
    side: 'LONG' | 'SHORT';
    pnl: string;
    stats: [string, string, string, string];
    title: string;
    body: string;
    tags: [string, string];
    ts: string;
    green: boolean;
}

export const BACK_NOTE: Note = {
    sym: 'SPY',
    side: 'SHORT',
    pnl: '−$310.25',
    stats: ['IN 618.20', 'OUT 621.30', 'SIZE 100', '−0.8R'],
    title: 'Chased the open without a level',
    body: 'Jumped the gap fill with no plan. Cut it fast — small loss, clean exit. The note is the win.',
    tags: ['fomo', 'gap-fill'],
    ts: 'JUN 30 · 09:33',
    green: false,
};

export const FRONT_NOTE: Note = {
    sym: 'NVDA',
    side: 'LONG',
    pnl: '+$782.40',
    stats: ['IN 128.40', 'OUT 134.92', 'SIZE 120', '+2.1R'],
    title: 'Forced the entry before confirmation',
    body: 'Went in before the retest confirmed. It worked — but it was luck, not process. Flagging this pattern; third time this month.',
    tags: ['discipline', 'momentum'],
    ts: 'JUL 01 · 09:47',
    green: true,
};

// End values the analytics scrub counts up to.
export const YTD_STATS = { pnl: 14382, win: 58.4, pf: 1.92 };

// The three numbered points beside the review heatmap.
export const REVIEW_POINTS = [
    ['01', 'Tag your setups', 'Every pattern you trade, named and tracked.'],
    ['02', 'Spot the leaks', 'The mistakes that repeat — and what they cost.'],
    ['03', 'Replay the day', 'Decision by decision, with your notes beside the tape.'],
] as const;

// Deterministic hash noise in [0,1) — stable demo heatmap across renders.
const rand = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

// June 2026 weekday grid (Mon–Fri × 5 weeks) for the review heatmap.
const DAYS: (number | null)[] = [
    1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30, null, null,
    null,
];

export interface HeatCell {
    day: string;
    bg: string;
    border: string;
    txt: string;
    delay: string;
}

export const HEAT_CELLS: HeatCell[] = DAYS.map((day, i) => {
    const delay = String(400 + i * 22);
    const border = 'rgba(255,255,255,0.05)';
    if (day == null) return { day: '', bg: 'transparent', border: '#14191d', txt: 'transparent', delay };
    const r = rand(day * 3.77);
    const inten = rand(day * 9.13);
    if (r < 0.14)
        return { day: String(day), bg: '#12181c', border, txt: 'rgba(255,255,255,0.28)', delay };
    const bg =
        r < 0.62
            ? `rgba(47,213,127,${(0.14 + 0.42 * inten).toFixed(2)})`
            : `rgba(240,85,78,${(0.13 + 0.33 * inten).toFixed(2)})`;
    return { day: String(day), bg, border, txt: 'rgba(255,255,255,0.6)', delay };
});
