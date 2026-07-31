'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
import { useAccountStore } from '@/stores/accounts';
import { useSessionStore } from '@/stores/session';

// One day's totals, mirroring AnalyticsService.CalendarDay.
export interface CalendarDay {
    date: string; // 'YYYY-MM-DD'
    pnl: number;
    trades: number;
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
        if (useSessionStore.getState().session.status !== 'user') {
            set({ loading: false });
            return;
        }
        const accId = activeId();
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
