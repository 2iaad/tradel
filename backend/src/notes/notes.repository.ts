import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

interface Note {
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
    tags: string[];
}

interface UpdateNoteFields {
    title: string;
    body: string;
    tags: string[];
}

@Injectable()
export class NotesRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(account_id: string, trade_id: string, fields: CreateNoteFields): Promise<Note> {
        const { rows } = await this.db.query<Note>(
            `INSERT INTO notes (account_id, trade_id, title, body, tags)
            VALUES ($1, $2, $3, 4$, 5$)
            RETURNING *`,
            [account_id, trade_id, fields.title, fields.body, fields.tags ?? []],
        );
        return rows[0];
    }

    async findOne(id: string): Promise<Note | null> {
        const { rows } = await this.db.query<Note>('', []);
        return rows[0] ?? null;
    }

    async findAllByAccount(account_id: string, trade_id?: string): Promise<Note[]> {
        const { rows } = await this.db.query<Note>(
            `SELECT * FROM notes WHERE account_id = $1 AND trade_id = $2
                 ORDER BY created_at DESC`,
            [account_id, trade_id],
        );
        return rows;
    }

    async update(id: string, fields: UpdateNoteFields): Promise<Note | null> {}

    async remove(id: string): Promise<boolean> {
        const { rowCount } = await this.db.query('', []);
        return rowCount !== null && rowCount > 0;
    }
}
