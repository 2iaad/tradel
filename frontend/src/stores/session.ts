'use client';

import { create } from 'zustand';

import { api, getAccessToken, setAccessToken } from '@/lib/api';
import { emailFromToken } from '@/lib/format';

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
            setAccessToken(null);
            set({ session: { status: 'demo', email: 'demo@tradel.app' } });
            return;
        }

        // In-memory token if we have one, else try the refresh cookie.
        let token = getAccessToken();
        if (!token) {
            try {
                const { data } = await api.post('/auth/refresh');
                setAccessToken(data.accessToken);
                token = data.accessToken;
            } catch {
                token = null; // invalid/expired refresh token
            }
        }

        let email = null;
        if (token) {
            email = emailFromToken(token);
        }

        if (email) {
            set({ session: { status: 'user', email: email } });
        } else {
            set({ session: { status: 'anon', email: null } });
        }
    },

    startDemo: () => {
        if (typeof window !== 'undefined') sessionStorage.setItem(DEMO_KEY, 'true');
        setAccessToken(null);
        set({ session: { status: 'demo', email: 'demo@tradel.app' } });
    },

    signOut: async () => {
        const demo = useSessionStore.getState().session.status === 'demo';
        if (!demo) await api.post('/auth/logout');
        clearDemoSession();
        setAccessToken(null);
        set({ session: { status: 'anon', email: null } });
    },
}));
