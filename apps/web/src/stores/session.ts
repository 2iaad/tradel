'use client';

import axios from 'axios';
import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';

export type Session =
    | { status: 'checking'; email: null }
    | { status: 'anon'; email: null }
    | { status: 'error'; email: null; message: string }
    | { status: 'user'; email: string }
    | { status: 'demo'; email: string };

interface Credentials {
    email: string;
    password: string;
}

interface SessionStore {
    session: Session;
    restoring: boolean;
    pendingAction: 'login' | 'register' | 'logout' | null;
    restore: () => Promise<void>;
    login: (credentials: Credentials) => Promise<void>;
    register: (credentials: Credentials & { username: string }) => Promise<void>;
    startDemo: () => void;
    signOut: () => Promise<void>;
}

const DEMO_KEY = 'tradel.demoSession';

function demoEnabled() {
    try {
        return typeof window !== 'undefined' && window.sessionStorage.getItem(DEMO_KEY) === 'true';
    } catch {
        return false;
    }
}

function saveDemo(enabled: boolean) {
    if (typeof window === 'undefined') return;
    try {
        if (enabled) window.sessionStorage.setItem(DEMO_KEY, 'true');
        else window.sessionStorage.removeItem(DEMO_KEY);
    } catch {
        // Demo still works when browser storage is blocked.
    }
}

export function hasDashboardSession(session: Session) {
    return session.status === 'user' || session.status === 'demo';
}

export const useSessionStore = create<SessionStore>((set, get) => {
    let version = 0;
    let restoreRequest: Promise<void> | null = null;
    let actionRequest: Promise<void> | null = null;

    function invalidateRestore() {
        ++version;
        restoreRequest = null;
        set({ restoring: false });
    }

    function authenticate(action: 'login' | 'register', credentials: Credentials) {
        if (actionRequest)
            return Promise.reject(new Error('Please wait for the current session action'));
        invalidateRestore();
        const currentVersion = version;
        set({ pendingAction: action });

        const request = (async () => {
            await api.post(`/auth/${action}`, credentials);
            if (currentVersion !== version) throw new Error('Session changed. Please try again.');
            saveDemo(false);
            try {
                const { data } = await api.get<{ id: string; email: string }>('/auth/me');
                if (currentVersion !== version)
                    throw new Error('Session changed. Please try again.');
                set({ session: { status: 'user', email: data.email } });
            } catch (error) {
                if (currentVersion === version) {
                    set({ session: { status: 'error', email: null, message: apiMessage(error) } });
                }
                throw error;
            }
        })().finally(() => {
            actionRequest = null;
            set({ pendingAction: null });
        });
        actionRequest = request;
        return request;
    }

    return {
        session: { status: 'checking', email: null },
        restoring: false,
        pendingAction: null,

        restore: () => {
            if (actionRequest) return actionRequest;
            if (restoreRequest) return restoreRequest;
            if (get().session.status === 'demo' || demoEnabled()) {
                set({ session: { status: 'demo', email: 'demo@tradel.app' } });
                return Promise.resolve();
            }

            const currentVersion = ++version;
            set({ restoring: true });
            const request = (async () => {
                try {
                    const { data } = await api.get<{ id: string; email: string }>('/auth/me');
                    if (currentVersion !== version) return;
                    set({ session: { status: 'user', email: data.email } });
                } catch (error) {
                    if (currentVersion !== version) return;
                    if (axios.isAxiosError(error) && error.response?.status === 401) {
                        set({ session: { status: 'anon', email: null } });
                        return;
                    }
                    set({ session: { status: 'error', email: null, message: apiMessage(error) } });
                    throw error;
                } finally {
                    if (currentVersion === version) {
                        restoreRequest = null;
                        set({ restoring: false });
                    }
                }
            })();
            restoreRequest = request;
            return request;
        },

        login: (credentials) => authenticate('login', credentials),
        register: (credentials) => authenticate('register', credentials),

        startDemo: () => {
            invalidateRestore();
            saveDemo(true);
            set({ session: { status: 'demo', email: 'demo@tradel.app' } });
        },

        signOut: () => {
            if (actionRequest) {
                if (get().pendingAction === 'logout') return actionRequest;
                return Promise.reject(new Error('Please wait for the current session action'));
            }
            invalidateRestore();
            const currentVersion = version;
            const demo = get().session.status === 'demo';
            set({ pendingAction: 'logout' });
            const request = (async () => {
                if (!demo) await api.post('/auth/logout');
                if (currentVersion !== version)
                    throw new Error('Session changed. Please try again.');
                saveDemo(false);
                set({ session: { status: 'anon', email: null } });
            })().finally(() => {
                actionRequest = null;
                set({ pendingAction: null });
            });
            actionRequest = request;
            return request;
        },
    };
});
