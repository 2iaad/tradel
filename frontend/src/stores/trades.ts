'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
import { buildDemoTrades } from '@/lib/demo-data';
import { useAccountStore } from '@/stores/accounts';
import { useSessionStore } from '@/stores/session';

// Trade row as returned by the trades API (NUMERIC columns arrive as strings).
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

// Body for POST/PATCH trades; mirrors CreateTradeDto/UpdateTradeDto.
export interface TradePayload {
    symbol?: string;
    side?: 'LONG' | 'SHORT';
    entry?: number;
    exit?: number;
    lots?: number;
    rReward?: number;
}

interface TradesStore {
    trades: ApiTrade[];
    loading: boolean;
    error: string | null;
    loadedFor: string | null;
    load: () => Promise<void>;
    fetchTrade: (id: string) => Promise<ApiTrade>;
    saveTrade: (payload: TradePayload, id?: string) => Promise<void>;
    removeTrade: (id: string) => Promise<void>;
}

// Active account id lives in the accounts store; every request is scoped to it.
const activeId = () => useAccountStore.getState().activeId;

function demoPnl(payload: TradePayload): string | null {
    if (payload.entry === undefined || payload.exit === undefined || payload.lots === undefined) {
        return null;
    }
    const direction = payload.side === 'SHORT' ? -1 : 1;
    const multiplier = {
        EURUSD: 100000,
        GBPUSD: 100000,
        XAUUSD: 100,
        NQ: 10,
        ES: 50,
    }[payload.symbol?.toUpperCase() ?? ''] ?? 1;
    return String(
        Math.round(
            (payload.exit - payload.entry) * payload.lots * multiplier * direction * 100,
        ) / 100,
    );
}

export const useTradesStore = create<TradesStore>((set, get) => ({
    trades: [],
    loading: true,
    error: null,
    loadedFor: null,

    // GET /accounts/:activeId/trades. No active account → empty log.
    load: async () => {
        const status = useSessionStore.getState().session.status;
        const accId = activeId();
        if (status === 'demo') {
            if (get().loadedFor === accId) {
                set({ loading: false });
                return;
            }
            set({
                trades: accId ? buildDemoTrades(accId) : [],
                loadedFor: accId,
                loading: false,
                error: null,
            });
            return;
        }
        if (status !== 'user') {
            set({ loading: false });
            return;
        }
        if (!accId) {
            set({ trades: [], loadedFor: null, loading: false });
            return;
        }
        set({ loading: true, error: null });
        try {
            const { data } = await api.get<ApiTrade[]>(`/accounts/${accId}/trades`);
            set({ trades: data, loadedFor: accId });
        } catch (err) {
            set({ error: apiMessage(err) });
        } finally {
            set({ loading: false });
        }
    },

    // GET /accounts/:activeId/trades/:id — one trade by id.
    fetchTrade: async (id) => {
        if (useSessionStore.getState().session.status === 'demo') {
            const trade = get().trades.find((item) => item.id === id);
            if (!trade) throw new Error('Trade not found');
            return trade;
        }
        const accId = activeId();
        if (!accId) throw new Error('No account selected');
        return (await api.get<ApiTrade>(`/accounts/${accId}/trades/${id}`)).data;
    },

    // POST a new trade (or PATCH when id is given), then re-sync the log.
    // Errors propagate to the caller (the form renders them).
    saveTrade: async (payload, id) => {
        const accId = activeId();
        if (!accId) throw new Error('No account selected');
        if (useSessionStore.getState().session.status === 'demo') {
            if (id) {
                set((state) => ({
                    trades: state.trades.map((trade) => {
                        if (trade.id !== id) return trade;
                        const nextPayload = {
                            symbol: payload.symbol ?? trade.symbol,
                            side: payload.side ?? trade.side,
                            entry: payload.entry ?? Number(trade.entry),
                            exit:
                                payload.exit ??
                                (trade.exit === null ? undefined : Number(trade.exit)),
                            lots: payload.lots ?? Number(trade.lots),
                        };
                        return {
                            ...trade,
                            symbol: nextPayload.symbol,
                            side: nextPayload.side,
                            entry: String(nextPayload.entry),
                            exit:
                                nextPayload.exit === undefined ? null : String(nextPayload.exit),
                            lots: String(nextPayload.lots),
                            risk_reward:
                                payload.rReward === undefined
                                    ? trade.risk_reward
                                    : String(payload.rReward),
                            pnl: demoPnl(nextPayload),
                        };
                    }),
                }));
            } else {
                const trade: ApiTrade = {
                    id: `demo-trade-${Date.now()}`,
                    account_id: accId,
                    symbol: payload.symbol ?? 'TRADE',
                    side: payload.side ?? 'LONG',
                    entry: String(payload.entry ?? 0),
                    exit: payload.exit === undefined ? null : String(payload.exit),
                    lots: String(payload.lots ?? 0),
                    risk_reward:
                        payload.rReward === undefined ? null : String(payload.rReward),
                    pnl: demoPnl(payload),
                    created_at: new Date().toISOString(),
                };
                set((state) => ({ trades: [trade, ...state.trades] }));
            }
            return;
        }
        if (id) await api.patch(`/accounts/${accId}/trades/${id}`, payload);
        else await api.post(`/accounts/${accId}/trades`, payload);
        const { data } = await api.get<ApiTrade[]>(`/accounts/${accId}/trades`);
        set({ trades: data });
    },

    // DELETE a trade and drop it from the log.
    removeTrade: async (id) => {
        const accId = activeId();
        if (!accId) return;
        if (useSessionStore.getState().session.status === 'demo') {
            set({ trades: get().trades.filter((trade) => trade.id !== id) });
            return;
        }
        await api.delete(`/accounts/${accId}/trades/${id}`);
        set({ trades: get().trades.filter((t) => t.id !== id) });
    },
}));

// Re-sync the trade log whenever the active account changes.
useAccountStore.subscribe((state, prev) => {
    if (state.activeId !== prev.activeId) useTradesStore.getState().load();
});
