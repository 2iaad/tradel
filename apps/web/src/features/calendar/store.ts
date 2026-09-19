'use client';

import { create } from 'zustand';

import { useAccountStore } from '@/features/accounts/store';
import { useSessionStore } from '@/features/auth/store';
import { buildDemoCalendar } from '@/features/demo/demo-data';
import { useTradesStore } from '@/features/trades/store';
import { api, apiMessage } from '@/lib/api';

import type { CalendarDay } from './types';

interface CalendarContext {
    accountId: string;
    key: string;
    demo: boolean;
}

interface CalendarStore {
    month: string;
    days: CalendarDay[];
    loading: boolean;
    loadError: string | null;
    loadedFor: string | null;
    stale: boolean;
    load: (month: string) => Promise<void>;
}

const thisMonth = () => new Date().toISOString().slice(0, 7);
let requestVersion = 0;
let loadRequest: { key: string; promise: Promise<void> } | null = null;

function currentContext(): CalendarContext | null {
    const session = useSessionStore.getState().session;
    const accountId = useAccountStore.getState().activeId;
    if (!accountId || (session.status !== 'user' && session.status !== 'demo')) return null;
    const owner = session.status === 'user' ? session.id : 'demo';
    return { accountId, key: `${owner}:${accountId}`, demo: session.status === 'demo' };
}

function validMonth(month: string) {
    if (!/^\d{4}-\d{2}$/.test(month)) return false;
    const monthNumber = Number(month.slice(5));
    return monthNumber >= 1 && monthNumber <= 12;
}

function calendarKey(context: CalendarContext, month: string) {
    return `${context.key}:${month}`;
}

export const useCalendarStore = create<CalendarStore>()((set, get) => ({
    month: thisMonth(),
    days: [],
    loading: true,
    loadError: null,
    loadedFor: null,
    stale: true,

    load: (month) => {
        if (!validMonth(month)) {
            return Promise.reject(new Error("Month must use the 'YYYY-MM' format"));
        }

        const context = currentContext();
        if (!context) {
            ++requestVersion;
            loadRequest = null;
            set({
                month,
                days: [],
                loading: false,
                loadError: null,
                loadedFor: null,
                stale: true,
            });
            return Promise.resolve();
        }

        const key = calendarKey(context, month);
        set({ month });
        if (loadRequest?.key === key) return loadRequest.promise;
        if (get().loadedFor === key && !get().stale && !get().loadError) {
            return Promise.resolve();
        }

        if (context.demo) {
            const trades = useTradesStore
                .getState()
                .trades.filter((trade) => trade.account_id === context.accountId);
            set({
                days: buildDemoCalendar(trades, month),
                loading: false,
                loadError: null,
                loadedFor: key,
                stale: false,
            });
            return Promise.resolve();
        }

        const version = ++requestVersion;
        const keepCurrentData = get().loadedFor === key;
        set({
            days: keepCurrentData ? get().days : [],
            loading: true,
            loadError: null,
        });
        const request = (async () => {
            try {
                const { data } = await api.get<CalendarDay[]>(
                    `/accounts/${context.accountId}/analytics/calendar?month=${month}`,
                );
                if (
                    version !== requestVersion ||
                    currentContext()?.key !== context.key ||
                    get().month !== month
                ) {
                    return;
                }
                set({ days: data, loadedFor: key, stale: false });
            } catch (error) {
                if (
                    version === requestVersion &&
                    currentContext()?.key === context.key &&
                    get().month === month
                ) {
                    set({ loadError: apiMessage(error) });
                }
            } finally {
                if (
                    version === requestVersion &&
                    currentContext()?.key === context.key &&
                    get().month === month
                ) {
                    loadRequest = null;
                    set({ loading: false });
                }
            }
        })();
        loadRequest = { key, promise: request };
        return request;
    },
}));

useAccountStore.subscribe((state, previousState) => {
    if (state.activeId === previousState.activeId) return;
    ++requestVersion;
    loadRequest = null;
    useCalendarStore.setState({
        days: [],
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
    const calendar = useCalendarStore.getState();
    if (
        !calendar.loadedFor?.startsWith(`${context.key}:`) &&
        !loadRequest?.key.startsWith(context.key)
    ) {
        return;
    }
    ++requestVersion;
    loadRequest = null;
    useCalendarStore.setState({ loading: false, loadError: null, stale: true });
});
