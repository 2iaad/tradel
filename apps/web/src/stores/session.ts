'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
import axios from 'axios';

export type Session =
    | { status: 'checking'; email: null }
    | { status: 'anon'; email: null }
    | { status: 'error'; email: null; message: string }
    | { status: 'user'; email: string }
    | { status: 'demo'; email: string };

interface SessionStore {
    session: Session;
    restore: () => Promise<void>;
    startDemo: () => void;
    signOut: () => Promise<void>;
}

const DEMO_KEY = 'tradel.demoSession';
let restoreRequest: Promise<void> | null = null;

const demoEnabled = () =>
    typeof window !== 'undefined' && sessionStorage.getItem(DEMO_KEY) === 'true';

export function clearDemoSession() {
    if (typeof window !== 'undefined') sessionStorage.removeItem(DEMO_KEY);
}

export function hasDashboardSession(session: Session) {
    return session.status === 'user' || session.status === 'demo';
}

export const useSessionStore = create<SessionStore>((set) => ({
    session: { status: 'checking', email: null },

    restore: () => {
        if (restoreRequest) return restoreRequest;

        restoreRequest = (async () => {
            if (demoEnabled()) {
                set({ session: { status: 'demo', email: 'demo@tradel.app' } });
                return;
            }

            try {
                const { data } = await api.get<{ id: string; email: string }>('/auth/me');
                set({ session: { status: 'user', email: data.email } });
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    set({ session: { status: 'anon', email: null } });
                    return;
                }

                set({
                    session: {
                        status: 'error',
                        email: null,
                        message: apiMessage(error),
                    },
                });

                throw error;
            }
        })().finally(() => {
            restoreRequest = null;
        });

        return restoreRequest;
    },

    startDemo: () => {
        if (typeof window !== 'undefined') sessionStorage.setItem(DEMO_KEY, 'true');
        set({ session: { status: 'demo', email: 'demo@tradel.app' } });
    },

    signOut: async () => {
        const demo = useSessionStore.getState().session.status === 'demo';
        if (!demo) await api.post('/auth/logout');
        clearDemoSession();
        set({ session: { status: 'anon', email: null } });
    },
}));
