'use client';

import { create } from 'zustand';

import { logout, restoreSession } from '@/lib/api';
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

// Global auth session: bootstrapped from the refresh cookie, cleared on sign-out.
export const useSessionStore = create<SessionStore>((set) => ({
    session: { status: 'checking', email: null },
    restore: async () => {
        const token = await restoreSession();
        const email = token && emailFromToken(token);
        set({ session: email ? { status: 'user', email } : { status: 'guest', email: null } });
    },
    signOut: async () => {
        await logout();
        set({ session: { status: 'guest', email: null } });
    },
}));

// Read the current session (keeps the discriminated-union narrowing at call sites).
export const useSession = () => useSessionStore((s) => s.session);
