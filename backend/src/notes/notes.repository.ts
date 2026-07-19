import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

export interface Note {
    id: string;
    account_id: string;
    trade_id: string;
    title: string;
    body: string;
    tags: string[];
    created_at: Date;
}

interface CreateNoteFields {
    title: string;
    body: string;
    tags?: string[];
}

interface UpdateNoteFields {
    title?: string;
    body?: string;
    tags?: string[];
}

@Injectable()
export class NotesRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(account_id: string, trade_id: string, fields: CreateNoteFields): Promise<Note> {
        const { rows } = await this.db.query<Note>(
            `INSERT INTO notes (account_id, trade_id, title, body, tags)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [account_id, trade_id, fields.title, fields.body, fields.tags ?? []],
        );
        return rows[0];
    }

    async findOne(id: string, account_id: string): Promise<Note | null> {
        const { rows } = await this.db.query<Note>(
            `SELECT * FROM notes WHERE id = $1 AND account_id = $2`,
            [id, account_id],
        );
        return rows[0] ?? null; // ?? null incase the note not found
    }

    async findAllByAccount(account_id: string): Promise<Note[]> {
        const { rows } = await this.db.query<Note>(
            `SELECT * FROM notes WHERE account_id = $1
            ORDER BY created_at DESC`,
            [account_id],
        );
        return rows;
    }

    async update(id: string, account_id: string, fields: UpdateNoteFields): Promise<Note | null> {
        const { rows } = await this.db.query<Note>(
            `UPDATE notes SET
            title = COALESCE($1, title),
            body = COALESCE($2, body),
            tags = COALESCE($3, tags)

            WHERE id = $4 AND account_id = $5

            RETURNING *`,
            [fields.title ?? null, fields.body ?? null, fields.tags ?? null, id, account_id],
        );
        // COALESCE($1, title) in Postgres means use the value that is not null.

        return rows[0] ?? null;
    }

    async remove(id: string, account_id: string): Promise<boolean> {
        const { rowCount } = await this.db.query(
            `DELETE FROM notes WHERE id = $1 AND account_id = $2`,
            [id, account_id],
        );
        return rowCount !== null && rowCount > 0;
    }
}
