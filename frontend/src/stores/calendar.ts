'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
import { buildDemoCalendar } from '@/lib/demo-data';
import { useAccountStore } from '@/stores/accounts';
import { useSessionStore } from '@/stores/session';
import { useTradesStore } from '@/stores/trades';

// One day's totals plus the per-trade breakdown, mirroring AnalyticsService.CalendarDay.
export interface CalendarTrade {
    symbol: string;
    pnl: number | null;
}

export interface CalendarDay {
    date: string; // 'YYYY-MM-DD'
    pnl: number;
    trades: number;
    items: CalendarTrade[];
}

interface CalendarStore {
    month: string; // 'YYYY-MM'
    days: CalendarDay[];
    loading: boolean;
    error: string | null;
    load: (month: string) => Promise<void>;
}

const activeId = () => useAccountStore.getState().activeId;
const thisMonth = () => new Date().toISOString().slice(0, 7);

export const useCalendarStore = create<CalendarStore>((set) => ({
    month: thisMonth(),
    days: [],
    loading: true,
    error: null,

    // GET the calendar for one month of the active account.
    load: async (month) => {
        set({ month });
        const status = useSessionStore.getState().session.status;
        const accId = activeId();
        if (status === 'demo') {
            const trades = useTradesStore
                .getState()
                .trades.filter((trade) => trade.account_id === accId);
            set({ days: buildDemoCalendar(trades, month), loading: false, error: null });
            return;
        }
        if (status !== 'user') {
            set({ loading: false });
            return;
        }
        if (!accId) {
            set({ days: [], loading: false });
            return;
        }
        set({ loading: true, error: null });
        try {
            const { data } = await api.get<CalendarDay[]>(
                `/accounts/${accId}/analytics/calendar?month=${month}`,
            );
            set({ days: data });
        } catch (err) {
            set({ error: apiMessage(err) });
        } finally {
            set({ loading: false });
        }
    },
}));

// Reload the current month whenever the active account changes.
useAccountStore.subscribe((state, prev) => {
    if (state.activeId !== prev.activeId)
        useCalendarStore.getState().load(useCalendarStore.getState().month);
});
