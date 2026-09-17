'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
import { buildDemoAnalytics } from '@/lib/demo-data';
import { useAccountStore } from './accounts';
import { useSessionStore } from './session';
import { useTradesStore } from './trades';

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

interface AnalyticsContext {
    accountId: string;
    key: string;
    demo: boolean;
}

interface AnalyticsStore {
    summary: Summary | null;
    bySymbol: BreakdownEntry[];
    bySide: BreakdownEntry[];
    loading: boolean;
    loadError: string | null;
    loadedFor: string | null;
    stale: boolean;
    load: () => Promise<void>;
}

let requestVersion = 0;
let loadRequest: { key: string; promise: Promise<void> } | null = null;

function currentContext(): AnalyticsContext | null {
    const session = useSessionStore.getState().session;
    const accountId = useAccountStore.getState().activeId;
    if (!accountId || (session.status !== 'user' && session.status !== 'demo')) return null;
    const owner = session.status === 'user' ? session.id : 'demo';
    return { accountId, key: `${owner}:${accountId}`, demo: session.status === 'demo' };
}

export const useAnalyticsStore = create<AnalyticsStore>()((set, get) => ({
    summary: null,
    bySymbol: [],
    bySide: [],
    loading: true,
    loadError: null,
    loadedFor: null,
    stale: true,

    load: () => {
        const context = currentContext();
        if (!context) {
            ++requestVersion;
            loadRequest = null;
            set({
                summary: null,
                bySymbol: [],
                bySide: [],
                loading: false,
                loadError: null,
                loadedFor: null,
                stale: true,
            });
            return Promise.resolve();
        }
        if (loadRequest?.key === context.key) return loadRequest.promise;
        if (get().loadedFor === context.key && !get().stale && !get().loadError) {
            return Promise.resolve();
        }

        if (context.demo) {
            const trades = useTradesStore
                .getState()
                .trades.filter((trade) => trade.account_id === context.accountId);
            set({
                ...buildDemoAnalytics(trades),
                loading: false,
                loadError: null,
                loadedFor: context.key,
                stale: false,
            });
            return Promise.resolve();
        }

        const version = ++requestVersion;
        const keepCurrentData = get().loadedFor === context.key;
        set({
            ...(keepCurrentData ? {} : { summary: null, bySymbol: [], bySide: [] }),
            loading: true,
            loadError: null,
        });
        const request = (async () => {
            try {
                const base = `/accounts/${context.accountId}/analytics`;
                const [summary, bySymbol, bySide] = await Promise.all([
                    api.get<Summary>(`${base}/summary`),
                    api.get<BreakdownEntry[]>(`${base}/breakdown?by=symbol`),
                    api.get<BreakdownEntry[]>(`${base}/breakdown?by=side`),
                ]);
                if (version !== requestVersion || currentContext()?.key !== context.key) return;
                set({
                    summary: summary.data,
                    bySymbol: bySymbol.data,
                    bySide: bySide.data,
                    loadedFor: context.key,
                    stale: false,
                });
            } catch (error) {
                if (version === requestVersion && currentContext()?.key === context.key) {
                    set({ loadError: apiMessage(error) });
                }
            } finally {
                if (version === requestVersion && currentContext()?.key === context.key) {
                    loadRequest = null;
                    set({ loading: false });
                }
            }
        })();
        loadRequest = { key: context.key, promise: request };
        return request;
    },
}));

useAccountStore.subscribe((state, previousState) => {
    if (state.activeId === previousState.activeId) return;
    ++requestVersion;
    loadRequest = null;
    useAnalyticsStore.setState({
        summary: null,
        bySymbol: [],
        bySide: [],
        loading: state.activeId !== null,
        loadError: null,
        loadedFor: null,
        stale: true,
    });
});

useTradesStore.subscribe((state, previousState) => {
    if (state.trades === previousState.trades) return;
    const context = currentContext();
    if (!context || state.loadedFor !== context.key || previousState.loadedFor !== context.key) {
        return;
    }
    const analytics = useAnalyticsStore.getState();
    if (analytics.loadedFor !== context.key && loadRequest?.key !== context.key) return;
    ++requestVersion;
    loadRequest = null;
    useAnalyticsStore.setState({ loading: false, loadError: null, stale: true });
});
