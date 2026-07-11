'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
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
    opened_at: string;
    closed_at: string | null;
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
    openedAt?: string;
    closedAt?: string;
}

interface TradesStore {
    accountId: string | null;
    trades: ApiTrade[];
    loading: boolean;
    error: string | null;
    load: () => Promise<void>;
    fetchTrade: (id: string) => Promise<ApiTrade>;
    saveTrade: (payload: TradePayload, id?: string) => Promise<void>;
    removeTrade: (id: string) => Promise<void>;
}

const base = (accountId: string) => `/accounts/${accountId}/trades`;

// ponytail: single-account journal — uses the user's first account, adds a
// picker when multi-account support lands.
export const useTradesStore = create<TradesStore>((set, get) => ({
    accountId: null,
    trades: [],
    loading: true,
    error: null,

    // GET /accounts (first one) then GET /accounts/:id/trades.
    load: async () => {
        if (useSessionStore.getState().session.status !== 'user') {
            set({ loading: false });
            return;
        }
        set({ loading: true, error: null });
        try {
            const { data: accounts } = await api.get<{ id: string }[]>('/accounts');
            const account = accounts[0];
            if (account) {
                const { data } = await api.get<ApiTrade[]>(base(account.id));
                set({ accountId: account.id, trades: data });
            }
        } catch (err) {
            set({ error: apiMessage(err) });
        } finally {
            set({ loading: false });
        }
    },

    // GET /accounts/:accountId/trades/:id — one trade by id.
    fetchTrade: async (id) => {
        const accId = get().accountId;
        if (!accId) throw new Error('No account yet');
        return (await api.get<ApiTrade>(`${base(accId)}/${id}`)).data;
    },

    // POST a new trade (or PATCH when id is given), then re-sync the log.
    // The very first save lazily POSTs the "Main" account trades hang off.
    // Errors propagate to the caller (the modal renders them).
    saveTrade: async (payload, id) => {
        const accId =
            get().accountId ??
            (await api.post<{ id: string }>('/accounts', { name: 'Main' })).data.id;
        if (id) await api.patch(`${base(accId)}/${id}`, payload);
        else await api.post(base(accId), payload);
        const { data } = await api.get<ApiTrade[]>(base(accId));
        set({ accountId: accId, trades: data });
    },

    // DELETE a trade and drop it from the log.
    removeTrade: async (id) => {
        const accId = get().accountId;
        if (!accId) return;
        await api.delete(`${base(accId)}/${id}`);
        set({ trades: get().trades.filter((t) => t.id !== id) });
    },
}));
