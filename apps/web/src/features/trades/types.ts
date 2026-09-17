export interface ApiTrade {
    id: string;
    account_id: string;
    symbol: string;
    side: 'LONG' | 'SHORT';
    entry: string;
    exit: string | null;
    lots: string;
    risk_reward: string | null;
    pnl: string | null;
    created_at: string;
}

export interface CreateTradePayload {
    symbol: string;
    side: 'LONG' | 'SHORT';
    entry: number;
    exit?: number | null;
    lots: number;
    createdAt?: string;
}

export interface UpdateTradePayload extends Partial<Omit<CreateTradePayload, 'exit'>> {
    exit?: number | null;
    rReward?: number | null;
}

export type TradePayload = Omit<CreateTradePayload, 'exit'> & {
    exit?: number | null;
    rReward?: number | null;
};
