import type { CreateTradePayload } from '@tradel/shared';

export type { ApiTrade, CreateTradePayload, UpdateTradePayload } from '@tradel/shared';

// The trade form handles both creation and updates.
export type TradePayload = Omit<CreateTradePayload, 'exit'> & {
    exit?: number | null;
    rReward?: number | null;
};
