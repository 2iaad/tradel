export interface CalendarTrade {
    symbol: string;
    pnl: number | null;
}

export interface CalendarDay {
    date: string;
    pnl: number;
    trades: number;
    items: CalendarTrade[];
}
