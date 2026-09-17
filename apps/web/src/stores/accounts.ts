'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
import { DEMO_ACCOUNT } from '@/lib/demo-data';
import type { Session } from './session';
import { useSessionStore } from './session';

export interface Account {
    id: string;
    name: string;
    broker: string | null;
    currency: string;
    starting_balance: string;
}

export interface AccountPayload {
    name: string;
    broker?: string;
    currency?: string;
    startingBalance: number;
}

type AccountMutation =
    { type: 'create' } | { type: 'update'; id: string } | { type: 'delete'; id: string };

interface AccountsStore {
    accounts: Account[];
    activeId: string | null;
    loadedFor: string | null;
    loading: boolean;
    loadError: string | null;
    pendingMutation: AccountMutation | null;
    load: () => Promise<void>;
    create: (payload: AccountPayload) => Promise<Account>;
    update: (id: string, payload: Partial<AccountPayload>) => Promise<Account>;
    remove: (id: string) => Promise<void>;
    setActive: (id: string) => void;
}

const ACTIVE_KEY_PREFIX = 'tradel.activeAccount.';
const LEGACY_ACTIVE_KEY = 'tradel.activeAccount';
let requestVersion = 0;
let demoAccountSequence = 0;
let loadRequest: { owner: string; promise: Promise<void> } | null = null;
let mutationRequest: Promise<unknown> | null = null;

function sessionOwner(session: Session): string | null {
    if (session.status === 'user') return session.id;
    if (session.status === 'demo') return 'demo';
    return null;
}

function readActive(userId: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return (
            window.localStorage.getItem(`${ACTIVE_KEY_PREFIX}${userId}`) ??
            window.localStorage.getItem(LEGACY_ACTIVE_KEY)
        );
    } catch {
        return null;
    }
}

function writeActive(userId: string, accountId: string | null) {
    if (typeof window === 'undefined') return;
    try {
        const key = `${ACTIVE_KEY_PREFIX}${userId}`;
        if (accountId) window.localStorage.setItem(key, accountId);
        else window.localStorage.removeItem(key);
        window.localStorage.removeItem(LEGACY_ACTIVE_KEY);
    } catch {
        // Account selection still works when browser storage is blocked.
    }
}

function requireOwner() {
    const session = useSessionStore.getState().session;
    const owner = sessionOwner(session);
    if (!owner) throw new Error('Sign in before managing accounts');
    return { owner, demo: session.status === 'demo' };
}

function demoAccount(payload: AccountPayload): Account {
    return {
        id: `demo-account-${Date.now()}-${++demoAccountSequence}`,
        name: payload.name,
        broker: payload.broker ?? null,
        currency: payload.currency ?? 'USD',
        starting_balance: String(payload.startingBalance),
    };
}

export const useAccountStore = create<AccountsStore>()((set, get) => {
    function startMutation(mutation: AccountMutation, owner: string) {
        if (mutationRequest) throw new Error('Please wait for the current account action');
        if (get().loading || get().loadedFor !== owner) {
            throw new Error('Wait for your accounts to finish loading');
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

    return {
        accounts: [],
        activeId: null,
        loadedFor: null,
        loading: true,
        loadError: null,
        pendingMutation: null,

        load: () => {
            const session = useSessionStore.getState().session;
            const owner = sessionOwner(session);
            if (!owner) {
                ++requestVersion;
                loadRequest = null;
                set({
                    accounts: [],
                    activeId: null,
                    loadedFor: null,
                    loading: false,
                    loadError: null,
                });
                return Promise.resolve();
            }
            if (loadRequest?.owner === owner) return loadRequest.promise;

            if (session.status === 'demo') {
                if (get().loadedFor === owner && !get().loadError) return Promise.resolve();
                set({
                    accounts: [{ ...DEMO_ACCOUNT }],
                    activeId: DEMO_ACCOUNT.id,
                    loadedFor: owner,
                    loading: false,
                    loadError: null,
                });
                return Promise.resolve();
            }

            const version = ++requestVersion;
            set({ loading: true, loadError: null });
            const request = (async () => {
                try {
                    const { data } = await api.get<Account[]>('/accounts');
                    if (
                        version !== requestVersion ||
                        sessionOwner(useSessionStore.getState().session) !== owner
                    ) {
                        return;
                    }
                    const currentId = get().activeId;
                    const savedId = readActive(owner);
                    const activeId =
                        data.find((account) => account.id === currentId)?.id ??
                        data.find((account) => account.id === savedId)?.id ??
                        data[0]?.id ??
                        null;
                    writeActive(owner, activeId);
                    set({ accounts: data, activeId, loadedFor: owner });
                } catch (error) {
                    if (version === requestVersion) set({ loadError: apiMessage(error) });
                } finally {
                    if (version === requestVersion) {
                        loadRequest = null;
                        set({ loading: false });
                    }
                }
            })();
            loadRequest = { owner, promise: request };
            return request;
        },

        create: (payload) => {
            const { owner, demo } = requireOwner();
            let version: number;
            try {
                version = startMutation({ type: 'create' }, owner);
            } catch (error) {
                return Promise.reject(error);
            }

            const request = (async () => {
                const account = demo
                    ? demoAccount(payload)
                    : (await api.post<Account>('/accounts', payload)).data;
                if (
                    version !== requestVersion ||
                    sessionOwner(useSessionStore.getState().session) !== owner
                ) {
                    throw new Error('Account session changed. Please try again.');
                }
                if (!demo) writeActive(owner, account.id);
                set((state) => ({
                    accounts: [...state.accounts, account],
                    activeId: account.id,
                    loadedFor: owner,
                    loadError: null,
                }));
                return account;
            })();
            mutationRequest = request;
            return request.finally(() => finishMutation(request));
        },

        update: (id, payload) => {
            const { owner, demo } = requireOwner();
            let version: number;
            try {
                version = startMutation({ type: 'update', id }, owner);
            } catch (error) {
                return Promise.reject(error);
            }

            const request = (async () => {
                const current = get().accounts.find((account) => account.id === id);
                if (!current) throw new Error('Account not found');
                const account = demo
                    ? {
                          ...current,
                          name: payload.name ?? current.name,
                          broker: payload.broker ?? current.broker,
                          currency: payload.currency ?? current.currency,
                          starting_balance:
                              payload.startingBalance === undefined
                                  ? current.starting_balance
                                  : String(payload.startingBalance),
                      }
                    : (await api.patch<Account>(`/accounts/${id}`, payload)).data;
                if (
                    version !== requestVersion ||
                    sessionOwner(useSessionStore.getState().session) !== owner
                ) {
                    throw new Error('Account session changed. Please try again.');
                }
                set((state) => ({
                    accounts: state.accounts.map((item) => (item.id === id ? account : item)),
                }));
                return account;
            })();
            mutationRequest = request;
            return request.finally(() => finishMutation(request));
        },

        remove: (id) => {
            const { owner, demo } = requireOwner();
            let version: number;
            try {
                version = startMutation({ type: 'delete', id }, owner);
            } catch (error) {
                return Promise.reject(error);
            }

            const request = (async () => {
                if (!get().accounts.some((account) => account.id === id)) {
                    throw new Error('Account not found');
                }
                if (!demo) await api.delete(`/accounts/${id}`);
                if (
                    version !== requestVersion ||
                    sessionOwner(useSessionStore.getState().session) !== owner
                ) {
                    throw new Error('Account session changed. Please try again.');
                }
                const accounts = get().accounts.filter((account) => account.id !== id);
                const activeId = get().activeId === id ? (accounts[0]?.id ?? null) : get().activeId;
                if (!demo) writeActive(owner, activeId);
                set({ accounts, activeId });
            })();
            mutationRequest = request;
            return request.finally(() => finishMutation(request));
        },

        setActive: (id) => {
            if (id === get().activeId || !get().accounts.some((account) => account.id === id)) {
                return;
            }
            const { owner, demo } = requireOwner();
            if (!demo) writeActive(owner, id);
            set({ activeId: id });
        },
    };
});

useSessionStore.subscribe((state, previousState) => {
    const owner = sessionOwner(state.session);
    if (owner === sessionOwner(previousState.session)) return;
    ++requestVersion;
    loadRequest = null;
    mutationRequest = null;
    useAccountStore.setState({
        accounts: [],
        activeId: null,
        loadedFor: null,
        loading: owner !== null,
        loadError: null,
        pendingMutation: null,
    });
});
