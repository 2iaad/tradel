import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

export interface Trade {
    id: string;
    account_id: string;
    symbol: string;
    side: string;
    entry: string;
    exit: string | null;
    size: string;
    r: string | null;
    pnl: string | null;
    opened_at: Date;
    closed_at: Date | null;
    created_at: Date;
}

export interface CreateTradeFields {
    symbol: string;
    side: string;
    entry: number;
    exit?: number | null;
    size: number;
    r?: number | null;
    pnl?: number | null;
    opened_at: string;
    closed_at?: string | null;
}

export interface UpdateTradeFields {
    symbol?: string;
    side?: string;
    entry?: number;
    exit?: number | null;
    size?: number;
    r?: number | null;
    pnl?: number | null;
    opened_at?: string;
    closed_at?: string | null;
}

@Injectable()
export class TradesRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(account_id: string, fields: CreateTradeFields): Promise<Trade> {
        const { rows } = await this.db.query<Trade>(
            `INSERT INTO trades (account_id, symbol, side, entry, exit, size, r, pnl, opened_at, closed_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                account_id,
                fields.symbol,
                fields.side,
                fields.entry,
                fields.exit ?? null,
                fields.size,
                fields.r ?? null,
                fields.pnl ?? null,
                fields.opened_at,
                fields.closed_at ?? null,
            ],
        );
        return rows[0];
    }

    async findAllByAccount(account_id: string): Promise<Trade[]> {
        const { rows } = await this.db.query<Trade>(
            `SELECT * FROM trades WHERE account_id = $1 ORDER BY opened_at DESC`,
            [account_id],
        );
        return rows;
    }

    async findOne(id: string, account_id: string): Promise<Trade | null> {
        const { rows } = await this.db.query<Trade>(
            `SELECT * FROM trades WHERE id = $1 AND account_id = $2`,
            [id, account_id],
        );
        return rows[0] ?? null;
    }

    async update(id: string, account_id: string, fields: UpdateTradeFields): Promise<Trade | null> {
        // Build the SET clause only from the fields that were actually passed,
        // so PATCH with a partial body doesn't overwrite columns with undefined.
        const columns: string[] = [];
        const values: unknown[] = [];
        let i = 1;

        for (const key of [
            'symbol',
            'side',
            'entry',
            'exit',
            'size',
            'r',
            'pnl',
            'opened_at',
            'closed_at',
        ] as const) {
            if (fields[key] !== undefined) {
                columns.push(`${key} = $${i}`);
                values.push(fields[key]);
                i++;
            }
        }

        // Nothing to update: just return the current row (still owner-scoped).
        if (columns.length === 0) {
            return this.findOne(id, account_id);
        }

        values.push(id, account_id);

        const { rows } = await this.db.query<Trade>(
            `UPDATE trades SET ${columns.join(', ')}
            WHERE id = $${i} AND account_id = $${i + 1}
            RETURNING *`,
            values,
        );
        return rows[0] ?? null;
    }

    async remove(id: string, account_id: string): Promise<boolean> {
        const { rowCount } = await this.db.query(
            `DELETE FROM trades WHERE id = $1 AND account_id = $2`,
            [id, account_id],
        );
        return rowCount !== null && rowCount > 0;
    }
}
