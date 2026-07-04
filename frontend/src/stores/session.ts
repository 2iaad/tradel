'use client';

import { create } from 'zustand';

import { api } from '@/lib/api';
import { emailFromToken } from '@/lib/format';

export type Session =
    | { status: 'checking'; email: null }
    | { status: 'guest'; email: null }
    | { status: 'user'; email: string };

interface SessionStore {
    session: Session;
    restore: () => Promise<void>;
    signOut: () => Promise<void>;
}

// Access token lives in memory only (see .docs/access-and-refresh-tokens.md);
// the refresh token stays in the httpOnly cookie the backend sets.
let accessToken: string | null = null;

export const useSessionStore = create<SessionStore>((set) => ({
    session: { status: 'checking', email: null },

    restore: async () => {
        // In-memory token if we have one, else try the refresh cookie.
        let token = accessToken;
        if (!token) {
            try {
                const { data } = await api.post('/auth/refresh');
                accessToken = data.accessToken;
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
            set({ session: { status: 'guest', email: null } });
        }
    },

    signOut: async () => {
        await api.post('/auth/logout');
        accessToken = null;
        set({ session: { status: 'guest', email: null } });
    },
}));
