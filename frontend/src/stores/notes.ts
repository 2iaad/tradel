'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
import { useAccountStore } from '@/stores/accounts';
import { useSessionStore } from '@/stores/session';

// Note as returned by the notes API.
export interface ApiNote {
    id: string;
    account_id: string;
    trade_id: string;
    title: string;
    body: string;
    tags: string[];
    created_at: string;
}

// Body for POST/PATCH notes; mirrors CreateNoteDto/UpdateNoteDto.
export interface NotePayload {
    title: string;
    body: string;
    tags?: string[];
}

interface NotesStore {
    notes: ApiNote[];
    loading: boolean;
    error: string | null;
    load: () => Promise<void>;
    create: (tradeId: string, payload: NotePayload) => Promise<void>;
    update: (id: string, payload: NotePayload) => Promise<void>;
    remove: (id: string) => Promise<void>;
}

// Active account id lives in the accounts store; every request is scoped to it.
const activeId = () => useAccountStore.getState().activeId;

export const useNotesStore = create<NotesStore>((set, get) => ({
    notes: [],
    loading: true,
    error: null,

    // GET /accounts/:activeId/notes. No active account → empty list.
    load: async () => {
        if (useSessionStore.getState().session.status !== 'user') {
            set({ loading: false });
            return;
        }
        const accId = activeId();
        if (!accId) {
            set({ notes: [], loading: false });
            return;
        }
        set({ loading: true, error: null });
        try {
            const { data } = await api.get<ApiNote[]>(`/accounts/${accId}/notes`);
            set({ notes: data });
        } catch (err) {
            set({ error: apiMessage(err) });
        } finally {
            set({ loading: false });
        }
    },

    // POST a note under a trade (create is trade-scoped), then re-sync.
    // Errors propagate to the caller (the form renders them). tradeId rides
    // the body too because CreateNoteDto requires it.
    create: async (tradeId, payload) => {
        const accId = activeId();
        if (!accId) throw new Error('No account selected');
        await api.post(`/accounts/${accId}/trades/${tradeId}/notes`, { ...payload, tradeId });
        await get().load();
    },

    // PATCH /accounts/:activeId/notes/:id (title/body/tags only), then re-sync.
    update: async (id, payload) => {
        const accId = activeId();
        if (!accId) throw new Error('No account selected');
        await api.patch(`/accounts/${accId}/notes/${id}`, payload);
        await get().load();
    },

    // DELETE a note and drop it from the list.
    remove: async (id) => {
        const accId = activeId();
        if (!accId) return;
        await api.delete(`/accounts/${accId}/notes/${id}`);
        set({ notes: get().notes.filter((n) => n.id !== id) });
    },
}));

// Re-sync notes whenever the active account changes.
useAccountStore.subscribe((state, prev) => {
    if (state.activeId !== prev.activeId) useNotesStore.getState().load();
});
