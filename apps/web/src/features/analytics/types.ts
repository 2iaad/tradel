export interface Summary {
    closed: number;
    open: number;
    wins: number;
    losses: number;
    net: number;
    winRate: number | null;
    profitFactor: number | null;
    expectancy: number | null;
    avgR: number | null;
}

export interface BreakdownEntry {
    label: string;
    net: number;
    wins: number;
    count: number;
    winRate: number | null;
}
