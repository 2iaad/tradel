'use client';

import { create } from 'zustand';

import { api, getAccessToken, setAccessToken } from '@/lib/api';
import { emailFromToken } from '@/lib/format';

export type Session =
    | { status: 'checking'; email: null }
    | { status: 'anon'; email: null }
    | { status: 'user'; email: string };

interface SessionStore {
    session: Session;
    restore: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const useSessionStore = create<SessionStore>((set) => ({
    session: { status: 'checking', email: null },

    restore: async () => {
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

    signOut: async () => {
        await api.post('/auth/logout');
        setAccessToken(null);
        set({ session: { status: 'anon', email: null } });
    },
}));
