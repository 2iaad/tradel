'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
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
    size: string;
    r: string | null;
    pnl: string | null;
    created_at: string;
}

// Body for POST/PATCH trades; mirrors CreateTradeDto/UpdateTradeDto.
export interface TradePayload {
    symbol?: string;
    side?: 'LONG' | 'SHORT';
    entry?: number;
    exit?: number;
    size?: number;
    r?: number;
}

interface TradesStore {
    trades: ApiTrade[];
    loading: boolean;
    error: string | null;
    load: () => Promise<void>;
    fetchTrade: (id: string) => Promise<ApiTrade>;
    saveTrade: (payload: TradePayload, id?: string) => Promise<void>;
    removeTrade: (id: string) => Promise<void>;
}

// Active account id lives in the accounts store; every request is scoped to it.
const activeId = () => useAccountStore.getState().activeId;

export const useTradesStore = create<TradesStore>((set, get) => ({
    trades: [],
    loading: true,
    error: null,

    // GET /accounts/:activeId/trades. No active account → empty log.
    load: async () => {
        if (useSessionStore.getState().session.status !== 'user') {
            set({ loading: false });
            return;
        }
        const accId = activeId();
        if (!accId) {
            set({ trades: [], loading: false });
            return;
        }
        set({ loading: true, error: null });
        try {
            const { data } = await api.get<ApiTrade[]>(`/accounts/${accId}/trades`);
            set({ trades: data });
        } catch (err) {
            set({ error: apiMessage(err) });
        } finally {
            set({ loading: false });
        }
    },

    // GET /accounts/:activeId/trades/:id — one trade by id.
    fetchTrade: async (id) => {
        const accId = activeId();
        if (!accId) throw new Error('No account selected');
        return (await api.get<ApiTrade>(`/accounts/${accId}/trades/${id}`)).data;
    },

    // POST a new trade (or PATCH when id is given), then re-sync the log.
    // Errors propagate to the caller (the form renders them).
    saveTrade: async (payload, id) => {
        const accId = activeId();
        if (!accId) throw new Error('No account selected');
        if (id) await api.patch(`/accounts/${accId}/trades/${id}`, payload);
        else await api.post(`/accounts/${accId}/trades`, payload);
        const { data } = await api.get<ApiTrade[]>(`/accounts/${accId}/trades`);
        set({ trades: data });
    },

    // DELETE a trade and drop it from the log.
    removeTrade: async (id) => {
        const accId = activeId();
        if (!accId) return;
        await api.delete(`/accounts/${accId}/trades/${id}`);
        set({ trades: get().trades.filter((t) => t.id !== id) });
    },
}));

// Re-sync the trade log whenever the active account changes.
useAccountStore.subscribe((state, prev) => {
    if (state.activeId !== prev.activeId) useTradesStore.getState().load();
});
