'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
import { useAccountStore } from '@/stores/accounts';
import { useSessionStore } from '@/stores/session';

// Mirrors AnalyticsSummary from the backend. Ratio fields are null when
// undefined (no closed trades / no losses) → render "—", never NaN.
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

interface AnalyticsStore {
    summary: Summary | null;
    bySymbol: BreakdownEntry[];
    bySide: BreakdownEntry[];
    loading: boolean;
    error: string | null;
    load: () => Promise<void>;
}

const activeId = () => useAccountStore.getState().activeId;

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
    summary: null,
    bySymbol: [],
    bySide: [],
    loading: true,
    error: null,

    // Fetch summary + both breakdowns for the active account in parallel.
    load: async () => {
        if (useSessionStore.getState().session.status !== 'user') {
            set({ loading: false });
            return;
        }
        const accId = activeId();
        if (!accId) {
            set({ summary: null, bySymbol: [], bySide: [], loading: false });
            return;
        }
        set({ loading: true, error: null });
        try {
            const base = `/accounts/${accId}/analytics`;
            const [summary, bySymbol, bySide] = await Promise.all([
                api.get<Summary>(`${base}/summary`),
                api.get<BreakdownEntry[]>(`${base}/breakdown?by=symbol`),
                api.get<BreakdownEntry[]>(`${base}/breakdown?by=side`),
            ]);
            set({ summary: summary.data, bySymbol: bySymbol.data, bySide: bySide.data });
        } catch (err) {
            set({ error: apiMessage(err) });
        } finally {
            set({ loading: false });
        }
    },
}));

// Re-sync analytics whenever the active account changes.
useAccountStore.subscribe((state, prev) => {
    if (state.activeId !== prev.activeId) useAnalyticsStore.getState().load();
});
