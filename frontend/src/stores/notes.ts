'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
import { buildDemoNotes } from '@/lib/demo-data';
import { useAccountStore } from '@/stores/accounts';
import { useSessionStore } from '@/stores/session';
import { useTradesStore } from '@/stores/trades';

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
    loadedFor: string | null;
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
    loadedFor: null,

    // GET /accounts/:activeId/notes. No active account → empty list.
    load: async () => {
        const status = useSessionStore.getState().session.status;
        const accId = activeId();
        if (status === 'demo') {
            if (get().loadedFor === accId) {
                set({ loading: false });
                return;
            }
            const trades = useTradesStore
                .getState()
                .trades.filter((trade) => trade.account_id === accId);
            set({
                notes: accId ? buildDemoNotes(trades) : [],
                loadedFor: accId,
                loading: false,
                error: null,
            });
            return;
        }
        if (status !== 'user') {
            set({ loading: false });
            return;
        }
        if (!accId) {
            set({ notes: [], loadedFor: null, loading: false });
            return;
        }
        set({ loading: true, error: null });
        try {
            const { data } = await api.get<ApiNote[]>(`/accounts/${accId}/notes`);
            set({ notes: data, loadedFor: accId });
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
        if (useSessionStore.getState().session.status === 'demo') {
            const note: ApiNote = {
                id: `demo-note-${Date.now()}`,
                account_id: accId,
                trade_id: tradeId,
                title: payload.title,
                body: payload.body,
                tags: payload.tags ?? [],
                created_at: new Date().toISOString(),
            };
            set({ notes: [note, ...get().notes] });
            return;
        }
        await api.post(`/accounts/${accId}/trades/${tradeId}/notes`, { ...payload, tradeId });
        await get().load();
    },

    // PATCH /accounts/:activeId/notes/:id (title/body/tags only), then re-sync.
    update: async (id, payload) => {
        const accId = activeId();
        if (!accId) throw new Error('No account selected');
        if (useSessionStore.getState().session.status === 'demo') {
            set({
                notes: get().notes.map((note) =>
                    note.id === id
                        ? { ...note, ...payload, tags: payload.tags ?? [] }
                        : note,
                ),
            });
            return;
        }
        await api.patch(`/accounts/${accId}/notes/${id}`, payload);
        await get().load();
    },

    // DELETE a note and drop it from the list.
    remove: async (id) => {
        const accId = activeId();
        if (!accId) return;
        if (useSessionStore.getState().session.status === 'demo') {
            set({ notes: get().notes.filter((note) => note.id !== id) });
            return;
        }
        await api.delete(`/accounts/${accId}/notes/${id}`);
        set({ notes: get().notes.filter((n) => n.id !== id) });
    },
}));

// Re-sync notes whenever the active account changes.
useAccountStore.subscribe((state, prev) => {
    if (state.activeId !== prev.activeId) useNotesStore.getState().load();
});
