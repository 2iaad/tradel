export const TRADE_SIDES = ['LONG', 'SHORT'] as const;

export type TradeSide = (typeof TRADE_SIDES)[number];

// JSON response shape: decimal values and dates are sent as strings.
export interface ApiTrade {
    id: string;
    account_id: string;
    symbol: string;
    side: TradeSide;
    entry: string;
    exit: string | null;
    lots: string;
    risk_reward: string | null;
    pnl: string | null;
    created_at: string;
}

export interface CreateTradePayload {
    symbol: string;
    side: TradeSide;
    entry: number;
    exit?: number | null;
    lots: number;
    createdAt?: string;
}

export interface UpdateTradePayload extends Partial<CreateTradePayload> {
    // Risk/reward can only be supplied when updating a trade.
    rReward?: number | null;
}
