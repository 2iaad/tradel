'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
import { useSessionStore } from '@/stores/session';

// Trading account as returned by the accounts API.
export interface Account {
    id: string;
    name: string;
    broker: string | null;
    currency: string;
}

// Body for POST/PATCH accounts; mirrors CreateAccountDto/UpdateAccountDto.
export interface AccountPayload {
    name?: string;
    broker?: string;
    currency?: string;
}

// ponytail: active account id persisted in localStorage — no server-side
// "last selected" column until multi-device sync is a real requirement.
const ACTIVE_KEY = 'tradel.activeAccount';
const readActive = () =>
    typeof window === 'undefined' ? null : localStorage.getItem(ACTIVE_KEY);
const writeActive = (id: string | null) => {
    if (typeof window === 'undefined') return;
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
};

interface AccountsStore {
    accounts: Account[];
    activeId: string | null;
    loading: boolean;
    error: string | null;
    load: () => Promise<void>;
    create: (payload: AccountPayload) => Promise<void>;
    rename: (id: string, payload: AccountPayload) => Promise<void>;
    remove: (id: string) => Promise<void>;
    setActive: (id: string) => void;
}

export const useAccountStore = create<AccountsStore>((set, get) => ({
    accounts: [],
    activeId: null,
    loading: true,
    error: null,

    // GET /accounts, then resolve the active id: keep the persisted one if it
    // still exists, else fall back to the first account (or null when empty).
    load: async () => {
        if (useSessionStore.getState().session.status !== 'user') {
            set({ loading: false });
            return;
        }
        set({ loading: true, error: null });
        try {
            const { data } = await api.get<Account[]>('/accounts');
            const persisted = readActive();
            const active = data.some((a) => a.id === persisted)
                ? persisted
                : (data[0]?.id ?? null);
            writeActive(active);
            set({ accounts: data, activeId: active });
        } catch (err) {
            set({ error: apiMessage(err) });
        } finally {
            set({ loading: false });
        }
    },

    // POST /accounts, refresh the list, and make the new account active.
    create: async (payload) => {
        const { data } = await api.post<Account>('/accounts', payload);
        const { data: accounts } = await api.get<Account[]>('/accounts');
        writeActive(data.id);
        set({ accounts, activeId: data.id });
    },

    // PATCH /accounts/:id, then refresh the list.
    rename: async (id, payload) => {
        await api.patch(`/accounts/${id}`, payload);
        const { data } = await api.get<Account[]>('/accounts');
        set({ accounts: data });
    },

    // DELETE /accounts/:id, refresh, and re-point the active account if the
    // deleted one was selected.
    remove: async (id) => {
        await api.delete(`/accounts/${id}`);
        const { data } = await api.get<Account[]>('/accounts');
        let active = get().activeId;
        if (active === id) {
            active = data[0]?.id ?? null;
            writeActive(active);
        }
        set({ accounts: data, activeId: active });
    },

    setActive: (id) => {
        writeActive(id);
        set({ activeId: id });
    },
}));
