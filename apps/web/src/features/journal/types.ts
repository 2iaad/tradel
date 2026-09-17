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
