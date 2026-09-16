'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
import { buildDemoTrades } from '@/lib/demo-data';
import { useAccountStore } from '@/stores/accounts';
import { useSessionStore } from '@/stores/session';

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
}

export interface UpdateTradePayload extends Partial<Omit<CreateTradePayload, 'exit'>> {
    exit?: number | null;
    rReward?: number | null;
}

export type TradePayload = Omit<CreateTradePayload, 'exit'> & {
    exit?: number | null;
    rReward?: number | null;
};

type TradeMutation =
    { type: 'create' } | { type: 'update'; id: string } | { type: 'delete'; id: string };

interface TradeContext {
    accountId: string;
    key: string;
    demo: boolean;
}

interface TradesStore {
    trades: ApiTrade[];
    loading: boolean;
    loadError: string | null;
    loadedFor: string | null;
    pendingMutation: TradeMutation | null;
    load: () => Promise<void>;
    create: (payload: CreateTradePayload) => Promise<ApiTrade>;
    update: (id: string, payload: UpdateTradePayload) => Promise<ApiTrade>;
    remove: (id: string) => Promise<void>;
}

let requestVersion = 0;
let demoTradeSequence = 0;
let loadRequest: { key: string; promise: Promise<void> } | null = null;
let mutationRequest: Promise<unknown> | null = null;

function currentContext(): TradeContext | null {
    const session = useSessionStore.getState().session;
    const accountId = useAccountStore.getState().activeId;
    if (!accountId || (session.status !== 'user' && session.status !== 'demo')) return null;
    const owner = session.status === 'user' ? session.id : 'demo';
    return { accountId, key: `${owner}:${accountId}`, demo: session.status === 'demo' };
}

function requireContext(): TradeContext {
    const context = currentContext();
    if (!context) throw new Error('Create or select an account before managing trades');
    return context;
}

function demoPnl(payload: {
    symbol?: string;
    side?: 'LONG' | 'SHORT';
    entry?: number;
    exit?: number | null;
    lots?: number;
}): string | null {
    if (
        payload.entry === undefined ||
        payload.exit === undefined ||
        payload.exit === null ||
        payload.lots === undefined
    ) {
        return null;
    }
    const direction = payload.side === 'SHORT' ? -1 : 1;
    const multiplier =
        {
            EURUSD: 100000,
            GBPUSD: 100000,
            XAUUSD: 100,
            NQ: 10,
            ES: 50,
        }[payload.symbol?.toUpperCase() ?? ''] ?? 1;
    return String(
        Math.round((payload.exit - payload.entry) * payload.lots * multiplier * direction * 100) /
            100,
    );
}

function createDemoTrade(accountId: string, payload: CreateTradePayload): ApiTrade {
    return {
        id: `demo-trade-${Date.now()}-${++demoTradeSequence}`,
        account_id: accountId,
        symbol: payload.symbol,
        side: payload.side,
        entry: String(payload.entry),
        exit: payload.exit == null ? null : String(payload.exit),
        lots: String(payload.lots),
        risk_reward: null,
        pnl: demoPnl(payload),
        created_at: new Date().toISOString(),
    };
}

function updateDemoTrade(trade: ApiTrade, payload: UpdateTradePayload): ApiTrade {
    const next = {
        symbol: payload.symbol ?? trade.symbol,
        side: payload.side ?? trade.side,
        entry: payload.entry ?? Number(trade.entry),
        exit:
            payload.exit === undefined
                ? trade.exit === null
                    ? null
                    : Number(trade.exit)
                : payload.exit,
        lots: payload.lots ?? Number(trade.lots),
    };
    return {
        ...trade,
        symbol: next.symbol,
        side: next.side,
        entry: String(next.entry),
        exit: next.exit === null ? null : String(next.exit),
        lots: String(next.lots),
        risk_reward:
            payload.rReward === undefined
                ? trade.risk_reward
                : payload.rReward === null
                  ? null
                  : String(payload.rReward),
        pnl: demoPnl(next),
    };
}

export const useTradesStore = create<TradesStore>()((set, get) => {
    function startMutation(mutation: TradeMutation, context: TradeContext) {
        if (mutationRequest) throw new Error('Please wait for the current trade action');
        if (get().loading || get().loadedFor !== context.key) {
            throw new Error('Wait for the trades to finish loading');
        }
        const version = ++requestVersion;
        loadRequest = null;
        set({ pendingMutation: mutation });
        return version;
    }

    function finishMutation(request: Promise<unknown>) {
        if (mutationRequest !== request) return;
        mutationRequest = null;
        set({ pendingMutation: null });
    }

    function contextStillMatches(context: TradeContext, version: number) {
        return version === requestVersion && currentContext()?.key === context.key;
    }

    return {
        trades: [],
        loading: true,
        loadError: null,
        loadedFor: null,
        pendingMutation: null,

        load: () => {
            const context = currentContext();
            if (!context) {
                ++requestVersion;
                loadRequest = null;
                set({
                    trades: [],
                    loading: false,
                    loadError: null,
                    loadedFor: null,
                });
                return Promise.resolve();
            }
            if (get().loadedFor === context.key && !get().loadError) return Promise.resolve();
            if (loadRequest?.key === context.key) return loadRequest.promise;
            if (mutationRequest) return Promise.resolve();

            if (context.demo) {
                set({
                    trades: buildDemoTrades(context.accountId),
                    loadedFor: context.key,
                    loading: false,
                    loadError: null,
                });
                return Promise.resolve();
            }

            const version = ++requestVersion;
            set((state) => ({
                trades: state.loadedFor === context.key ? state.trades : [],
                loadedFor: state.loadedFor === context.key ? state.loadedFor : null,
                loading: true,
                loadError: null,
            }));
            const request = (async () => {
                try {
                    const { data } = await api.get<ApiTrade[]>(
                        `/accounts/${context.accountId}/trades`,
                    );
                    if (!contextStillMatches(context, version)) return;
                    set({ trades: data, loadedFor: context.key });
                } catch (error) {
                    if (contextStillMatches(context, version)) {
                        set({ loadError: apiMessage(error) });
                    }
                } finally {
                    if (contextStillMatches(context, version)) {
                        loadRequest = null;
                        set({ loading: false });
                    }
                }
            })();
            loadRequest = { key: context.key, promise: request };
            return request;
        },

        create: (payload) => {
            const context = requireContext();
            let version: number;
            try {
                version = startMutation({ type: 'create' }, context);
            } catch (error) {
                return Promise.reject(error);
            }

            const request = (async () => {
                const trade = context.demo
                    ? createDemoTrade(context.accountId, payload)
                    : (await api.post<ApiTrade>(`/accounts/${context.accountId}/trades`, payload))
                          .data;
                if (!contextStillMatches(context, version)) {
                    throw new Error('Trade account changed. Please try again.');
                }
                set((state) => ({ trades: [trade, ...state.trades], loadError: null }));
                return trade;
            })();
            mutationRequest = request;
            return request.finally(() => finishMutation(request));
        },

        update: (id, payload) => {
            const context = requireContext();
            let version: number;
            try {
                version = startMutation({ type: 'update', id }, context);
            } catch (error) {
                return Promise.reject(error);
            }

            const request = (async () => {
                const current = get().trades.find((trade) => trade.id === id);
                if (!current) throw new Error('Trade not found');
                const trade = context.demo
                    ? updateDemoTrade(current, payload)
                    : (
                          await api.patch<ApiTrade>(
                              `/accounts/${context.accountId}/trades/${id}`,
                              payload,
                          )
                      ).data;
                if (!contextStillMatches(context, version)) {
                    throw new Error('Trade account changed. Please try again.');
                }
                set((state) => ({
                    trades: state.trades.map((item) => (item.id === id ? trade : item)),
                }));
                return trade;
            })();
            mutationRequest = request;
            return request.finally(() => finishMutation(request));
        },

        remove: (id) => {
            const context = requireContext();
            let version: number;
            try {
                version = startMutation({ type: 'delete', id }, context);
            } catch (error) {
                return Promise.reject(error);
            }

            const request = (async () => {
                if (!get().trades.some((trade) => trade.id === id)) {
                    throw new Error('Trade not found');
                }
                if (!context.demo) {
                    await api.delete(`/accounts/${context.accountId}/trades/${id}`);
                }
                if (!contextStillMatches(context, version)) {
                    throw new Error('Trade account changed. Please try again.');
                }
                set((state) => ({ trades: state.trades.filter((trade) => trade.id !== id) }));
            })();
            mutationRequest = request;
            return request.finally(() => finishMutation(request));
        },
    };
});

useAccountStore.subscribe((state, previousState) => {
    if (state.activeId === previousState.activeId) return;
    ++requestVersion;
    loadRequest = null;
    mutationRequest = null;
    useTradesStore.setState({
        trades: [],
        loading: state.activeId !== null,
        loadError: null,
        loadedFor: null,
        pendingMutation: null,
    });
    if (state.activeId) void useTradesStore.getState().load();
});
