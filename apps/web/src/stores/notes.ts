'use client';

import { create } from 'zustand';

import { api, apiMessage } from '@/lib/api';
import { buildDemoNotes } from '@/lib/demo-data';
import { useAccountStore } from '@/stores/accounts';
import { useSessionStore } from '@/stores/session';
import { useTradesStore } from '@/stores/trades';

export interface ApiNote {
    id: string;
    account_id: string;
    trade_id: string;
    title: string;
    body: string;
    tags: string[];
    created_at: string;
}

export interface NotePayload {
    title: string;
    body: string;
    tags?: string[];
}

export type UpdateNotePayload = Partial<NotePayload>;

type NoteMutation =
    | { type: 'create'; tradeId: string }
    | { type: 'update'; id: string }
    | { type: 'delete'; id: string };

interface NoteContext {
    accountId: string;
    key: string;
    demo: boolean;
}

interface NotesStore {
    notes: ApiNote[];
    loading: boolean;
    loadError: string | null;
    loadedFor: string | null;
    pendingMutation: NoteMutation | null;
    load: () => Promise<void>;
    create: (tradeId: string, payload: NotePayload) => Promise<ApiNote>;
    update: (id: string, payload: UpdateNotePayload) => Promise<ApiNote>;
    remove: (id: string) => Promise<void>;
}

let requestVersion = 0;
let demoNoteSequence = 0;
let loadRequest: { key: string; promise: Promise<void> } | null = null;
let mutationRequest: Promise<unknown> | null = null;

function currentContext(): NoteContext | null {
    const session = useSessionStore.getState().session;
    const accountId = useAccountStore.getState().activeId;
    if (!accountId || (session.status !== 'user' && session.status !== 'demo')) return null;
    const owner = session.status === 'user' ? session.id : 'demo';
    return { accountId, key: `${owner}:${accountId}`, demo: session.status === 'demo' };
}

function requireContext(): NoteContext {
    const context = currentContext();
    if (!context) throw new Error('Create or select an account before managing notes');
    return context;
}

function createDemoNote(accountId: string, tradeId: string, payload: NotePayload): ApiNote {
    return {
        id: `demo-note-${Date.now()}-${++demoNoteSequence}`,
        account_id: accountId,
        trade_id: tradeId,
        title: payload.title,
        body: payload.body,
        tags: payload.tags ?? [],
        created_at: new Date().toISOString(),
    };
}

export const useNotesStore = create<NotesStore>()((set, get) => {
    function startMutation(mutation: NoteMutation, context: NoteContext) {
        if (mutationRequest) throw new Error('Please wait for the current note action');
        if (get().loading || get().loadedFor !== context.key) {
            throw new Error('Wait for the notes to finish loading');
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

    function contextStillMatches(context: NoteContext, version: number) {
        return version === requestVersion && currentContext()?.key === context.key;
    }

    return {
        notes: [],
        loading: true,
        loadError: null,
        loadedFor: null,
        pendingMutation: null,

        load: () => {
            const context = currentContext();
            if (!context) {
                ++requestVersion;
                loadRequest = null;
                set({
                    notes: [],
                    loading: false,
                    loadError: null,
                    loadedFor: null,
                });
                return Promise.resolve();
            }
            if (get().loadedFor === context.key && !get().loadError) return Promise.resolve();
            if (loadRequest?.key === context.key) return loadRequest.promise;
            if (mutationRequest) return Promise.resolve();

            if (context.demo) {
                const trades = useTradesStore
                    .getState()
                    .trades.filter((trade) => trade.account_id === context.accountId);
                set({
                    notes: buildDemoNotes(trades),
                    loadedFor: context.key,
                    loading: false,
                    loadError: null,
                });
                return Promise.resolve();
            }

            const version = ++requestVersion;
            set((state) => ({
                notes: state.loadedFor === context.key ? state.notes : [],
                loadedFor: state.loadedFor === context.key ? state.loadedFor : null,
                loading: true,
                loadError: null,
            }));
            const request = (async () => {
                try {
                    const { data } = await api.get<ApiNote[]>(
                        `/accounts/${context.accountId}/notes`,
                    );
                    if (!contextStillMatches(context, version)) return;
                    set({ notes: data, loadedFor: context.key });
                } catch (error) {
                    if (contextStillMatches(context, version)) {
                        set({ loadError: apiMessage(error) });
                    }
                } finally {
                    if (contextStillMatches(context, version)) {
                        loadRequest = null;
                        set({ loading: false });
                    }
                }
            })();
            loadRequest = { key: context.key, promise: request };
            return request;
        },

        create: (tradeId, payload) => {
            const context = requireContext();
            let version: number;
            try {
                version = startMutation({ type: 'create', tradeId }, context);
            } catch (error) {
                return Promise.reject(error);
            }

            const request = (async () => {
                if (
                    context.demo &&
                    !useTradesStore
                        .getState()
                        .trades.some(
                            (trade) =>
                                trade.id === tradeId && trade.account_id === context.accountId,
                        )
                ) {
                    throw new Error('Trade not found');
                }
                const note = context.demo
                    ? createDemoNote(context.accountId, tradeId, payload)
                    : (
                          await api.post<ApiNote>(
                              `/accounts/${context.accountId}/trades/${tradeId}/notes`,
                              payload,
                          )
                      ).data;
                if (!contextStillMatches(context, version)) {
                    throw new Error('Note account changed. Please try again.');
                }
                set((state) => ({ notes: [note, ...state.notes], loadError: null }));
                return note;
            })();
            mutationRequest = request;
            return request.finally(() => finishMutation(request));
        },

        update: (id, payload) => {
            const context = requireContext();
            let version: number;
            try {
                version = startMutation({ type: 'update', id }, context);
            } catch (error) {
                return Promise.reject(error);
            }

            const request = (async () => {
                const current = get().notes.find((note) => note.id === id);
                if (!current) throw new Error('Note not found');
                const note = context.demo
                    ? {
                          ...current,
                          ...payload,
                          tags: payload.tags ?? current.tags,
                      }
                    : (
                          await api.patch<ApiNote>(
                              `/accounts/${context.accountId}/notes/${id}`,
                              payload,
                          )
                      ).data;
                if (!contextStillMatches(context, version)) {
                    throw new Error('Note account changed. Please try again.');
                }
                set((state) => ({
                    notes: state.notes.map((item) => (item.id === id ? note : item)),
                    loadError: null,
                }));
                return note;
            })();
            mutationRequest = request;
            return request.finally(() => finishMutation(request));
        },

        remove: (id) => {
            const context = requireContext();
            let version: number;
            try {
                version = startMutation({ type: 'delete', id }, context);
            } catch (error) {
                return Promise.reject(error);
            }

            const request = (async () => {
                if (!get().notes.some((note) => note.id === id)) {
                    throw new Error('Note not found');
                }
                if (!context.demo) {
                    await api.delete(`/accounts/${context.accountId}/notes/${id}`);
                }
                if (!contextStillMatches(context, version)) {
                    throw new Error('Note account changed. Please try again.');
                }
                set((state) => ({
                    notes: state.notes.filter((note) => note.id !== id),
                    loadError: null,
                }));
            })();
            mutationRequest = request;
            return request.finally(() => finishMutation(request));
        },
    };
});

useAccountStore.subscribe((state, previousState) => {
    if (state.activeId === previousState.activeId) return;
    ++requestVersion;
    loadRequest = null;
    mutationRequest = null;
    useNotesStore.setState({
        notes: [],
        loading: state.activeId !== null,
        loadError: null,
        loadedFor: null,
        pendingMutation: null,
    });
    if (state.activeId) void useNotesStore.getState().load();
});

useTradesStore.subscribe((state, previousState) => {
    const context = currentContext();
    if (
        !context ||
        state.loadedFor !== context.key ||
        previousState.loadedFor !== context.key ||
        useNotesStore.getState().loadedFor !== context.key
    ) {
        return;
    }
    const tradeIds = new Set(state.trades.map((trade) => trade.id));
    const removedTradeIds = new Set(
        previousState.trades.filter((trade) => !tradeIds.has(trade.id)).map((trade) => trade.id),
    );
    if (removedTradeIds.size === 0) return;
    useNotesStore.setState((notesState) => ({
        notes: notesState.notes.filter((note) => !removedTradeIds.has(note.trade_id)),
    }));
});
