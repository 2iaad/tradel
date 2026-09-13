'use client';

import { create } from 'zustand';

import { api } from '@/lib/api';

export type Session =
    | { status: 'checking'; email: null }
    | { status: 'anon'; email: null }
    | { status: 'user'; email: string }
    | { status: 'demo'; email: string };

interface SessionStore {
    session: Session;
    restore: () => Promise<void>;
    startDemo: () => void;
    signOut: () => Promise<void>;
}

const DEMO_KEY = 'tradel.demoSession';
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

    restore: async () => {
        if (demoEnabled()) {
            set({ session: { status: 'demo', email: 'demo@tradel.app' } });
            return;
        }

        try {
            const { data } = await api.get<{ id: string; email: string }>('/auth/me');
            set({ session: { status: 'user', email: data.email } });
        } catch {
            set({ session: { status: 'anon', email: null } });
        }
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
